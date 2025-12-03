"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EsimAccessClient = void 0;
const axios_1 = require("axios");
const auth_1 = require("./auth");
class EsimAccessClient {
    constructor(config) {
        this.lastRequestTime = 0;
        this.minRequestInterval = 125;
        this.config = Object.assign({ baseUrl: 'https://api.esimaccess.com/api/v1/open' }, config);
        this.axiosInstance = axios_1.default.create({
            baseURL: this.config.baseUrl,
            timeout: 10000,
        });
        this.axiosInstance.interceptors.request.use(async (req) => {
            await this.waitForRateLimit();
            const headers = (0, auth_1.generateHeaders)(this.config.accessCode, this.config.secretKey, req.data);
            Object.assign(req.headers, headers);
            return req;
        });
    }
    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLast = now - this.lastRequestTime;
        if (timeSinceLast < this.minRequestInterval) {
            const waitTime = this.minRequestInterval - timeSinceLast;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        this.lastRequestTime = Date.now();
    }
    async request(method, url, data, config) {
        try {
            const response = await this.axiosInstance.request(Object.assign({ method,
                url,
                data }, config));
            const resBody = response.data;
            if (resBody.success === 'false' || (resBody.errorCode && resBody.errorCode !== '0')) {
            }
            return resBody;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                if (error.response && [429, 500].includes(error.response.status)) {
                }
            }
            throw error;
        }
    }
    async get(url, config) {
        return this.request('GET', url, undefined, config);
    }
    async post(url, data, config) {
        return this.request('POST', url, data, config);
    }
}
exports.EsimAccessClient = EsimAccessClient;
//# sourceMappingURL=client.js.map