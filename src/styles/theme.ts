export const theme = {
  colors: {
    background: {
      primary: '#050505',
      secondary: '#121212',
      hover: '#1a1a1a',
    },
    border: {
      primary: '#1a1a1a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#9ca3af',
      accent: '#ef4444', // red-500
    },
  },
  spacing: {
    sidebar: {
      expanded: '16rem', // w-64
      collapsed: '4rem', // w-16
    },
  },
  transitions: {
    default: 'transition-all duration-300',
  },
  shadows: {
    default: 'shadow-xl',
  },
} as const;

export type Theme = typeof theme; 