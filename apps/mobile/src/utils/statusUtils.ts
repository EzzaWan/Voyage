import { theme } from '../theme';

/**
 * Maps backend eSIM status to human-friendly label
 */
export function getStatusLabel(status?: string | null): string {
  if (!status) return 'Unknown';
  const normalizedStatus = status.toUpperCase();
  
  switch (normalizedStatus) {
    case 'GOT_RESOURCE':
    case 'DOWNLOAD':
      return 'Ready to install';
    case 'INSTALLED':
    case 'INSTALLATION':
      return 'Installed';
    case 'ACTIVE':
    case 'IN_USE':
    case 'ENABLED':
    case 'ACTIVATED':
      return 'Active';
    case 'EXPIRED':
    case 'UNUSED_EXPIRED':
    case 'USED_EXPIRED':
    case 'DISABLED':
      return 'Expired';
    case 'PENDING':
    case 'PROVISIONING':
      return 'Pending';
    case 'FAILED':
    case 'ERROR':
      return 'Failed';
    default:
      return status;
  }
}

/**
 * Gets the color for a given status
 */
export function getStatusColor(status?: string | null): string {
  if (!status) return theme.colors.textSecondary;
  const normalizedStatus = status.toUpperCase();
  
  if (normalizedStatus === 'GOT_RESOURCE' || normalizedStatus === 'DOWNLOAD') {
    return theme.colors.primary; // Blue for ready to install
  }
  if (normalizedStatus === 'INSTALLED' || normalizedStatus === 'INSTALLATION') {
    return theme.colors.warning; // Orange for installed
  }
  if (normalizedStatus === 'ACTIVE' || normalizedStatus === 'IN_USE' || normalizedStatus === 'ENABLED' || normalizedStatus === 'ACTIVATED') {
    return theme.colors.success; // Green for active
  }
  if (normalizedStatus === 'EXPIRED' || normalizedStatus === 'UNUSED_EXPIRED' || normalizedStatus === 'USED_EXPIRED' || normalizedStatus === 'DISABLED') {
    return theme.colors.textMuted; // Gray for expired
  }
  if (normalizedStatus === 'PENDING' || normalizedStatus === 'PROVISIONING') {
    return theme.colors.warning; // Orange for pending
  }
  if (normalizedStatus === 'FAILED' || normalizedStatus === 'ERROR') {
    return theme.colors.error; // Red for failed
  }
  return theme.colors.textSecondary; // Gray for unknown
}

