import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea6c00',
          700: '#c2550a',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        // ── Colores semánticos — referencian CSS vars para soporte de Dark/Light Mode
        surface: {
          base:   'var(--color-surface-base)',
          card:   'var(--color-surface-card)',
          raised: 'var(--color-surface-raised)',
        },
        success: {
          bg:     'var(--color-success-bg)',
          text:   'var(--color-success-text)',
          border: 'var(--color-success-border)',
          500:    '#22c55e',
          400:    '#4ade80',
        },
        warning: {
          bg:     'var(--color-warning-bg)',
          text:   'var(--color-warning-text)',
          border: 'var(--color-warning-border)',
          500:    '#f59e0b',
          400:    '#fbbf24',
        },
        danger: {
          bg:     'var(--color-danger-bg)',
          text:   'var(--color-danger-text)',
          border: 'var(--color-danger-border)',
          500:    '#f43f5e',
          400:    '#fb7185',
        },
        info: {
          bg:     'var(--color-info-bg)',
          text:   'var(--color-info-text)',
          border: 'var(--color-info-border)',
          500:    '#3b82f6',
          400:    '#60a5fa',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

export default config
