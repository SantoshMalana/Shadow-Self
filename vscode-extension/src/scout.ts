import * as vscode from 'vscode'
import { ApiClient } from './api'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

// Error patterns we watch for in terminal output
const ERROR_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /TypeError/i, label: 'TypeError' },
  { pattern: /ReferenceError/i, label: 'ReferenceError' },
  { pattern: /SyntaxError/i, label: 'SyntaxError' },
  { pattern: /Cannot find module/i, label: 'ModuleNotFound' },
  { pattern: /ECONNREFUSED/i, label: 'ConnectionRefused' },
  { pattern: /ETIMEDOUT/i, label: 'Timeout' },
  { pattern: /ENOENT/i, label: 'FileNotFound' },
  { pattern: /segmentation fault/i, label: 'SegFault' },
  { pattern: /error TS\d+/i, label: 'TypeScriptError' },
  { pattern: /build failed/i, label: 'BuildFailed' },
  { pattern: /test.*failed/i, label: 'TestFailed' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Scout Watcher Class
// ─────────────────────────────────────────────────────────────────────────────

export class ScoutWatcher {
  private api: ApiClient
  private disposables: vscode.Disposable[] = []
  private idleTimer: NodeJS.Timeout | undefined
  private lastSaveTime: number = Date.now()
  private recentFileHops: number[] = []  // timestamps of file switches
  private idleThresholdMs: number
  private fileHopWindowMs: number
  private outputChannel: vscode.OutputChannel

  constructor(api: ApiClient, outputChannel: vscode.OutputChannel) {
    this.api = api
    this.outputChannel = outputChannel

    const config = vscode.workspace.getConfiguration('shadowShelf')
    this.idleThresholdMs = (config.get<number>('idleThresholdSeconds') ?? 120) * 1000
    this.fileHopWindowMs = (config.get<number>('fileHopWindowSeconds') ?? 60) * 1000
  }

  start(): void {
    this.log('Scout Watcher started. Watching silently...')

    // ── Watcher 1: Idle detection ─────────────────────────────────────────
    // Reset a timer every time the user types
    const typeWatcher = vscode.workspace.onDidChangeTextDocument(() => {
      this.resetIdleTimer()
    })

    // ── Watcher 2: File hop detection ─────────────────────────────────────
    const fileHopWatcher = vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (!editor) { return }
      const now = Date.now()

      // Clean up old hops outside the measurement window
      this.recentFileHops = this.recentFileHops.filter(t => now - t < this.fileHopWindowMs)
      this.recentFileHops.push(now)

      const hopsPerMinute = (this.recentFileHops.length / this.fileHopWindowMs) * 60000

      this.log(`File hop detected. Rate: ${hopsPerMinute.toFixed(1)} hops/min`)

      // Send a ping with the current rate
      this.api.sendPing({
        signalType: 'file_hop_rate',
        value: parseFloat(hopsPerMinute.toFixed(2)),
        context: { file: editor.document.fileName }
      })
    })

    // ── Watcher 3: Save detection (boundary trigger) ──────────────────────
    const saveWatcher = vscode.workspace.onDidSaveTextDocument((doc) => {
      const now = Date.now()
      const gapSeconds = (now - this.lastSaveTime) / 1000
      this.lastSaveTime = now

      this.log(`File saved. Gap since last save: ${gapSeconds.toFixed(0)}s`)

      // Report the save gap as a signal
      this.api.sendPing({
        signalType: 'save_gap',
        value: parseFloat(gapSeconds.toFixed(1)),
        context: { file: doc.fileName }
      })

      // A save is always a workflow boundary — trigger queue processing
      if (gapSeconds > 60) {
        // Only treat as meaningful boundary if gap was > 1 minute
        this.log('Triggering workflow boundary: post_save_after_gap')
        this.api.sendBoundary('post_save_after_gap')
      }
    })

    // ── Watcher 4: Terminal error detection ───────────────────────────────
    // onDidWriteTerminalData requires VS Code 1.93+ — cast safely for compatibility
    const windowAny = vscode.window as unknown as {
      onDidWriteTerminalData?: (cb: (e: { data: string }) => void) => vscode.Disposable
    }
    const terminalWatcher = windowAny.onDidWriteTerminalData
      ? windowAny.onDidWriteTerminalData((event) => {
          const text = event.data

          for (const { pattern, label } of ERROR_PATTERNS) {
            if (pattern.test(text)) {
              this.log(`Terminal error detected: ${label}`)
              this.api.sendPing({
                signalType: 'error_class',
                value: label,
                context: { raw: text.slice(0, 200) }
              })
              break
            }
          }

          if (/✓ compiled|tests passed|build succeeded/i.test(text)) {
            this.log('Triggering workflow boundary: post_build')
            this.api.sendBoundary('post_build')
          }
        })
      : new vscode.Disposable(() => {}) // no-op fallback for older VS Code

    this.disposables.push(typeWatcher, fileHopWatcher, saveWatcher, terminalWatcher)

    // Start idle timer immediately
    this.resetIdleTimer()
  }

  stop(): void {
    this.log('Scout Watcher stopped.')
    this.disposables.forEach(d => d.dispose())
    this.disposables = []
    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
    }
  }

  private resetIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
    }

    const startTime = Date.now()

    this.idleTimer = setTimeout(async () => {
      const idleSeconds = Math.round((Date.now() - startTime) / 1000)
      this.log(`Idle threshold reached: ${idleSeconds}s`)

      await this.api.sendPing({
        signalType: 'idle_seconds',
        value: idleSeconds,
        context: {
          activeFile: vscode.window.activeTextEditor?.document.fileName
        }
      })
    }, this.idleThresholdMs)
  }

  private log(message: string): void {
    this.outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] ${message}`)
  }
}
