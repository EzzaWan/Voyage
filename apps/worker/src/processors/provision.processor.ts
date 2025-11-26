import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../prisma.service';
import { EsimAccess } from '../../../../libs/esim-access';
import { ConfigService } from '@nestjs/config';

@Processor('provisionQueue')
export class ProvisionProcessor {
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

  @Process('provisionJob')
  async handleProvision(job: Job<{ orderId: string }>) {
    const { orderId } = job.data;
    console.log(`Processing provision for order ${orderId}`);
    
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return;

    const plan = await this.prisma.plan.findUnique({ where: { id: order.planId } });
    
    try {
        const res = await this.esimAccess.orders.orderProfiles({
            transactionId: order.id,
            amount: order.amountCents, 
            packageInfoList: [{
                packageCode: plan?.externalSlug || 'UNKNOWN',
                count: 1,
                price: order.amountCents
            }]
        });

        if (res.success === 'true' && res.obj?.orderNo) {
            await this.prisma.order.update({
                where: { id: orderId },
                data: { 
                    status: 'provisioning',
                    esimOrderNo: res.obj.orderNo
                }
            });
        } else {
            console.error('Order failed', res);
        }
    } catch (e) {
        console.error(e);
        throw e; 
    }
  }
}
