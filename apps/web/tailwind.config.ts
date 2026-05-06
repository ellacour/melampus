import type { Config } from 'tailwindcss'

/**
 * Mélampus design tokens — v1.0 (medical direction)
 * Source de vérité visuelle : /design-system (route gatée)
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0E5B45',
          deep: '#07382B',
          tint: '#E6F0EC',
        },
        paper: '#FAFAF7',
        ink: {
          DEFAULT: '#0F1A16',
          soft: '#5C6661',
        },
        line: {
          DEFAULT: '#E4E2DA',
          strong: '#C9C7BD',
        },
        status: {
          up: '#117A4D',
          'up-tint': '#DEF0E5',
          due: '#C77B0A',
          'due-tint': '#FAEAD0',
          over: '#B3261E',
          'over-tint': '#F8DEDA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        lg: '12px',
        xl: '18px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(15,26,22,.05)',
        md: '0 4px 12px -4px rgba(15,26,22,.10)',
        lg: '0 16px 40px -12px rgba(15,26,22,.18)',
      },
      letterSpacing: {
        tightish: '-0.02em',
        tightest: '-0.035em',
      },
    },
  },
  plugins: [],
} satisfies Config
