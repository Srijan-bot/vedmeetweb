/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f4f7f4',
          100: '#e3ebe3',
          200: '#c5d9c5',
          300: '#9bbd9b',
          400: '#749c74',
          500: '#537d53',
          600: '#3f613f',
          700: '#334d33',
          800: '#2a3d2a',
          900: '#233223',
        },
        earth: {
          50: '#fbf7f6',
          100: '#f5ede9',
          200: '#ebdcd5',
          300: '#dec2b6',
          400: '#cd9f8e',
          500: '#b87d69',
          600: '#a66350',
          700: '#8a4f40',
          800: '#734338',
          900: '#5e3830',
        },
        clay: {
          50: '#fdf8f6',
          100: '#fcefe9',
          200: '#f8decb',
          300: '#f2c5a6',
          400: '#ea9f74',
          500: '#e27c49',
          600: '#d46036',
          700: '#b04a2a',
          800: '#8d3d28',
          900: '#723425',
        },
        saffron: {
          50: '#fffbf0',
          100: '#fff4d6',
          200: '#ffe6ad',
          300: '#ffd27a',
          400: '#ffb947',
          500: '#fc9e1b',
          600: '#e07e0e',
          700: '#ba5e0b',
          800: '#964810',
          900: '#7a3c12',
        },
        cream: '#fcfbf7',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
