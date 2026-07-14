"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const auth_1 = require("./auth");
const api_1 = require("./api");
const scout_1 = require("./scout");
let statusBarItem;
let scoutWatcher;
let outputChannel;
async function activate(context) {
    outputChannel = vscode.window.createOutputChannel('Shadow Shelf Scout');
    context.subscriptions.push(outputChannel);
    const auth = new auth_1.AuthManager(context);
    // ── Status bar ────────────────────────────────────────────────────────────
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'shadowShelf.showStatus';
    context.subscriptions.push(statusBarItem);
    updateStatusBar(false);
    statusBarItem.show();
    // ── Register commands ─────────────────────────────────────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('shadowShelf.setApiKey', async () => {
        const config = vscode.workspace.getConfiguration('shadowShelf');
        const serverUrl = config.get('serverUrl') ?? 'https://shadowshelfai.com';
        const action = await vscode.window.showInformationMessage('Shadow Shelf: Ready to connect your account?', 'Sign In', 'Enter API Key manually');
        if (action === 'Sign In') {
            vscode.env.openExternal(vscode.Uri.parse(`${serverUrl}/vscode-auth`));
        }
        else if (action === 'Enter API Key manually') {
            const success = await auth.promptAndSaveApiKey(serverUrl);
            if (success) {
                await startScout(context, auth);
                updateStatusBar(true);
            }
        }
    }));
    // ── URI Handler for Magic Link Login ──────────────────────────────────────
    context.subscriptions.push(vscode.window.registerUriHandler({
        handleUri: async (uri) => {
            if (uri.path === '/auth') {
                const query = new URLSearchParams(uri.query);
                const key = query.get('key');
                if (key) {
                    const config = vscode.workspace.getConfiguration('shadowShelf');
                    const serverUrl = config.get('serverUrl') ?? 'https://shadowshelfai.com';
                    const success = await auth.saveApiKey(key, serverUrl);
                    if (success) {
                        await startScout(context, auth);
                        updateStatusBar(true);
                    }
                }
            }
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('shadowShelf.clearApiKey', async () => {
        scoutWatcher?.stop();
        scoutWatcher = undefined;
        await auth.clearApiKey();
        updateStatusBar(false);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('shadowShelf.showStatus', async () => {
        const isAuthed = await auth.isAuthenticated();
        if (!isAuthed) {
            const action = await vscode.window.showInformationMessage('Shadow Shelf: Jarvis Mode is not active. Connect your account to enable it.', 'Connect Account');
            if (action === 'Connect Account') {
                await vscode.commands.executeCommand('shadowShelf.setApiKey');
            }
            return;
        }
        // Fetch and show today's session summary
        const apiKey = await auth.getApiKey();
        const userId = await auth.getUserId();
        const config = vscode.workspace.getConfiguration('shadowShelf');
        const serverUrl = config.get('serverUrl') ?? 'https://shadowshelfai.com';
        const client = new api_1.ApiClient(serverUrl, apiKey, userId);
        const summary = await client.getSessionSummary();
        vscode.window.showInformationMessage(`🧠 Shadow Shelf Scout — ${summary ?? 'No friction events recorded today yet.'}`);
    }));
    // ── Auto-start if already authenticated ───────────────────────────────────
    const isAuthed = await auth.isAuthenticated();
    if (isAuthed) {
        await startScout(context, auth);
        updateStatusBar(true);
    }
    else {
        // Show one-time welcome prompt
        const hasSeenWelcome = context.globalState.get('hasSeenWelcome');
        if (!hasSeenWelcome) {
            await context.globalState.update('hasSeenWelcome', true);
            const action = await vscode.window.showInformationMessage('👋 Shadow Shelf is installed! Connect your account to activate Jarvis Mode.', 'Connect Account', 'Later');
            if (action === 'Connect Account') {
                await vscode.commands.executeCommand('shadowShelf.setApiKey');
            }
        }
    }
}
async function startScout(context, auth) {
    const apiKey = await auth.getApiKey();
    const userId = await auth.getUserId();
    if (!apiKey || !userId) {
        return;
    }
    const config = vscode.workspace.getConfiguration('shadowShelf');
    const serverUrl = config.get('serverUrl') ?? 'https://shadowshelfai.com';
    const enabled = config.get('enabled') ?? true;
    if (!enabled) {
        outputChannel.appendLine('Shadow Shelf Scout is disabled in settings.');
        return;
    }
    const client = new api_1.ApiClient(serverUrl, apiKey, userId);
    scoutWatcher?.stop();
    scoutWatcher = new scout_1.ScoutWatcher(client, outputChannel);
    scoutWatcher.start();
}
function updateStatusBar(active) {
    if (active) {
        statusBarItem.text = '$(eye) Shadow Shelf';
        statusBarItem.tooltip = 'Shadow Shelf Jarvis Mode is active. Click to see today\'s summary.';
        statusBarItem.backgroundColor = undefined;
    }
    else {
        statusBarItem.text = '$(eye-closed) Shadow Shelf';
        statusBarItem.tooltip = 'Shadow Shelf: Click to connect your account and activate Jarvis Mode.';
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
}
function deactivate() {
    scoutWatcher?.stop();
}
//# sourceMappingURL=extension.js.map