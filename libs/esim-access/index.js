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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EsimAccess = void 0;
__exportStar(require("./auth"), exports);
__exportStar(require("./types"), exports);
__exportStar(require("./client"), exports);
__exportStar(require("./packages"), exports);
__exportStar(require("./orders"), exports);
__exportStar(require("./query"), exports);
__exportStar(require("./profiles"), exports);
__exportStar(require("./topup"), exports);
__exportStar(require("./usage"), exports);
__exportStar(require("./webhooks"), exports);
const client_1 = require("./client");
const packages_1 = require("./packages");
const orders_1 = require("./orders");
const query_1 = require("./query");
const profiles_1 = require("./profiles");
const topup_1 = require("./topup");
const usage_1 = require("./usage");
const webhooks_1 = require("./webhooks");
class EsimAccess {
    constructor(config) {
        this.client = new client_1.EsimAccessClient(config);
        this.packages = new packages_1.PackagesService(this.client);
        this.orders = new orders_1.OrdersService(this.client);
        this.query = new query_1.QueryService(this.client);
        this.profiles = new profiles_1.ProfilesService(this.client);
        this.topup = new topup_1.TopUpService(this.client);
        this.usage = new usage_1.UsageService(this.client);
        this.webhooks = new webhooks_1.WebhooksService(config.secretKey, config.accessCode);
    }
}
exports.EsimAccess = EsimAccess;
//# sourceMappingURL=index.js.map