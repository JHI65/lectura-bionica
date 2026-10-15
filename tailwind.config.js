/** @type {import('tailwindcss').Config} */
// Paleta derivada del logo (libro pastel): azul/pervinca, violeta, rosa/coral y
// crema cálido. Los pasteles del logo no tienen contraste suficiente para texto
// ni botones, así que cada tono tiene una versión profunda que cumple WCAG AA
// (≥ 4,5:1 sobre blanco, crema y su propio fondo claro) y un tinte suave para fondos.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Azul del libro (hueco izquierdo), versión profunda.
        brand: { DEFAULT: '#3c62df', hover: '#234cd5', soft: '#ecf0fd' },
        // Violeta de la capa inferior del libro.
        violet: { DEFAULT: '#844dcb', soft: '#f3edfc' },
        // Rosa/coral de la página derecha.
        coral: { DEFAULT: '#ca2f44', soft: '#fdecef' },
        // Crema de la placa del icono: fondo de página.
        cream: '#faf8f5',
        // Tinta azul-marino en vez de gris neutro.
        ink: { DEFAULT: '#171b36', soft: '#4b506c', muted: '#5f6480' },
        // Neutros con un ligero tinte pervinca (sustituyen a slate de Tailwind).
        slate: {
          50: '#f7f6fb',
          100: '#efeef7',
          200: '#e1dfee',
          300: '#cdcae1',
          400: '#a09db8',
          500: '#716e8b',
          600: '#565370',
          700: '#403d59',
          800: '#2b2944',
          900: '#1d1b34',
        },
      },
      backgroundImage: {
        // Degradado pastel del logo: solo decorativo, nunca detrás de texto pequeño.
        'brand-gradient': 'linear-gradient(110deg, #a0d6fb 0%, #bab2e4 38%, #aa86d9 68%, #fdcad0 100%)',
      },
    },
  },
  plugins: [],
};
