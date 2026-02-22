/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'green-sphere': '#00A859',
        'green-dark': '#006B3C',
        'green-light': '#E8F5E9',
      },
    },
  },
  plugins: [],
}
