"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageService = void 0;
class UsageService {
    constructor(client) {
        this.client = client;
    }
    async getUsage(esimTranNoList) {
        return this.client.post('/esim/usage/query', { esimTranNoList });
    }
}
exports.UsageService = UsageService;
//# sourceMappingURL=usage.js.map