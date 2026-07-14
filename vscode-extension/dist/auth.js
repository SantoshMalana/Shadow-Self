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
exports.AuthManager = void 0;
const vscode = __importStar(require("vscode"));
const SECRET_KEY = 'shadowShelf.apiKey';
const USER_ID_KEY = 'shadowShelf.userId';
class AuthManager {
    constructor(context) {
        this.context = context;
    }
    async getApiKey() {
        return this.context.secrets.get(SECRET_KEY);
    }
    async getUserId() {
        return this.context.globalState.get(USER_ID_KEY);
    }
    async promptAndSaveApiKey(serverUrl) {
        const input = await vscode.window.showInputBox({
            title: 'Shadow Shelf — Connect Jarvis Mode',
            prompt: 'Paste your Shadow Shelf API key (find it in Settings → API Key on shadowshelfai.com)',
            password: true,
            ignoreFocusOut: true,
            validateInput: (val) => {
                if (!val || val.trim().length < 20) {
                    return 'API key looks too short. Please copy it directly from your Shadow Shelf settings.';
                }
                return null;
            }
        });
        if (!input) {
            return false;
        }
        return this.saveApiKey(input.trim(), serverUrl);
    }
    async saveApiKey(apiKey, serverUrl) {
        // Validate the key against the server and get userId
        try {
            const res = await fetch(`${serverUrl}/api/user/apikey/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            if (!res.ok) {
                vscode.window.showErrorMessage('Shadow Shelf: Invalid API key. Please check your key on shadowshelfai.com and try again.');
                return false;
            }
            const data = await res.json();
            // Securely store key
            await this.context.secrets.store(SECRET_KEY, apiKey);
            // Store userId in global state (not sensitive)
            await this.context.globalState.update(USER_ID_KEY, data.userId);
            vscode.window.showInformationMessage(`✅ Shadow Shelf: Jarvis Mode activated for ${data.name}. Scout is now watching silently.`);
            return true;
        }
        catch (err) {
            vscode.window.showErrorMessage('Shadow Shelf: Could not connect to shadowshelfai.com. Check your internet connection.');
            return false;
        }
    }
    async clearApiKey() {
        await this.context.secrets.delete(SECRET_KEY);
        await this.context.globalState.update(USER_ID_KEY, undefined);
        vscode.window.showInformationMessage('Shadow Shelf: Signed out. Scout is now inactive.');
    }
    async isAuthenticated() {
        const key = await this.getApiKey();
        const userId = await this.getUserId();
        return !!(key && userId);
    }
}
exports.AuthManager = AuthManager;
//# sourceMappingURL=auth.js.map