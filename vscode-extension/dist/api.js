"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClient = void 0;
class ApiClient {
    constructor(serverUrl, apiKey, userId) {
        this.serverUrl = serverUrl.replace(/\/$/, '');
        this.apiKey = apiKey;
        this.userId = userId;
    }
    async sendPing(ping) {
        try {
            const res = await fetch(`${this.serverUrl}/api/scout/ping`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    userId: this.userId,
                    ...ping
                })
            });
            if (!res.ok) {
                const body = await res.text();
                console.error(`[Shadow Shelf Scout] Ping failed (${res.status}): ${body}`);
            }
        }
        catch (err) {
            // Silently fail — never crash the user's VS Code for a telemetry error
            console.error('[Shadow Shelf Scout] Network error on ping:', err);
        }
    }
    async sendBoundary(boundary) {
        try {
            const res = await fetch(`${this.serverUrl}/api/scout/boundary`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    userId: this.userId,
                    boundary
                })
            });
            if (!res.ok) {
                console.error(`[Shadow Shelf Scout] Boundary failed (${res.status})`);
            }
        }
        catch (err) {
            console.error('[Shadow Shelf Scout] Network error on boundary:', err);
        }
    }
    async getSessionSummary() {
        try {
            const res = await fetch(`${this.serverUrl}/api/scout/summary?userId=${this.userId}`, {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });
            if (!res.ok) {
                return null;
            }
            const data = await res.json();
            return data.summary;
        }
        catch {
            return null;
        }
    }
}
exports.ApiClient = ApiClient;
//# sourceMappingURL=api.js.map