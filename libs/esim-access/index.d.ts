export * from './auth';
export * from './types';
export * from './client';
export * from './packages';
export * from './orders';
export * from './query';
export * from './profiles';
export * from './topup';
export * from './usage';
export * from './webhooks';
import { EsimAccessClient, EsimAccessConfig } from './client';
import { PackagesService } from './packages';
import { OrdersService } from './orders';
import { QueryService } from './query';
import { ProfilesService } from './profiles';
import { TopUpService } from './topup';
import { UsageService } from './usage';
import { WebhooksService } from './webhooks';
export declare class EsimAccess {
    client: EsimAccessClient;
    packages: PackagesService;
    orders: OrdersService;
    query: QueryService;
    profiles: ProfilesService;
    topup: TopUpService;
    usage: UsageService;
    webhooks: WebhooksService;
    constructor(config: EsimAccessConfig);
}
