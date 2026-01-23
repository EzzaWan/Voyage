/**
 * Voyage Mobile Theme
 * Main theme export with backward-compatible structure
 */

import { colors, spacing, typography, radius } from './tokens';

export const theme = {
  colors: {
    // Primary
    primary: colors.primary.main,
    primarySoft: colors.primary.soft,
    primaryMuted: colors.primary.muted,
    
    // Backgrounds
    background: colors.background.main,
    backgroundLight: colors.background.light,
    card: colors.card.default,
    cardHover: colors.card.elevated,
    
    // Text
    text: colors.text.primary,
    textSecondary: colors.text.secondary,
    textMuted: colors.text.muted,
    textInverse: colors.text.inverse,
    
    // Borders
    border: colors.border.default,
    borderLight: colors.border.light,
    
    // Status
    success: colors.status.success.main,
    successSoft: colors.status.success.soft,
    successBackground: colors.status.success.background,
    successBorder: colors.status.success.border,
    
    warning: colors.status.warning.main,
    warningSoft: colors.status.warning.soft,
    warningBackground: colors.status.warning.background,
    warningBorder: colors.status.warning.border,
    
    error: colors.status.error.main,
    errorSoft: colors.status.error.soft,
    errorBackground: colors.status.error.background,
    errorBorder: colors.status.error.border,
    
    // Neutral
    white: colors.neutral.white,
    black: colors.neutral.black,
    overlay: colors.neutral.overlay,
    overlayLight: colors.neutral.overlayLight,
    
    // Legacy badge colors (kept for compatibility)
    blue: colors.primary.main,
    blueBackground: colors.primary.muted,
    blueBorder: colors.primary.border,
    
    orange: colors.status.warning.main,
    orangeBackground: colors.status.warning.background,
    orangeBorder: colors.status.warning.border,
    
    gray: colors.text.muted,
    grayBackground: 'rgba(100, 116, 139, 0.12)',
    grayBorder: 'rgba(100, 116, 139, 0.25)',
  },
  
  spacing,
  borderRadius: radius,
  typography: typography.styles,
  
  shadows: {
    none: { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
    primaryGlow: { shadowColor: '#1E90FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    background: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
    modal: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 12 },
  },
  
  // Button presets (calm, reduced heights)
  buttons: {
    lg: {
      height: 48,
      paddingHorizontal: 20,
      fontSize: 16,
      fontWeight: '600',
      borderRadius: radius.sm,
    },
    md: {
      height: 44,
      paddingHorizontal: 18,
      fontSize: 15,
      fontWeight: '600',
      borderRadius: radius.sm,
    },
    sm: {
      height: 36,
      paddingHorizontal: 14,
      fontSize: 14,
      fontWeight: '500',
      borderRadius: radius.sm,
    },
  },
  
  // Input presets
  inputs: {
    md: {
      height: 52,
      paddingHorizontal: spacing.md,
      fontSize: 16,
      borderRadius: radius.sm,
    },
    lg: {
      height: 56,
      paddingHorizontal: 20,
      fontSize: 17,
      borderRadius: radius.md,
    },
  },
  
  // List item presets
  listItem: {
    minHeight: 64,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  
  // Card presets (minimal, flat)
  cards: {
    default: {
      borderRadius: radius.md,
      padding: spacing.base,
      borderWidth: 1,
    },
    minimal: {
      borderRadius: radius.sm,
      padding: spacing.md,
      borderWidth: 0,
    },
    compact: {
      borderRadius: radius.sm,
      padding: spacing.md,
      borderWidth: 1,
    },
  },
  
  // List presets (iOS-style)
  list: {
    section: {
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
    },
    item: {
      minHeight: 56,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.base,
    },
    itemCompact: {
      minHeight: 44,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.base,
    },
  },
};

// Export design tokens directly
export { colors, spacing, typography, radius };

// Type exports
export type Theme = typeof theme;
export type ThemeColors = keyof typeof theme.colors;

// Default export for compatibility
export default theme;
