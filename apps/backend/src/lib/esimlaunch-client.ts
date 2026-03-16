/**
 * eSIMLaunch API client — drop-in replacement for EsimAccess when ESIM_PROVIDER=esimlaunch.
 * Maps Voyage's expected request/response shapes to esimlaunch API (GET /api/v1/packages, etc.).
 */
import axios, { AxiosInstance } from 'axios';

export interface EsimLaunchConfig {
  baseUrl: string;   // e.g. https://api.esimlaunch.com
  apiKey: string;
}

interface BaseResponse<T = any> {
  success: string;
  errorCode?: string | null;
  errorMessage?: string | null;
  obj?: T;
}

export class EsimLaunchClient {
  readonly http: AxiosInstance;
  private config: EsimLaunchConfig;

  constructor(config: EsimLaunchConfig) {
    this.config = config;
    this.http = axios.create({
      baseURL: config.baseUrl.replace(/\/$/, ''),
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
    });
  }

  /** Map esimlaunch API response to Voyage's expected BaseResponse (success as string "true"/"false") */
  private toBaseResponse<T>(data: any): BaseResponse<T> {
    const success = data?.success === true ? 'true' : 'false';
    return {
      success,
      errorCode: data?.errorCode ?? null,
      errorMessage: data?.errorMessage ?? null,
      obj: data?.obj ?? data?.data,
    };
  }

  async request<T>(method: string, url: string, data?: any): Promise<BaseResponse<T>> {
    try {
      if (url === '/location/list' && method === 'POST') {
        const res = await this.http.get('/api/v1/regions');
        // esimlaunch backend returns EsimAccess shape: { success, obj: { locationList: [...] } } or { success, obj: [...] }
        const raw = res.data?.obj ?? res.data?.data ?? [];
        const list = Array.isArray(raw) ? raw : (raw?.locationList ?? []);
        const locationList = Array.isArray(list) ? list.map((r: any) => ({
          code: r.code ?? '',
          name: r.name ?? '',
          type: r.type ?? 1,
          subLocation: r.subLocationList,
        })) : [];
        return this.toBaseResponse<T>({ obj: { locationList }, success: true });
      }
      if (url === '/esim/query' && method === 'POST' && data?.orderNo) {
        const res = await this.http.get(`/api/v1/orders/${data.orderNo}`, {
          params: { pager: data.pager },
        });
        const out = res.data?.obj ?? res.data;
        const esimList = out?.esimList ?? [];
        return this.toBaseResponse<T>({ obj: { esimList }, success: true });
      }
      const res = await this.http.request({ method, url, data });
      return this.toBaseResponse<T>(res.data);
    } catch (err: any) {
      const status = err.response?.status;
      const body = err.response?.data;
      return this.toBaseResponse({
        success: 'false',
        errorCode: body?.errorCode ?? String(status),
        errorMessage: body?.errorMessage ?? err.message,
      });
    }
  }

  async post<T>(url: string, data?: any): Promise<BaseResponse<T>> {
    return this.request<T>('POST', url, data);
  }

  async get<T>(url: string): Promise<BaseResponse<T>> {
    return this.request<T>('GET', url);
  }
}

/** Packages service — maps to GET /api/v1/packages */
export class EsimLaunchPackagesService {
  constructor(private client: EsimLaunchClient) {}

  async getAllPackages(params: { locationCode?: string; type?: string; packageCode?: string; slug?: string; iccid?: string }) {
    const qs = new URLSearchParams();
    if (params.locationCode) qs.set('locationCode', params.locationCode);
    if (params.type) qs.set('type', params.type);
    if (params.packageCode) qs.set('packageCode', params.packageCode ?? '');
    if (params.slug) qs.set('slug', params.slug ?? '');
    if (params.iccid) qs.set('iccid', params.iccid ?? '');
    const url = `/api/v1/packages?${qs.toString()}`;
    const response = await this.client.http.get(url);
    const data = response.data;
    const packageList = data?.obj?.packageList ?? data?.packageList ?? [];
    return { success: 'true', obj: { packageList } };
  }

  async getPackagesByLocation(locationCode: string) {
    return this.getAllPackages({ locationCode, type: 'BASE' });
  }

  async getTopupPlans(input: { locationCode?: string; iccid?: string }) {
    return this.getAllPackages({ ...input, type: 'TOPUP' });
  }

  async getPackageDetails(packageCodeOrSlug: string) {
    return this.getAllPackages({ packageCode: packageCodeOrSlug });
  }
}

/** Orders — POST /api/v1/orders */
export class EsimLaunchOrdersService {
  constructor(private client: EsimLaunchClient) {}

  async orderProfiles(payload: { transactionId: string; amount?: number; packageInfoList: any[] }) {
    const res = await this.client.http.post('/api/v1/orders', payload);
    const data = res.data;
    const orderNo = data?.obj?.orderNo ?? data?.orderNo;
    return { success: orderNo ? 'true' : 'false', obj: orderNo ? { orderNo } : undefined, errorCode: data?.errorCode, errorMessage: data?.errorMessage };
  }
}

/** Query — GET /api/v1/profiles or /api/v1/orders/:orderNo */
export class EsimLaunchQueryService {
  constructor(private client: EsimLaunchClient) {}

  async queryProfiles(params: { orderNo?: string; iccid?: string; esimTranNo?: string; pager?: { pageNum: number; pageSize: number } }) {
    if (params.orderNo) {
      const res = await this.client.http.get(`/api/v1/orders/${params.orderNo}`);
      const data = res.data?.obj ?? res.data;
      const esimList = data?.esimList ?? [];
      return { success: 'true', obj: { esimList } };
    }
    const qs = new URLSearchParams();
    if (params.iccid) qs.set('iccid', params.iccid ?? '');
    if (params.esimTranNo) qs.set('esimTranNo', params.esimTranNo ?? '');
    if (params.pager) {
      qs.set('pageNum', String(params.pager.pageNum));
      qs.set('pageSize', String(params.pager.pageSize));
    }
    const res = await this.client.http.get(`/api/v1/profiles?${qs.toString()}`);
    const data = res.data?.obj ?? res.data;
    const esimList = data?.esimList ?? [];
    return { success: 'true', obj: { esimList, pager: data?.pager } };
  }
}

/** Profiles — suspend / unsuspend / revoke */
export class EsimLaunchProfilesService {
  constructor(private client: EsimLaunchClient) {}

  async suspend(payload: { iccid?: string; esimTranNo?: string }) {
    const id = payload.esimTranNo || payload.iccid;
    if (!id) return { success: 'false', errorMessage: 'esimTranNo or iccid required' };
    const res = await this.client.http.post(`/api/v1/profiles/${id}/suspend`, {});
    return { success: res.data?.success === true ? 'true' : 'false', errorMessage: res.data?.errorMessage };
  }

  async unsuspend(payload: { esimTranNo?: string }) {
    const id = payload.esimTranNo;
    if (!id) return { success: 'false', errorMessage: 'esimTranNo required' };
    const res = await this.client.http.post(`/api/v1/profiles/${id}/unsuspend`, {});
    return { success: res.data?.success === true ? 'true' : 'false', errorMessage: res.data?.errorMessage };
  }

  async revoke(payload: { esimTranNo?: string }) {
    const id = payload.esimTranNo;
    if (!id) return { success: 'false', errorMessage: 'esimTranNo required' };
    const res = await this.client.http.post(`/api/v1/profiles/${id}/revoke`, {});
    return { success: res.data?.success === true ? 'true' : 'false', errorMessage: res.data?.errorMessage };
  }
}

/** TopUp — POST /api/v1/profiles/:esimTranNo/topup */
export class EsimLaunchTopUpService {
  constructor(private client: EsimLaunchClient) {}

  async topupProfile(payload: { esimTranNo?: string; iccid?: string; packageCode: string; transactionId: string; amount?: number }) {
    const id = payload.esimTranNo || payload.iccid;
    if (!id) return { success: 'false', errorMessage: 'esimTranNo or iccid required' };
    const res = await this.client.http.post(`/api/v1/profiles/${id}/topup`, {
      packageCode: payload.packageCode,
      transactionId: payload.transactionId,
      amount: payload.amount,
    });
    return { success: res.data?.success === true ? 'true' : 'false', obj: res.data?.obj, errorMessage: res.data?.errorMessage };
  }
}

/** Usage — POST /api/v1/profiles/usage */
export class EsimLaunchUsageService {
  constructor(private client: EsimLaunchClient) {}

  async getUsage(esimTranNoList: string[]): Promise<{ success: string; obj?: any[]; errorCode?: string; errorMessage?: string }> {
    const res = await this.client.http.post('/api/v1/profiles/usage', { esimTranNoList });
    const data = res.data;
    const list = data?.obj ?? data ?? [];
    return { success: Array.isArray(list) ? 'true' : 'false', obj: Array.isArray(list) ? list : [] };
  }
}

/** Full client matching EsimAccess shape for drop-in use in EsimService */
export class EsimLaunch {
  client: EsimLaunchClient;
  packages: EsimLaunchPackagesService;
  orders: EsimLaunchOrdersService;
  query: EsimLaunchQueryService;
  profiles: EsimLaunchProfilesService;
  topup: EsimLaunchTopUpService;
  usage: EsimLaunchUsageService;

  constructor(config: EsimLaunchConfig) {
    this.client = new EsimLaunchClient(config);
    this.packages = new EsimLaunchPackagesService(this.client);
    this.orders = new EsimLaunchOrdersService(this.client);
    this.query = new EsimLaunchQueryService(this.client);
    this.profiles = new EsimLaunchProfilesService(this.client);
    this.topup = new EsimLaunchTopUpService(this.client);
    this.usage = new EsimLaunchUsageService(this.client);
  }
}
