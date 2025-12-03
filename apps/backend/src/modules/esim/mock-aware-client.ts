import { EsimAccessClient } from '../../../../../libs/esim-access/client';
import { BaseResponse } from '../../../../../libs/esim-access/types';

export class MockAwareClient {
  private realClient: EsimAccessClient;
  private mockEnabled: () => Promise<boolean>;
  private mockHandler: (endpoint: string, data?: any) => Promise<any>;

  constructor(
    realClient: EsimAccessClient,
    mockEnabled: () => Promise<boolean>,
    mockHandler: (endpoint: string, data?: any) => Promise<any>
  ) {
    this.realClient = realClient;
    this.mockEnabled = mockEnabled;
    this.mockHandler = mockHandler;
  }

  async request<T>(method: string, url: string, data?: any, config?: any): Promise<BaseResponse<T>> {
    const isMock = await this.mockEnabled();
    if (isMock) {
      return this.mockHandler(url, data);
    }
    return this.realClient.request<T>(method, url, data, config);
  }

  async get<T>(url: string, config?: any): Promise<BaseResponse<T>> {
    const isMock = await this.mockEnabled();
    if (isMock) {
      return this.mockHandler(url);
    }
    return this.realClient.get<T>(url, config);
  }

  async post<T>(url: string, data?: any, config?: any): Promise<BaseResponse<T>> {
    const isMock = await this.mockEnabled();
    if (isMock) {
      return this.mockHandler(url, data);
    }
    return this.realClient.post<T>(url, data, config);
  }
}

