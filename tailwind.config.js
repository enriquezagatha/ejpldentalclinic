/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./**/*.html'],
  safelist: [
    'bg-[#E3EBF9]',
    'text-[#6E80D1]',
    'current-page',
], // Update this based on where your HTML files are located
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'], // 'Inter' is now available in Tailwind
      },
    },
  },
  plugins: [],
}

