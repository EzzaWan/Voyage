import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import Handlebars from 'handlebars';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { AdminSettingsService } from '../admin/admin-settings.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resendClient: any;
  private fromAddress: string;
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    @Inject(forwardRef(() => AdminSettingsService))
    private adminSettingsService: AdminSettingsService,
  ) {
    this.fromAddress = this.config.get('EMAIL_FROM') || 'no-reply@voyage.app';

    const apiKey = this.config.get('RESEND_API_KEY');
    if (apiKey) {
      try {
        const { Resend } = require('resend');
        this.resendClient = new Resend(apiKey);
        this.logger.log('[EMAIL] Resend client initialized');
      } catch (error) {
        this.logger.error('[EMAIL] Failed to initialize Resend client:', error);
        this.resendClient = null;
      }
    } else {
      this.logger.warn('[EMAIL] RESEND_API_KEY not configured, email sending disabled');
      this.resendClient = null;
    }
  }

  private async refreshSettings() {
    const settings = await this.adminSettingsService.getSettings();
    if (settings.emailFrom) {
      this.fromAddress = settings.emailFrom;
    }
  }

  private async isMockMode(): Promise<boolean> {
    const settings = await this.adminSettingsService.getSettings();
    if (settings.mockMode) {
      return true;
    }
    // Also check env variable as fallback
    return this.config.get('MOCK_MODE') === 'true' || false;
  }

  private async isEmailEnabled(): Promise<boolean> {
    const settings = await this.adminSettingsService.getSettings();
    return settings.emailEnabled !== false; // Default to true if not set
  }

  private loadTemplate(templateName: string): HandlebarsTemplateDelegate {
    // Check cache first
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    // Determine the correct base path - handle both root and apps/backend working directories
    const cwd = process.cwd();
    const possiblePaths: string[] = [];
    
    // Check if templates exist directly in current directory (if running from apps/backend)
    const directPath = join(cwd, 'templates', 'email', `${templateName}.hbs`);
    if (existsSync(directPath)) {
      possiblePaths.push(directPath);
    }
    
    // Check if we're in apps/backend and need to go to root
    const normalizedCwd = cwd.replace(/\\/g, '/');
    if (normalizedCwd.includes('/apps/backend') && normalizedCwd.endsWith('/apps/backend')) {
      // We're in apps/backend, go up to root
      const rootPath = join(cwd, '..', '..');
      possiblePaths.push(join(rootPath, 'apps', 'backend', 'templates', 'email', `${templateName}.hbs`));
    }
    
    // Always try from current directory as if we're at root
    possiblePaths.push(join(cwd, 'apps', 'backend', 'templates', 'email', `${templateName}.hbs`));
    
    let tplPath: string | null = null;
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        tplPath = path;
        break;
      }
    }
    
    if (!tplPath) {
      this.logger.error(`[EMAIL] Template not found: ${templateName}. CWD: ${cwd}. Searched: ${possiblePaths.join(', ')}`);
      // Return a simple fallback template
      return Handlebars.compile(`<html><body><h1>{{subject}}</h1><p>Template ${templateName} not found</p></body></html>`);
    }

    try {
      const tplSource = readFileSync(tplPath, 'utf8');
      const compiled = Handlebars.compile(tplSource);
      this.templateCache.set(templateName, compiled);
      return compiled;
    } catch (error) {
      this.logger.error(`[EMAIL] Failed to load template ${templateName}:`, error);
      return Handlebars.compile(`<html><body><h1>{{subject}}</h1><p>Error loading template</p></body></html>`);
    }
  }

  async sendEmail({
    to,
    subject,
    template,
    variables = {},
    idempotencyKey,
  }: {
    to: string;
    subject: string;
    template: string;
    variables?: Record<string, any>;
    idempotencyKey?: string;
  }) {
    // Refresh settings
    await this.refreshSettings();

    // Check if email is enabled
    const emailEnabled = await this.isEmailEnabled();
    if (!emailEnabled) {
      this.logger.log(`[EMAIL] Email sending disabled, skipping: ${template} -> ${to}`);
      return { skipped: true, reason: 'email_disabled' };
    }

    // Check mock mode
    const mockMode = await this.isMockMode();

    // Save initial log (status pending or mock)
    const emailLog = await this.prisma.emailLog.create({
      data: {
        to,
        from: this.fromAddress,
        subject,
        template,
        variables: variables || {},
        status: mockMode ? 'mock' : 'pending',
      },
    });

    // If mock mode enabled -> return as mock
    if (mockMode) {
      this.logger.log(`[EMAIL] Mock email send: ${template} -> ${to}`);
      await this.prisma.emailLog.update({
        where: { id: emailLog.id },
        data: { status: 'mock', providerId: 'MOCK', error: null },
      });
      return { mock: true, emailLogId: emailLog.id };
    }

    // If no Resend client configured, mark as failed
    if (!this.resendClient) {
      this.logger.warn(`[EMAIL] Resend client not configured, marking as failed: ${template} -> ${to}`);
      await this.prisma.emailLog.update({
        where: { id: emailLog.id },
        data: { status: 'failed', error: 'Resend client not configured' },
      });
      return { success: false, error: 'Resend client not configured' };
    }

    // Render template
    let html: string;
    try {
      const compiled = this.loadTemplate(template);
      html = compiled({ ...variables, subject });
    } catch (error) {
      this.logger.error(`[EMAIL] Template rendering failed for ${template}:`, error);
      await this.prisma.emailLog.update({
        where: { id: emailLog.id },
        data: { status: 'failed', error: `Template rendering failed: ${error}` },
      });
      return { success: false, error: 'Template rendering failed' };
    }

    // Send via Resend
    try {
      const emailData: any = {
        from: this.fromAddress,
        to,
        subject,
        html,
      };

      // Add idempotency key if provided
      if (idempotencyKey) {
        emailData.headers = {
          'Idempotency-Key': idempotencyKey,
        };
      }

      const resp = await this.resendClient.emails.send(emailData);

      // Check if Resend returned an error in the response
      if (resp.error) {
        const errorMessage = resp.error.message || JSON.stringify(resp.error);
        this.logger.error(`[EMAIL] Resend returned error: ${template} -> ${to}: ${errorMessage}`);
        
        await this.prisma.emailLog.update({
          where: { id: emailLog.id },
          data: {
            status: 'failed',
            providerId: null,
            error: errorMessage,
          },
        });

        return { success: false, error: errorMessage, emailLogId: emailLog.id };
      }

      // Store provider id / success
      await this.prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: 'sent',
          providerId: resp.id || resp.data?.id || null,
          error: null,
        },
      });

      this.logger.log(`[EMAIL] Email sent successfully: ${template} -> ${to} (ID: ${resp.id || resp.data?.id || 'unknown'})`);

      return { success: true, resp, emailLogId: emailLog.id };
    } catch (err: any) {
      this.logger.error(`[EMAIL] Email send failed: ${template} -> ${to}:`, err);
      
      const errorMessage = err?.message || String(err);
      await this.prisma.emailLog.update({
        where: { id: emailLog.id },
        data: { status: 'failed', error: errorMessage },
      });

      return { success: false, error: errorMessage };
    }
  }

  // Convenience wrappers
  async sendOrderConfirmation(to: string, variables: any, idempotency?: string) {
    const subject = `Order confirmed — Voyage`;
    return this.sendEmail({
      to,
      template: 'order-confirmation',
      subject,
      variables,
      idempotencyKey: idempotency || `order-${variables.order?.id || Date.now()}`,
    });
  }

  async sendEsimReady(to: string, variables: any, idempotency?: string) {
    const subject = `Your eSIM is ready — Voyage`;
    return this.sendEmail({
      to,
      template: 'esim-ready',
      subject,
      variables,
      idempotencyKey: idempotency || `esim-${variables.profile?.id || Date.now()}`,
    });
  }

  async sendTopupConfirmation(to: string, variables: any, idempotency?: string) {
    const subject = `Top-up confirmed — Voyage`;
    return this.sendEmail({
      to,
      template: 'topup-confirmation',
      subject,
      variables,
      idempotencyKey: idempotency || `topup-${variables.topup?.id || Date.now()}`,
    });
  }

  async sendPaymentFailed(to: string, variables: any, idempotency?: string) {
    const subject = `Payment failed — Voyage`;
    return this.sendEmail({
      to,
      template: 'payment-failed',
      subject,
      variables,
      idempotencyKey: idempotency || `payment-failed-${variables.order?.id || Date.now()}`,
    });
  }

  async sendEsimExpiring(to: string, variables: any, idempotency?: string) {
    const subject = `Your eSIM expires soon — Voyage`;
    return this.sendEmail({
      to,
      template: 'esim-expiring',
      subject,
      variables,
      idempotencyKey: idempotency || `expiring-${variables.profile?.id || Date.now()}`,
    });
  }

  async sendReceiptEmail(to: string, variables: any, idempotency?: string) {
    const subject = `Receipt for your purchase — Voyage`;
    return this.sendEmail({
      to,
      template: 'receipt',
      subject,
      variables,
      idempotencyKey: idempotency || `receipt-${variables.orderId || Date.now()}`,
    });
  }
}

