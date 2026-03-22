/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
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
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
        },
        accent: {
          blue: '#00A3FF',
          green: '#00C853',
        },
        surface: 'var(--background)',
        card: 'var(--surface)',
        border: 'var(--border)',
      }
    },
  },
  plugins: [],
}
