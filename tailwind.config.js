/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#10B981',
        secondary: '#6366F1',
        accent: '#F59E0B',
      },
      fontFamily: {
        'inter': ['Inter'],
      },
    },
  },
  plugins: [],
}