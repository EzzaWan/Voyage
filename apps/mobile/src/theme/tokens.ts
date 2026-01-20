/**
 * Voyage Mobile Design Tokens
 * Premium dark theme matching Voyage web brand
 * System fonts only, mobile-first readability
 */

// ============================================================================
// COLOR TOKENS
// ============================================================================

export const colors = {
  // Primary - Voyage Blue (matching web)
  primary: {
    main: '#1E90FF',        // Dodger blue - Voyage brand
    soft: '#4BA3FF',        // Lighter variant
    muted: 'rgba(30, 144, 255, 0.15)',  // Background tints
    border: 'rgba(30, 144, 255, 0.25)', // Border variants
  },

  // Backgrounds
  background: {
    main: '#0A1A2F',        // Primary dark background
    light: '#0F2540',       // Secondary/surface background
    elevated: '#132742',    // Elevated surfaces (cards)
    hover: '#163054',       // Hover states
  },

  // Card backgrounds
  card: {
    default: '#132742',     // Default card
    elevated: '#163054',    // Elevated/hovered card
    overlay: 'rgba(19, 39, 66, 0.95)', // Modal overlays
  },

  // Text hierarchy
  text: {
    primary: '#E9F1FF',     // Primary text (high contrast)
    secondary: '#A8B5C8',   // Secondary text
    muted: '#64748B',       // Muted/disabled text
    inverse: '#0A1A2F',     // Text on light backgrounds
  },

  // Borders
  border: {
    default: '#1E3555',     // Default borders
    light: '#253A5F',       // Lighter borders (inputs)
    muted: 'rgba(30, 53, 85, 0.5)', // Subtle borders
  },

  // Status colors (muted, non-aggressive)
  status: {
    success: {
      main: '#22C55E',
      soft: '#4ADE80',
      background: 'rgba(34, 197, 94, 0.12)',
      border: 'rgba(34, 197, 94, 0.25)',
    },
    warning: {
      main: '#F59E0B',
      soft: '#FBBF24',
      background: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.25)',
    },
    error: {
      main: '#EF4444',
      soft: '#F87171',
      background: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(239, 68, 68, 0.25)',
    },
  },

  // Neutral colors
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    overlay: 'rgba(0, 0, 0, 0.6)',
    overlayLight: 'rgba(0, 0, 0, 0.4)',
  },
} as const;

// ============================================================================
// SPACING TOKENS
// ============================================================================

export const spacing = {
  xxs: 2,   // 2px - Minimal gaps
  xs: 4,    // 4px - Tight spacing (badges, icons)
  sm: 8,    // 8px - Small gaps
  md: 12,   // 12px - Compact spacing (reduced from 16)
  base: 16, // 16px - Standard spacing
  lg: 24,   // 24px - Large spacing (Saily uses generous spacing)
  xl: 32,   // 32px - Extra large spacing
  xxl: 40,  // 40px - Section spacing
  xxxl: 48, // 48px - Page-level spacing
} as const;

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

export const typography = {
  // Font sizes
  size: {
    title: 28,      // Page titles
    heading: 22,    // Section headings
    body: 16,       // Body text
    caption: 14,    // Captions, secondary text
    small: 12,      // Meta info, labels
    tiny: 11,       // Badges, tags
  },

  // Font weights
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line heights (minimum 1.4 for readability)
  lineHeight: {
    tight: 1.2,     // Headings only
    normal: 1.5,    // Body text
    relaxed: 1.6,   // Long-form content
  },

  // Typography presets
  styles: {
    title: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 36, // 1.29 ratio
      letterSpacing: -0.3,
    },
    heading: {
      fontSize: 22,
      fontWeight: '600' as const,
      lineHeight: 28, // 1.27 ratio
      letterSpacing: -0.2,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24, // 1.5 ratio
    },
    bodyMedium: {
      fontSize: 16,
      fontWeight: '500' as const,
      lineHeight: 24,
    },
    bodyBold: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20, // 1.43 ratio
    },
    captionMedium: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 20,
    },
    small: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16, // 1.33 ratio
    },
    smallMedium: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
    },
    tiny: {
      fontSize: 11,
      fontWeight: '400' as const,
      lineHeight: 14,
    },
    display: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
      letterSpacing: -0.5,
    },
  },
} as const;

// ============================================================================
// RADIUS TOKENS (Reduced for utility-first design)
// ============================================================================

export const radius = {
  none: 0,
  xs: 4,      // Badges
  sm: 8,      // Small elements
  md: 12,     // Buttons, inputs
  lg: 16,     // Cards, grouped lists
  xl: 24,     // Large containers, bottom sheets
  round: 9999,
  full: 9999, // Alias for round
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ColorToken = typeof colors;
export type SpacingToken = keyof typeof spacing;
export type TypographyToken = typeof typography;
export type RadiusToken = keyof typeof radius;

