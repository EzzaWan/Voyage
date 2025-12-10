import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../prisma.service';
import { EsimAccess, WebhookEvent } from '../../../../libs/esim-access'; // import strict types
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Processor('webhookQueue')
export class WebhookProcessor {
  private esimAccess: EsimAccess;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService
  ) {
    this.esimAccess = new EsimAccess({
      accessCode: this.config.get('ESIM_ACCESS_CODE') || '',
      secretKey: this.config.get('ESIM_SECRET_KEY') || '',
      baseUrl: this.config.get('ESIM_API_BASE'),
    });
  }

  @Process('processEsimWebhook')
  async handleWebhook(job: Job<{ event: WebhookEvent }>) {
    const { event } = job.data;
    console.log('Processing webhook event', event.notifyType);
    
    if (event.notifyType === 'ORDER_STATUS') {
        const content = event.content;
        if (content.orderStatus === 'GOT_RESOURCE') {
            const orderNo = content.orderNo;
            
            const res = await this.esimAccess.query.queryProfiles({ 
                orderNo,
                pager: { pageNum: 1, pageSize: 50 }
            });

            if (res.success === 'true' && res.obj?.esimList) {
                for (const profile of res.obj.esimList) {
                   const order = await this.prisma.order.findFirst({ where: { esimOrderNo: orderNo } });
                   if (order) {
                       await this.prisma.esimProfile.create({
                           data: {
                               id: crypto.randomUUID(),
                               orderId: order.id,
                               userId: order.userId, // Now required by schema fix
                               esimTranNo: profile.esimTranNo,
                               iccid: profile.iccid,
                               qrCodeUrl: profile.qrCodeUrl,
                               ac: profile.ac,
                               smdpStatus: profile.smdpStatus,
                               esimStatus: profile.esimStatus
                           }
                       });
                       
                       await this.prisma.order.update({
                           where: { id: order.id },
                           data: { status: 'active' }
                       });
                   }
                }
            }
        }
    }
  }
}
