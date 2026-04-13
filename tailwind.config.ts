import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Neutral palette - warm, sophisticated
        cream: '#FAFAF7',
        taupe: {
          50: '#F5F3F0',
          100: '#EDEAE5',
          200: '#DDD7CF',
          300: '#CDCCC0',
          400: '#B8B5A8',
          500: '#A29E94',
          600: '#8B8680',
          700: '#6F6B63',
          800: '#4D4A45',
          900: '#3A3A36',
          950: '#1F1F1D',
        },
        // Accent colors - muted, natural
        sage: {
          50: '#F7F8F6',
          100: '#EEF0ED',
          200: '#DFE3DC',
          300: '#CDD4CB',
          400: '#B5C0B1',
          500: '#99A895',
          600: '#7F8F79',
          700: '#667262',
          800: '#4D5548',
          900: '#3A3F37',
        },
        // Semantic colors
        success: '#7FA885',
        warning: '#D4A574',
        error: '#B8847B',
        info: '#8FB3C7',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['32px', { lineHeight: '40px' }],
        '4xl': ['40px', { lineHeight: '48px' }],
        '5xl': ['48px', { lineHeight: '56px' }],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '48px',
        '4xl': '64px',
      },
      borderRadius: {
        none: '0',
        xs: '2px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        full: '9999px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
