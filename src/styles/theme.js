/**
 * Pictionary Color Theme Guide
 * 
 * This file contains the color palette and theme configuration for the Pictionary application.
 * Use these color variables throughout the application to maintain consistency.
 */

const theme = {
  // Primary brand colors
  primary: {
    50: '#FFF1F1',
    100: '#FFE2E2',
    200: '#FFC9C9',
    300: '#FFA8A8',
    400: '#FF8080',
    500: '#FF5252', // Main primary color
    600: '#FF3838',
    700: '#FF1F1F',
    800: '#E60000',
    900: '#CC0000',
  },
  
  // Neutral colors for text, backgrounds, borders
  neutral: {
    50: '#F9FAFB',  // Light background
    100: '#F3F4F6',  // Subtle background
    200: '#E5E7EB',  // Subtle borders
    300: '#D1D5DB',  // Strong borders
    400: '#9CA3AF',  // Muted text
    500: '#6B7280',  // Muted text
    600: '#4B5563',  // Subtle text
    700: '#374151',  // Default text
    800: '#1F2937',  // Strong text
    900: '#111827',  // Heading text
  },
  
  // Accent colors for UI elements
  accent: {
    blue: {
      light: '#DBEAFE',
      default: '#3B82F6',
      dark: '#1E40AF',
    },
    green: {
      light: '#D1FAE5',
      default: '#10B981',
      dark: '#065F46',
    },
    yellow: {
      light: '#FEF3C7',
      default: '#F59E0B',
      dark: '#B45309',
    },
    purple: {
      light: '#EDE9FE',
      default: '#8B5CF6',
      dark: '#5B21B6',
    },
  },
  
  // Semantic colors for feedback
  semantic: {
    success: {
      light: '#D1FAE5',
      default: '#10B981',
      dark: '#065F46',
    },
    warning: {
      light: '#FEF3C7',
      default: '#F59E0B',
      dark: '#B45309',
    },
    error: {
      light: '#FEE2E2',
      default: '#EF4444',
      dark: '#B91C1C',
    },
    info: {
      light: '#DBEAFE',
      default: '#3B82F6',
      dark: '#1E40AF',
    },
  },
  
  // Dark mode specific overrides
  dark: {
    background: {
      primary: '#111827',      // Main background
      secondary: '#1F2937',    // Card/component background
      tertiary: '#374151',     // Elevated component background
    },
    text: {
      primary: '#F9FAFB',      // Main text
      secondary: '#D1D5DB',     // Muted text
      tertiary: '#9CA3AF',      // Very muted text
    },
    border: '#4B5563',         // Border color
    hover: '#2D3748',          // Hover state background
  },
  
  // Light mode specific overrides (defaults)
  light: {
    background: {
      primary: '#F9FAFB',       // Main background
      secondary: '#FFFFFF',     // Card/component background
      tertiary: '#F3F4F6',      // Elevated component background
    },
    text: {
      primary: '#111827',       // Main text
      secondary: '#4B5563',      // Muted text
      tertiary: '#6B7280',       // Very muted text
    },
    border: '#E5E7EB',          // Border color
    hover: '#F3F4F6',           // Hover state background
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    none: 'none',
  },
  
  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',    // 2px
    md: '0.375rem',    // 6px
    lg: '0.5rem',      // 8px
    xl: '0.75rem',     // 12px
    '2xl': '1rem',     // 16px
    '3xl': '1.5rem',   // 24px
    full: '9999px',    // Full rounded (for pills, avatars)
  },
};

export default theme;
