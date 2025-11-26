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

export class EsimAccess {
  client: EsimAccessClient;
  packages: PackagesService;
  orders: OrdersService;
  query: QueryService;
  profiles: ProfilesService;
  topup: TopUpService; // renamed from topUp to match file? Prompt used topup.ts
  usage: UsageService;
  webhooks: WebhooksService;

  constructor(config: EsimAccessConfig) {
    this.client = new EsimAccessClient(config);
    this.packages = new PackagesService(this.client);
    this.orders = new OrdersService(this.client);
    this.query = new QueryService(this.client);
    this.profiles = new ProfilesService(this.client);
    this.topup = new TopUpService(this.client);
    this.usage = new UsageService(this.client);
    this.webhooks = new WebhooksService(config.secretKey, config.accessCode);
  }
}
