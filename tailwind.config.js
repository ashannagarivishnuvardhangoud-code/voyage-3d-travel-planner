/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { ink: '#162523', forest: '#153d38', teal: '#2d8175', mist: '#eff3ef', orange: '#e89a58' },
      fontFamily: { sans: ['DM Sans', 'sans-serif'], display: ['Manrope', 'sans-serif'] },
      boxShadow: { soft: '0 10px 35px rgba(24, 48, 43, .08)', card: '0 20px 50px rgba(24, 48, 43, .11)' },
    },
  },
  plugins: [],
}
