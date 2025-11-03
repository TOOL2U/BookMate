import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ===== NEW DARK FINANCE THEME =====
        // Background / Surfaces
        'bg-app': 'rgb(var(--color-bg-app) / <alpha-value>)',
        'bg-card': 'rgb(var(--color-bg-card) / <alpha-value>)',
        'border-card': 'rgb(var(--color-border-card) / <alpha-value>)',

        // Text Hierarchy
        'text-primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'text-tertiary': 'rgb(var(--color-text-tertiary) / <alpha-value>)',

        // Accent Colors
        'accent': 'rgb(var(--color-accent) / <alpha-value>)',
        'accent-purple': 'rgb(var(--color-accent-purple) / <alpha-value>)',

        // Status Colors
        'success': 'rgb(var(--color-success) / <alpha-value>)',
        'error': 'rgb(var(--color-error) / <alpha-value>)',
        'warning': 'rgb(var(--color-warning) / <alpha-value>)',
        'info': 'rgb(var(--color-info) / <alpha-value>)',

        // Legacy compatibility (keep for gradual migration)
        'surface-0': 'rgb(var(--color-bg-app) / <alpha-value>)',
        'surface-1': 'rgb(var(--color-bg-card) / <alpha-value>)',
        'surface-2': 'rgb(var(--color-border-card) / <alpha-value>)',
        'surface-3': 'rgb(var(--color-text-primary) / 0.09)',

        'brand-primary': 'rgb(var(--color-accent) / <alpha-value>)',    // Map to new accent
        'brand-secondary': 'rgb(var(--color-accent-purple) / <alpha-value>)',  // Map to accent-purple

        'status-success': 'rgb(var(--color-success) / <alpha-value>)',
        'status-warning': 'rgb(var(--color-warning) / <alpha-value>)',
        'status-danger': 'rgb(var(--color-error) / <alpha-value>)',
        'status-info': 'rgb(var(--color-info) / <alpha-value>)',

        'border-light': 'rgb(var(--color-border-light) / <alpha-value>)',
        'border-medium': 'rgb(var(--color-border-medium) / 0.15)',
      },
      boxShadow: {
        // Cyan glow effects (primary accent)
        'glow-cyan': '0 0 16px rgba(0, 217, 255, 0.5)',
        'glow-cyan-sm': '0 0 12px rgba(0, 217, 255, 0.4)',
        'glow-cyan-lg': '0 0 25px rgba(0, 217, 255, 0.6)',

        // Status glow effects
        'glow-green': '0 0 16px rgba(0, 255, 136, 0.5)',
        'glow-pink': '0 0 16px rgba(255, 51, 102, 0.5)',
        'glow-purple': '0 0 16px rgba(157, 78, 221, 0.5)',

        // Legacy
        'elev-1': '0 1px 12px rgba(0, 0, 0, 0.3)',
        'elev-2': '0 6px 30px rgba(0, 0, 0, 0.4)',
        'elev-3': '0 12px 48px rgba(0, 0, 0, 0.5)',
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '12px',
        'lg': '16px',
      },
      borderRadius: {
        'modern-sm': '8px',
        'modern-md': '12px',
        'modern-lg': '16px',
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [],
}
export default config
