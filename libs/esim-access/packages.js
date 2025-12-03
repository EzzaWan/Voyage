"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackagesService = void 0;
class PackagesService {
    constructor(client) {
        this.client = client;
    }
    async getAllPackages(params) {
        return this.client.post('/package/list', params);
    }
    async getPackagesByLocation(locationCode) {
        return this.getAllPackages({ locationCode, type: 'BASE' });
    }
    async getTopupPlans(input) {
        return this.getAllPackages(Object.assign(Object.assign({}, input), { type: 'TOPUP' }));
    }
    async getPackageDetails(packageCodeOrSlug) {
        return this.getAllPackages({ packageCode: packageCodeOrSlug });
    }
    async getSupportedRegions() {
        return this.client.post('/location/list');
    }
}
exports.PackagesService = PackagesService;
//# sourceMappingURL=packages.js.map