"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryService = void 0;
class QueryService {
    constructor(client) {
        this.client = client;
    }
    async queryProfiles(params) {
        return this.client.post('/esim/query', params);
    }
}
exports.QueryService = QueryService;
//# sourceMappingURL=query.js.map