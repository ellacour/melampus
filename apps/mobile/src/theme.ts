/**
 * Mélampus design tokens — mobile (v1.0 medical direction)
 * Mirroring tailwind.config.ts on the web side. Single source of visual truth
 * lives at /design-system on the web app (gated behind a password).
 */

export const colors = {
  brand: '#0E5B45',
  brandDeep: '#07382B',
  brandTint: '#E6F0EC',

  paper: '#FAFAF7',
  white: '#FFFFFF',
  ink: '#0F1A16',
  inkSoft: '#5C6661',

  line: '#E4E2DA',
  lineStrong: '#C9C7BD',

  statusUp: '#117A4D',
  statusUpTint: '#DEF0E5',
  statusDue: '#C77B0A',
  statusDueTint: '#FAEAD0',
  statusOver: '#B3261E',
  statusOverTint: '#F8DEDA',
} as const

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 18,
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const

/** iOS / Android map to system Inter equivalents — no custom font loading required v1. */
export const font = {
  sans: undefined as undefined,
  mono: 'Menlo',
} as const

export const text = {
  display: { fontSize: 26, fontWeight: '600' as const, letterSpacing: -0.5, lineHeight: 32 },
  title: { fontSize: 22, fontWeight: '600' as const, letterSpacing: -0.4, lineHeight: 28 },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  small: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  label: {
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.7,
    textTransform: 'uppercase' as const,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.9,
    textTransform: 'uppercase' as const,
  },
} as const
