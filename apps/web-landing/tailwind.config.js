/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // CheeTaxi brand palette
        brand: {
          50: '#FFF8E7',
          100: '#FFEDC2',
          200: '#FFDB85',
          300: '#FFC23A',
          400: '#FFA800',
          500: '#F08C00', // primary
          600: '#CC7000',
          700: '#A35400',
          800: '#7A3F00',
          900: '#522A00',
        },
        ink: {
          50: '#F7F7F8',
          100: '#EEEFF1',
          200: '#D7D9DD',
          300: '#B0B5BC',
          400: '#7F8590',
          500: '#5A606B',
          600: '#3F444D',
          700: '#2A2E34',
          800: '#1B1E22',
          900: '#0E1012',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-inter)', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
