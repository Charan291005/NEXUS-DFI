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
          50:  '#e8f4ff',
          100: '#d0e9ff',
          200: '#a3d4ff',
          300: '#66b5ff',
          400: '#2d8eff',
          500: '#0066ff',
          600: '#0052e0',
          700: '#003fc2',
          800: '#0030a0',
          900: '#002080',
        },
        slate: {
          850: '#0f1629',
          900: '#0a0f1e',
          950: '#050810',
        },
        accent: {
          cyan:   '#00d4ff',
          purple: '#7b2fff',
          green:  '#00ff88',
          orange: '#ff6b35',
          red:    '#ff3366',
          yellow: '#ffd700',
        },
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
        'hero-gradient': "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0,102,255,0.15), transparent)",
        'glow-cyan':   "radial-gradient(circle, rgba(0,212,255,0.3) 0%, transparent 70%)",
        'glow-purple': "radial-gradient(circle, rgba(123,47,255,0.3) 0%, transparent 70%)",
      },
      backgroundSize: {
        'grid': '32px 32px',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(0,212,255,0.2)',
        'glow':    '0 0 20px rgba(0,212,255,0.3)',
        'glow-lg': '0 0 40px rgba(0,212,255,0.4)',
        'glow-purple': '0 0 20px rgba(123,47,255,0.4)',
        'card':    '0 4px 24px rgba(0,0,0,0.5)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.7)',
        'inner-glow': 'inset 0 0 20px rgba(0,212,255,0.05)',
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
