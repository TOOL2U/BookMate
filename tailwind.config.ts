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
        madeMirage: ['var(--font-made-mirage)', 'serif'],
        bebasNeue: ['var(--font-bebas-neue)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        aileron: ['var(--font-aileron)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-aileron)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ===== BOOKMATE BRAND KIT - Direct color values =====
        
        // Primary Yellow Brand
        'yellow': '#FFF02B',
        'accent': '#FFF02B',
        
        // Backgrounds
        'bg-app': '#121212',
        'bg-card': '#171717',
        'black': '#000000',
        
        // Greys
        'grey': {
          DEFAULT: '#4D4D4D',
          dark: '#121212',
        },
        
        // Text Colors
        'text-primary': '#f3f3f3',
        'text-secondary': '#b5b5b5',
        'muted': '#b5b5b5',
        
        // Borders
        'border': '#2a2a2a',
        'border-card': '#2a2a2a',
        
        // Status Colors
        'success': '#00ff88',
        'error': '#ff3366',
        'warning': '#FFF02B',
        'info': '#FFF02B',
        
        // Semantic aliases for components
        'bg': '#121212',
        'fg': '#f3f3f3',
        'card': '#171717',
        'cardFg': '#f3f3f3',
        
        // Legacy compatibility
        'surface-0': '#121212',
        'surface-1': '#171717',
        'surface-2': '#2a2a2a',
        'surface-3': 'rgba(243, 243, 243, 0.09)',
        
        'brand-primary': '#FFF02B',
        'brand-secondary': '#FFF02B',
        
        'status-success': '#00ff88',
        'status-warning': '#FFF02B',
        'status-danger': '#ff3366',
        'status-info': '#FFF02B',
        
        'border-light': '#2a2a2a',
        'border-medium': 'rgba(77, 77, 77, 0.15)',
        
        // Keep accent-purple as yellow for backward compatibility
        'accent-purple': '#FFF02B',
      },
      boxShadow: {
        // Yellow glow effects (brand primary)
        'glow': '0 0 24px rgba(255, 240, 43, 0.20)',
        'glow-sm': '0 0 12px rgba(255, 240, 43, 0.15)',
        'glow-lg': '0 0 36px rgba(255, 240, 43, 0.25)',
        'soft': '0 4px 24px rgba(0, 0, 0, 0.25)',

        // Status glow effects
        'glow-green': '0 0 16px rgba(0, 255, 136, 0.5)',
        'glow-pink': '0 0 16px rgba(255, 51, 102, 0.5)',
        'glow-yellow': '0 0 16px rgba(255, 240, 43, 0.20)',

        // Legacy
        'elev-1': '0 1px 12px rgba(0, 0, 0, 0.3)',
        'elev-2': '0 6px 30px rgba(0, 0, 0, 0.4)',
        'elev-3': '0 12px 48px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'brand-glow': 'radial-gradient(circle at 50% -20%, rgba(255, 240, 43, 0.06), transparent 60%)',
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '12px',
        'lg': '16px',
      },
      borderRadius: {
        'xl2': '1.25rem',
        'modern-sm': '8px',
        'modern-md': '12px',
        'modern-lg': '16px',
      },
      transitionTimingFunction: {
        'smoother': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
}

export default config
