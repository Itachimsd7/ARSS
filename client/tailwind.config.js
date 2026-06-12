/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep space backgrounds
        space: {
          50:  '#f0ecff',
          100: '#ddd6fe',
          200: '#c4b5fd',
          300: '#a78bfa',
          400: '#8b5cf6',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#1a0b3e',
          900: '#0d0520',
          950: '#030014',
        },
        // Electric violet primary
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // Cyan accent
        cyan: {
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        // Neon emerald for success
        accent: {
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        // Coral rose for danger
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
          800: '#1e1b4b',
          900: '#0f0a2e',
          950: '#030014',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #030014 0%, #1a0b3e 40%, #0d0520 70%, #030014 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(6,182,212,0.05) 100%)',
        'glow-conic': 'conic-gradient(from 180deg at 50% 50%, #7c3aed 0deg, #06b6d4 120deg, #10b981 240deg, #7c3aed 360deg)',
      },
      boxShadow: {
        'glow-sm': '0 0 15px rgba(139,92,246,0.3)',
        'glow-md': '0 0 30px rgba(139,92,246,0.4)',
        'glow-lg': '0 0 60px rgba(139,92,246,0.5)',
        'glow-cyan': '0 0 30px rgba(6,182,212,0.3)',
        'glow-accent': '0 0 30px rgba(16,185,129,0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,92,246,0.05)',
        'card-hover': '0 12px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.15)',
        'inner-glow': 'inset 0 0 30px rgba(139,92,246,0.1)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'gradient-x': 'gradient-x 3s ease infinite',
        'border-glow': 'border-glow 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'border-glow': {
          '0%, 100%': { borderColor: 'rgba(139,92,246,0.3)' },
          '50%': { borderColor: 'rgba(6,182,212,0.5)' },
        },
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [],
}
