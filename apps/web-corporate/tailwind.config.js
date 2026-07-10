/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF8E7', 100: '#FFEDC2', 200: '#FFDB85', 300: '#FFC23A',
          400: '#FFA800', 500: '#F08C00', 600: '#CC7000', 700: '#A35400',
          800: '#7A3F00', 900: '#522A00',
        },
        ink: {
          50: '#F7F7F8', 100: '#EEEFF1', 200: '#D7D9DD', 300: '#B0B5BC',
          400: '#7F8590', 500: '#5A606B', 600: '#3F444D', 700: '#2A2E34',
          800: '#1B1E22', 900: '#0E1012',
        },
      },
    },
  },
  plugins: [],
};
