import * as vscode from 'vscode'

const SECRET_KEY = 'shadowShelf.apiKey'
const USER_ID_KEY = 'shadowShelf.userId'

export class AuthManager {
  private context: vscode.ExtensionContext

  constructor(context: vscode.ExtensionContext) {
    this.context = context
  }

  async getApiKey(): Promise<string | undefined> {
    return this.context.secrets.get(SECRET_KEY)
  }

  async getUserId(): Promise<string | undefined> {
    return this.context.globalState.get<string>(USER_ID_KEY)
  }

  async promptAndSaveApiKey(serverUrl: string): Promise<boolean> {
    const input = await vscode.window.showInputBox({
      title: 'Shadow Shelf — Connect Jarvis Mode',
      prompt: 'Paste your Shadow Shelf API key (find it in Settings → API Key on shadowshelfai.com)',
      password: true,
      ignoreFocusOut: true,
      validateInput: (val) => {
        if (!val || val.trim().length < 20) {
          return 'API key looks too short. Please copy it directly from your Shadow Shelf settings.'
        }
        return null
      }
    })

    if (!input) {
      return false
    }

    return this.saveApiKey(input.trim(), serverUrl)
  }

  async saveApiKey(apiKey: string, serverUrl: string): Promise<boolean> {
    // Validate the key against the server and get userId
    try {
      const res = await fetch(`${serverUrl}/api/user/apikey/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      })

      if (!res.ok) {
        vscode.window.showErrorMessage('Shadow Shelf: Invalid API key. Please check your key on shadowshelfai.com and try again.')
        return false
      }

      const data = await res.json() as { userId: string; name: string }

      // Securely store key
      await this.context.secrets.store(SECRET_KEY, apiKey)
      // Store userId in global state (not sensitive)
      await this.context.globalState.update(USER_ID_KEY, data.userId)

      vscode.window.showInformationMessage(
        `✅ Shadow Shelf: Jarvis Mode activated for ${data.name}. Scout is now watching silently.`
      )
      return true

    } catch (err) {
      vscode.window.showErrorMessage('Shadow Shelf: Could not connect to shadowshelfai.com. Check your internet connection.')
      return false
    }
  }

  async clearApiKey(): Promise<void> {
    await this.context.secrets.delete(SECRET_KEY)
    await this.context.globalState.update(USER_ID_KEY, undefined)
    vscode.window.showInformationMessage('Shadow Shelf: Signed out. Scout is now inactive.')
  }

  async isAuthenticated(): Promise<boolean> {
    const key = await this.getApiKey()
    const userId = await this.getUserId()
    return !!(key && userId)
  }
}
