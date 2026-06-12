/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        cyber: {
          50:  '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        slate: {
          850: '#0F1729',
          900: '#111827',
          950: '#000D1A',
        },
        accent: {
          crimson: '#DC2626',
          blue:    '#3B82F6',
          green:   '#10b981',
          orange:  '#F59E0B',
          red:     '#EF4444',
          yellow:  '#ffd700',
        },
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(220,38,38,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.02) 1px, transparent 1px)",
        'hero-gradient': "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(220,38,38,0.12), transparent)",
        'glow-crimson': "radial-gradient(circle, rgba(220,38,38,0.3) 0%, transparent 70%)",
        'glow-blue':    "radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)",
      },
      backgroundSize: {
        'grid': '32px 32px',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(220,38,38,0.2)',
        'glow':    '0 0 20px rgba(220,38,38,0.3)',
        'glow-lg': '0 0 40px rgba(220,38,38,0.4)',
        'glow-blue': '0 0 20px rgba(59,130,246,0.4)',
        'card':    '0 4px 24px rgba(0,0,0,0.5)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.7)',
        'inner-glow': 'inset 0 0 20px rgba(220,38,38,0.05)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow':  'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float':       'float 6s ease-in-out infinite',
        'scan':        'scan 3s linear infinite',
        'glow-pulse':  'glow-pulse 2s ease-in-out infinite',
        'slide-in-right': 'slide-in-right 0.4s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: 0.6 },
          '50%':      { opacity: 1 },
        },
        'slide-in-right': {
          '0%':   { transform: 'translateX(20px)', opacity: 0 },
          '100%': { transform: 'translateX(0)',    opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
