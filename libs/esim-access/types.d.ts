export declare enum EsimErrorCode {
    SERVER_ERROR = "000001",
    MISSING_HEADER = "000101",
    WRONG_HEADER_FORMAT = "000102",
    UNSUPPORTED_METHOD = "000103",
    INVALID_JSON = "000104",
    MISSING_PARAM = "000105",
    PARAM_NULL = "000106",
    INVALID_PARAM_LENGTH = "000107",
    TIMESTAMP_EXPIRED = "101001",
    IP_BLOCKED = "101002",
    SIGNATURE_MISMATCH = "101003",
    ORDER_STATUS_NOT_ALLOWED = "200002",
    PRICE_ERROR = "200005",
    WRONG_TOTAL_AMOUNT = "200006",
    INSUFFICIENT_BALANCE = "200007",
    ORDER_PARAM_ERROR = "200008",
    ABNORMAL_ORDER_STATUS = "200009",
    PROFILE_NOT_ALLOCATED = "200010",
    INSUFFICIENT_PROFILES = "200011",
    BUNDLE_CODE_NOT_EXIST = "310201",
    DATA_PLAN_LOCATION_NOT_EXIST = "310211",
    CURRENCY_NOT_EXIST = "310221",
    CARRIER_NOT_EXIST = "310231",
    PACKAGE_CODE_NOT_EXIST = "310241",
    PACKAGE_NOT_EXIST = "310243",
    VENDOR_NOT_EXIST = "310251",
    ORDER_NO_NOT_EXIST = "310272",
    ICCID_NOT_IN_ORDER = "310403",
    SYSTEM_BUSY = "900001"
}
export interface BaseResponse<T = any> {
    success: string;
    errorCode?: string | null;
    errorMessage?: string | null;
    obj?: T;
}
export interface PackageListRequest {
    locationCode?: string;
    type?: 'BASE' | 'TOPUP';
    packageCode?: string;
    slug?: string;
    iccid?: string;
}
export interface PackageItem {
    packageCode: string;
    slug: string;
    name: string;
    price: number;
    currencyCode: string;
    volume: number;
    duration: number;
    durationUnit: string;
    location: string;
    speed: string;
    favorite: boolean;
    supportTopUpType: number;
}
export interface PackageListResponse {
    packageList: PackageItem[];
}
export interface OrderRequest {
    transactionId: string;
    amount?: number;
    packageInfoList: {
        packageCode?: string;
        slug?: string;
        count: number;
        price?: number;
        periodNum?: number;
    }[];
}
export interface OrderResponse {
    orderNo: string;
}
export interface QueryProfilesRequest {
    orderNo?: string;
    iccid?: string;
    esimTranNo?: string;
    startTime?: string;
    endTime?: string;
    pager: {
        pageNum: number;
        pageSize: number;
    };
}
export interface EsimProfile {
    esimTranNo: string;
    orderNo: string;
    imsi: string;
    iccid: string;
    ac: string;
    qrCodeUrl: string;
    smdpStatus: string;
    esimStatus: string;
    expiredTime?: string;
    totalVolume?: number;
    packageList: {
        packageCode: string;
        duration: number;
        volume: number;
        locationCode: string;
    }[];
}
export interface QueryProfilesResponse {
    esimList?: EsimProfile[];
    total?: number;
}
export interface ProfileActionRequest {
    iccid?: string;
    esimTranNo?: string;
}
export interface BalanceResponse {
    balance: number;
}
export interface TopUpRequest {
    esimTranNo: string;
    packageCode: string;
    transactionId: string;
}
export interface LocationItem {
    code: string;
    name: string;
    type: number;
    subLocation?: {
        code: string;
        name: string;
    }[];
}
export interface LocationListResponse {
    locationList: LocationItem[];
}
export interface UsageQueryRequest {
    esimTranNoList: string[];
}
export interface UsageItem {
    esimTranNo: string;
    dataUsage: number;
    totalData: number;
    lastUpdateTime: string;
}
export type WebhookNotifyType = 'CHECK_HEALTH' | 'ORDER_STATUS' | 'SMDP_EVENT' | 'ESIM_STATUS' | 'DATA_USAGE' | 'VALIDITY_USAGE';
export interface WebhookBase {
    notifyType: WebhookNotifyType;
    notifyId?: string;
    eventGenerateTime?: string;
}
export interface WebhookCheckHealth extends WebhookBase {
    notifyType: 'CHECK_HEALTH';
    content: {
        orderNo: string;
        orderStatus: string;
    };
}
export interface WebhookOrderStatus extends WebhookBase {
    notifyType: 'ORDER_STATUS';
    content: {
        orderNo: string;
        orderStatus: string;
    };
}
export interface WebhookSmdpEvent extends WebhookBase {
    notifyType: 'SMDP_EVENT';
    content: {
        eid: string;
        iccid: string;
        esimStatus: string;
        smdpStatus: string;
        orderNo: string;
        esimTranNo: string;
        transactionId: string;
    };
}
export interface WebhookEsimStatus extends WebhookBase {
    notifyType: 'ESIM_STATUS';
    content: {
        orderNo: string;
        esimTranNo: string;
        transactionId: string;
        iccid: string;
        esimStatus: string;
        smdpStatus: string;
    };
}
export interface WebhookDataUsage extends WebhookBase {
    notifyType: 'DATA_USAGE';
    content: {
        orderNo: string;
        transactionId: string;
        esimTranNo: string;
        iccid: string;
        totalVolume: number;
        orderUsage: number;
        remain: number;
        lastUpdateTime: string;
        remainThreshold: number;
    };
}
export interface WebhookValidityUsage extends WebhookBase {
    notifyType: 'VALIDITY_USAGE';
    content: {
        orderNo: string;
        transactionId: string;
        iccid: string;
        durationUnit: string;
        totalDuration: number;
        expiredTime: string;
        remain: number;
    };
}
export type WebhookEvent = WebhookCheckHealth | WebhookOrderStatus | WebhookSmdpEvent | WebhookEsimStatus | WebhookDataUsage | WebhookValidityUsage;
