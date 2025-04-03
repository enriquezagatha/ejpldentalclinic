/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./**/*.html'], // Update this based on where your HTML files are located
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'], // 'Inter' is now available in Tailwind
      },
    },
  },
  plugins: [],
}

