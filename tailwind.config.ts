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
        // Mobile App Dark Theme Design System
        // Background
        'dark-bg': '#000000',           // Pure black background
        'dark-card': '#1A1A1A',         // Dark gray for cards/boxes
        'dark-border': '#2A2A2A',       // Subtle borders
        
        // Text colors
        'dark-text-primary': '#FFFFFF',    // Bright white for primary text
        'dark-text-secondary': '#A0A0A0',  // Medium gray for secondary text
        'dark-text-tertiary': '#666666',   // Dark gray for placeholders
        
        // Accent/Glow - Cyan
        'accent-cyan': '#00D9FF',          // Cyan with glow effects
        
        // Status colors - Neon
        'neon-green': '#00FF88',           // Success - Neon green
        'neon-pink': '#FF3366',            // Error/Debit - Neon pink
        'neon-gold': '#FFD700',            // Warning - Gold
        'neon-purple': '#9D4EDD',          // Purple accent
        
        // Legacy colors (keeping for backward compatibility)
        'surface-0': '#0B0F14',
        'surface-1': 'rgba(255, 255, 255, 0.03)',
        'surface-2': 'rgba(255, 255, 255, 0.06)',
        'surface-3': 'rgba(255, 255, 255, 0.09)',
        'text-primary': '#FFFFFF',
        'text-secondary': '#9CA3AF',
        'text-tertiary': '#6B7280',
        'brand-primary': '#00D9FF',        // Updated to cyan
        'brand-secondary': '#00D9FF',      // Updated to cyan
        'status-success': '#00FF88',       // Updated to neon green
        'status-warning': '#FFD700',       // Updated to gold
        'status-danger': '#FF3366',        // Updated to neon pink
        'status-info': '#00D9FF',          // Updated to cyan
        'border-light': 'rgba(255, 255, 255, 0.10)',
        'border-medium': 'rgba(255, 255, 255, 0.15)',
      },
      boxShadow: {
        'elev-1': '0 1px 12px rgba(255, 255, 255, 0.04)',
        'elev-2': '0 6px 30px rgba(255, 255, 255, 0.06)',
        'elev-3': '0 12px 48px rgba(255, 255, 255, 0.08)',
        // Cyan glow effects (shadowOpacity 0.4-0.6)
        'glow-cyan': '0 0 20px rgba(0, 217, 255, 0.4)',
        'glow-cyan-md': '0 0 30px rgba(0, 217, 255, 0.5)',
        'glow-cyan-lg': '0 0 40px rgba(0, 217, 255, 0.6)',
        // Neon glows
        'glow-green': '0 0 20px rgba(0, 255, 136, 0.4)',
        'glow-pink': '0 0 20px rgba(255, 51, 102, 0.4)',
        'glow-purple': '0 0 20px rgba(157, 78, 221, 0.4)',
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '12px',
        'lg': '16px',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [],
}
export default config

