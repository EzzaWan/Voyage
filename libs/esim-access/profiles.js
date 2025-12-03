"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfilesService = void 0;
class ProfilesService {
    constructor(client) {
        this.client = client;
    }
    async cancel(payload) {
        return this.client.post('/esim/cancel', payload);
    }
    async suspend(payload) {
        return this.client.post('/esim/suspend', payload);
    }
    async unsuspend(payload) {
        return this.client.post('/esim/unsuspend', payload);
    }
    async revoke(payload) {
        return this.client.post('/esim/revoke', payload);
    }
}
exports.ProfilesService = ProfilesService;
//# sourceMappingURL=profiles.js.map