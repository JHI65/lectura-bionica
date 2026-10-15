/** @type {import('tailwindcss').Config} */
// Paleta derivada del logo (libro pastel): cielo, pervinca, lavanda, rosa,
// melocotón y crema. Es deliberadamente cálida y NO usa el azul eléctrico ni el
// degradado azul-violeta típicos de las plantillas «de IA».
//  - Superficies y botones primarios: los pasteles del logo, con texto oscuro
//    (contraste ≥ 9:1).
//  - Texto de acento, enlaces y controles: una frambuesa profunda sacada del
//    rosa y la lavanda del logo (≥ 4,7:1 sobre blanco, crema y su tinte suave).
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Frambuesa: versión profunda del rosa + lavanda del logo.
        brand: { DEFAULT: '#b83a7d', hover: '#9d326b', soft: '#fbeff5' },
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
        // Botón primario: cielo → lavanda → rosa, con texto oscuro encima.
        'button-gradient': 'linear-gradient(110deg, #a8dcfb 0%, #c3b7ec 50%, #fdc4cf 100%)',
      },
    },
  },
  plugins: [],
};
