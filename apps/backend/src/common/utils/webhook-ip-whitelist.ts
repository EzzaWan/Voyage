import { Request } from 'express';
import { AppError } from '../errors/app-error';

export function isIpAllowed(ip: string, allowedIps: string[]): boolean {
  if (!allowedIps || allowedIps.length === 0) {
    return true;
  }

  const normalizedIp = normalizeIp(ip);

  return allowedIps.some((allowed) => {
    if (allowed.includes('/')) {
      return isIpInCidr(normalizedIp, allowed);
    }
    return normalizeIp(allowed) === normalizedIp;
  });
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = typeof forwarded === 'string' ? forwarded.split(',') : forwarded;
    return ips[0]?.trim() || request.ip || 'unknown';
  }
  return request.ip || 'unknown';
}

export function validateWebhookIp(request: Request, allowedIps: string[]): void {
  const ip = getClientIp(request);
  
  if (!isIpAllowed(ip, allowedIps)) {
    throw new AppError('Unauthorized IP', 401, 'IP_NOT_ALLOWED', { ip });
  }
}

function normalizeIp(ip: string): string {
  return ip.trim().toLowerCase();
}

function isIpInCidr(ip: string, cidr: string): boolean {
  const [subnet, prefixLength] = cidr.split('/');
  const prefix = parseInt(prefixLength, 10);
  
  if (!subnet || isNaN(prefix)) {
    return false;
  }

  const ipNum = ipToNumber(ip);
  const subnetNum = ipToNumber(subnet);
  const mask = (0xFFFFFFFF << (32 - prefix)) >>> 0;

  return (ipNum & mask) === (subnetNum & mask);
}

function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) {
    return 0;
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}


