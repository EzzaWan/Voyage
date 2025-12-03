import { AxiosRequestConfig } from 'axios';
import { BaseResponse } from './types';
export interface EsimAccessConfig {
    accessCode: string;
    secretKey: string;
    baseUrl?: string;
}
export declare class EsimAccessClient {
    private axiosInstance;
    private config;
    private lastRequestTime;
    private readonly minRequestInterval;
    constructor(config: EsimAccessConfig);
    private waitForRateLimit;
    request<T>(method: string, url: string, data?: any, config?: AxiosRequestConfig): Promise<BaseResponse<T>>;
    get<T>(url: string, config?: AxiosRequestConfig): Promise<BaseResponse<T>>;
    post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<BaseResponse<T>>;
}
