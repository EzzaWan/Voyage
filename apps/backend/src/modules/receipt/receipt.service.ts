import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { EsimService } from '../esim/esim.service';
const PDFDocument = require('pdfkit');

@Injectable()
export class ReceiptService {
  private readonly logger = new Logger(ReceiptService.name);

  constructor(
    private prisma: PrismaService,
    private esimService: EsimService,
  ) {}

  async generateReceipt(orderId: string): Promise<Buffer> {
    // Fetch order with all relations
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        User: true,
        EsimProfile: {
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // Ensure User relation is loaded
    if (!order.User) {
      this.logger.error(`User relation not loaded for order ${orderId}`);
      throw new NotFoundException(`User information not found for order ${orderId}`);
    }

    // Fetch plan details for display
    let planDetails: any = null;
    try {
      planDetails = await this.esimService.getPlan(order.planId);
    } catch (err) {
      this.logger.warn(`Could not fetch plan details for ${order.planId}: ${err.message}`);
      // Continue without plan details - not critical for receipt generation
    }

    // Generate PDF
    return this.createPDFBuffer(order, planDetails);
  }

  private async createPDFBuffer(order: any, planDetails: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Helper to sanitize text for PDF
        const sanitize = (text: any): string => {
          if (text === null || text === undefined) return '';
          return String(text).replace(/[^\x20-\x7E\n\r]/g, ''); // Remove non-printable chars except newlines
        };

        // Title
        doc.fontSize(24).font('Helvetica-Bold').text('eSIM Purchase Receipt', { align: 'center' });
        doc.moveDown(2);

        // Customer Information
        doc.fontSize(14).font('Helvetica-Bold').text('Customer Information', { underline: true });
        doc.fontSize(11).font('Helvetica');
        doc.text(`Email: ${sanitize(order.User?.email || 'N/A')}`);
        if (order.User?.name) {
          doc.text(`Name: ${sanitize(order.User.name)}`);
        }
        doc.moveDown(1.5);

        // Helper to get human-readable status
        const getHumanReadableStatus = (status: string): string => {
          const statusLower = status.toLowerCase();
          const statusMap: Record<string, string> = {
            pending: 'Pending',
            payment_pending: 'Payment Pending',
            paid: 'Paid',
            provisioning: 'Provisioning',
            esim_created: 'eSIM Created',
            active: 'Active',
            completed: 'Completed',
            failed: 'Failed',
            cancelled: 'Cancelled',
            canceled: 'Cancelled',
          };
          return statusMap[statusLower] || status;
        };

        const isFailed = order.status.toLowerCase() === 'failed';
        const hasEsimOrderNo = order.esimOrderNo && order.esimOrderNo.trim() !== '';

        // Order Information
        doc.fontSize(14).font('Helvetica-Bold').text('Order Information', { underline: true });
        doc.fontSize(11).font('Helvetica');
        doc.text(`Order ID: ${sanitize(order.id)}`);
        doc.text(`Order Date: ${sanitize(new Date(order.createdAt).toLocaleString())}`);
        doc.text(`Status: ${sanitize(getHumanReadableStatus(order.status))}`);
        if (order.paymentRef) {
          doc.text(`Payment Reference: ${sanitize(order.paymentRef)}`);
        }
        
        // Show failure notice if order failed
        if (isFailed) {
          doc.moveDown(0.5);
          doc.fontSize(10).font('Helvetica').fillColor('#d32f2f');
          doc.text('⚠ Note: eSIM provisioning failed. Please contact support for assistance.', { indent: 10 });
          doc.fillColor('#000000'); // Reset color
        }
        
        doc.moveDown(1.5);

        // eSIM Information
        doc.fontSize(14).font('Helvetica-Bold').text('eSIM Details', { underline: true });
        doc.fontSize(11).font('Helvetica');
        
        if (planDetails) {
          doc.text(`Plan Name: ${sanitize(planDetails.name || order.planId)}`);
          if (planDetails.duration) {
            doc.text(`Duration: ${sanitize(planDetails.duration)} ${sanitize(planDetails.durationUnit || 'days')}`);
          }
          if (planDetails.volume) {
            const volumeGB = (planDetails.volume / (1024 * 1024 * 1024)).toFixed(2);
            doc.text(`Data Volume: ${sanitize(volumeGB)} GB`);
          }
        } else {
          doc.text(`Plan: ${sanitize(order.planId)}`);
        }

        // Show provisioning status based on esimOrderNo
        if (hasEsimOrderNo) {
          doc.text(`Provider Order No: ${sanitize(order.esimOrderNo)}`);
        } else {
          doc.moveDown(0.5);
          doc.fontSize(10).font('Helvetica').fillColor('#666666');
          doc.text('eSIM Provisioning Status: Pending', { indent: 10 });
          doc.fillColor('#000000'); // Reset color
        }

        if (order.EsimProfile && order.EsimProfile.length > 0) {
          doc.moveDown(0.5);
          doc.fontSize(12).font('Helvetica-Bold').text('eSIM Profiles:', { underline: true });
          order.EsimProfile.forEach((profile: any, index: number) => {
            doc.fontSize(10).font('Helvetica');
            doc.text(`Profile ${index + 1}:`);
            doc.text(`  ICCID: ${sanitize(profile.iccid)}`, { indent: 10 });
            if (profile.esimTranNo) {
              doc.text(`  Transaction No: ${sanitize(profile.esimTranNo)}`, { indent: 10 });
            }
          });
        }

        doc.moveDown(1.5);

        // Price Breakdown
        doc.fontSize(14).font('Helvetica-Bold').text('Price Breakdown', { underline: true });
        doc.fontSize(11).font('Helvetica');
        
        // Use display currency and amount if available, otherwise fallback to USD
        const currency = order.displayCurrency?.toUpperCase() || order.currency?.toUpperCase() || 'USD';
        const displayAmountCents = order.displayAmountCents || order.amountCents;
        const amount = (displayAmountCents / 100).toFixed(2);
        
        doc.text(`Base Price: ${sanitize(currency)} ${sanitize(amount)}`);
        doc.text(`Fees: ${sanitize(currency)} 0.00`);
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica-Bold').text(`Total Paid: ${sanitize(currency)} ${sanitize(amount)}`, { underline: true });
        
        doc.moveDown(2);

        // Footer
        doc.fontSize(9).font('Helvetica').fillColor('#666666');
        if (isFailed) {
          doc.text('This is your receipt for the payment processed.', { align: 'center' });
          doc.text('If you have questions about your order, please contact support.', { align: 'center' });
        } else {
          doc.text('Thank you for your purchase!', { align: 'center' });
          doc.text('This is your official receipt for your eSIM purchase.', { align: 'center' });
        }
        
        // Finalize
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

