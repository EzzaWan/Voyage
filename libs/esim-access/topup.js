"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopUpService = void 0;
class TopUpService {
    constructor(client) {
        this.client = client;
    }
    async topupProfile(payload) {
        return this.client.post('/esim/topup', payload);
    }
}
exports.TopUpService = TopUpService;
//# sourceMappingURL=topup.js.map