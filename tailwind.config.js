/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        ink: { DEFAULT: '#1c1f24', soft: '#4a5260', muted: '#6b7280' },
        brand: { DEFAULT: '#2f5bd3', hover: '#244aae', soft: '#e8eefc' },
      },
    },
  },
  plugins: [],
};
