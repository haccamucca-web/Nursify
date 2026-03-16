/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nursify: {
          teal: '#00E5FF',
          tealLight: 'rgba(0, 229, 255, 0.1)',
          coral: '#FF8A65',
          bg: '#000000',
          card: '#0a0a0a',
          text: '#FFFFFF',
          textLight: '#B0BEC5',
          border: 'rgba(255, 255, 255, 0.15)'
        }
      }
    },
  },
  plugins: [],
}
