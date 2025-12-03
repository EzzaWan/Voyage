"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
class OrdersService {
    constructor(client) {
        this.client = client;
    }
    async orderProfiles(payload) {
        return this.client.post('/esim/order', payload);
    }
}
exports.OrdersService = OrdersService;
//# sourceMappingURL=orders.js.map