/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep midnight backgrounds
        space: {
          50:  '#f0f4ff',
          100: '#dce6ff',
          200: '#b8ccff',
          300: '#7fa4f8',
          400: '#4d7ef0',
          500: '#2458e0',
          600: '#1840c4',
          700: '#132f9a',
          800: '#0d1f6b',
          900: '#080e3a',
          950: '#04071e',
        },
        // Gold / amber primary brand
        brand: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Sky blue accent
        cyan: {
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
        },
        // Emerald for success
        accent: {
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        // Rose for danger
        danger: {
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
        },
        // Amber for warnings
        warn: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
        },
        // Surface layers
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          800: '#0d1f6b',
          900: '#080e3a',
          950: '#04071e',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #04071e 0%, #0d1f6b 40%, #080e3a 70%, #04071e 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(245,158,11,0.07) 0%, rgba(59,130,246,0.04) 100%)',
        'glow-conic':    'conic-gradient(from 180deg at 50% 50%, #f59e0b 0deg, #3b82f6 120deg, #10b981 240deg, #f59e0b 360deg)',
      },
      boxShadow: {
        'glow-sm':    '0 0 15px rgba(245,158,11,0.25)',
        'glow-md':    '0 0 30px rgba(245,158,11,0.35)',
        'glow-lg':    '0 0 60px rgba(245,158,11,0.4)',
        'glow-cyan':  '0 0 30px rgba(59,130,246,0.3)',
        'glow-accent':'0 0 30px rgba(16,185,129,0.3)',
        'card':       '0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,158,11,0.06)',
        'card-hover': '0 12px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.18)',
        'inner-glow': 'inset 0 0 30px rgba(245,158,11,0.08)',
      },
      animation: {
        'float':       'float 6s ease-in-out infinite',
        'float-slow':  'float 8s ease-in-out infinite',
        'shimmer':     'shimmer 2s linear infinite',
        'glow-pulse':  'glow-pulse 2s ease-in-out infinite',
        'spin-slow':   'spin 3s linear infinite',
        'gradient-x':  'gradient-x 3s ease infinite',
        'border-glow': 'border-glow 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        'border-glow': {
          '0%, 100%': { borderColor: 'rgba(245,158,11,0.3)' },
          '50%':      { borderColor: 'rgba(59,130,246,0.5)' },
        },
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [],
}
