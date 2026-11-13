/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefbfb',
          100: '#d5f5f5',
          200: '#b0ecec',
          300: '#7adcdc',
          400: '#3ec3c5',
          500: '#149d9f', // Primary Ethiopian Teal
          600: '#0e7e81',
          700: '#106467',
          800: '#135153',
          900: '#144446',
          950: '#06282a',
        },
        telebirr: {
          light: '#258be0',
          DEFAULT: '#0070ba', // Telebirr signature blue
          dark: '#004c82',
        },
        ethioGold: '#f59e0b',
        ethioGreen: '#10b981',
        ethioRed: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Ethiopic', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
