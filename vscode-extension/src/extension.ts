import * as vscode from 'vscode'
import { AuthManager } from './auth'
import { ApiClient } from './api'
import { ScoutWatcher } from './scout'

let statusBarItem: vscode.StatusBarItem
let scoutWatcher: ScoutWatcher | undefined
let outputChannel: vscode.OutputChannel

export async function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('Shadow Shelf Scout')
  context.subscriptions.push(outputChannel)

  const auth = new AuthManager(context)

  // ── Status bar ────────────────────────────────────────────────────────────
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
  statusBarItem.command = 'shadowShelf.showStatus'
  context.subscriptions.push(statusBarItem)
  updateStatusBar(false)
  statusBarItem.show()

  // ── Register commands ─────────────────────────────────────────────────────

  context.subscriptions.push(
    vscode.commands.registerCommand('shadowShelf.setApiKey', async () => {
      const config = vscode.workspace.getConfiguration('shadowShelf')
      const serverUrl = config.get<string>('serverUrl') ?? 'https://shadowshelfai.com'
      
      const action = await vscode.window.showInformationMessage(
        'Shadow Shelf: Ready to connect your account?',
        'Sign In',
        'Enter API Key manually'
      )
      
      if (action === 'Sign In') {
        vscode.env.openExternal(vscode.Uri.parse(`${serverUrl}/vscode-auth`))
      } else if (action === 'Enter API Key manually') {
        const success = await auth.promptAndSaveApiKey(serverUrl)
        if (success) {
          await startScout(context, auth)
          updateStatusBar(true)
        }
      }
    })
  )

  // ── URI Handler for Magic Link Login ──────────────────────────────────────
  context.subscriptions.push(
    vscode.window.registerUriHandler({
      handleUri: async (uri: vscode.Uri) => {
        if (uri.path === '/auth') {
          const query = new URLSearchParams(uri.query)
          const key = query.get('key')
          if (key) {
            const config = vscode.workspace.getConfiguration('shadowShelf')
            const serverUrl = config.get<string>('serverUrl') ?? 'https://shadowshelfai.com'
            const success = await auth.saveApiKey(key, serverUrl)
            if (success) {
              await startScout(context, auth)
              updateStatusBar(true)
            }
          }
        }
      }
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('shadowShelf.clearApiKey', async () => {
      scoutWatcher?.stop()
      scoutWatcher = undefined
      await auth.clearApiKey()
      updateStatusBar(false)
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('shadowShelf.showStatus', async () => {
      const isAuthed = await auth.isAuthenticated()
      if (!isAuthed) {
        const action = await vscode.window.showInformationMessage(
          'Shadow Shelf: Jarvis Mode is not active. Connect your account to enable it.',
          'Connect Account'
        )
        if (action === 'Connect Account') {
          await vscode.commands.executeCommand('shadowShelf.setApiKey')
        }
        return
      }

      // Fetch and show today's session summary
      const apiKey = await auth.getApiKey()
      const userId = await auth.getUserId()
      const config = vscode.workspace.getConfiguration('shadowShelf')
      const serverUrl = config.get<string>('serverUrl') ?? 'https://shadowshelfai.com'

      const client = new ApiClient(serverUrl, apiKey!, userId!)
      const summary = await client.getSessionSummary()

      vscode.window.showInformationMessage(
        `🧠 Shadow Shelf Scout — ${summary ?? 'No friction events recorded today yet.'}`
      )
    })
  )

  // ── Auto-start if already authenticated ───────────────────────────────────
  const isAuthed = await auth.isAuthenticated()
  if (isAuthed) {
    await startScout(context, auth)
    updateStatusBar(true)
  } else {
    // Show one-time welcome prompt
    const hasSeenWelcome = context.globalState.get<boolean>('hasSeenWelcome')
    if (!hasSeenWelcome) {
      await context.globalState.update('hasSeenWelcome', true)
      const action = await vscode.window.showInformationMessage(
        '👋 Shadow Shelf is installed! Connect your account to activate Jarvis Mode.',
        'Connect Account',
        'Later'
      )
      if (action === 'Connect Account') {
        await vscode.commands.executeCommand('shadowShelf.setApiKey')
      }
    }
  }
}

async function startScout(context: vscode.ExtensionContext, auth: AuthManager) {
  const apiKey = await auth.getApiKey()
  const userId = await auth.getUserId()

  if (!apiKey || !userId) { return }

  const config = vscode.workspace.getConfiguration('shadowShelf')
  const serverUrl = config.get<string>('serverUrl') ?? 'https://shadowshelfai.com'
  const enabled = config.get<boolean>('enabled') ?? true

  if (!enabled) {
    outputChannel.appendLine('Shadow Shelf Scout is disabled in settings.')
    return
  }

  const client = new ApiClient(serverUrl, apiKey, userId)

  scoutWatcher?.stop()
  scoutWatcher = new ScoutWatcher(client, outputChannel)
  scoutWatcher.start()
}

function updateStatusBar(active: boolean) {
  if (active) {
    statusBarItem.text = '$(eye) Shadow Shelf'
    statusBarItem.tooltip = 'Shadow Shelf Jarvis Mode is active. Click to see today\'s summary.'
    statusBarItem.backgroundColor = undefined
  } else {
    statusBarItem.text = '$(eye-closed) Shadow Shelf'
    statusBarItem.tooltip = 'Shadow Shelf: Click to connect your account and activate Jarvis Mode.'
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground')
  }
}

export function deactivate() {
  scoutWatcher?.stop()
}
