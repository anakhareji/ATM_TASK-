/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6767',
          hover: '#FF4D4D',
        },
        secondary: {
          DEFAULT: '#000000',
          muted: '#8E8E8E',
        },
        accent: {
          blue: '#00A3FF',
          green: '#00C853',
        },
        surface: '#F6F7F9',
      }
    },
  },
  plugins: [],
}
