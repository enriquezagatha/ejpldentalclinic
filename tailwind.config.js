/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.html"],
  safelist: [
    "bg-[#E3EBF9]",
    "text-[#6E80D1]",
    "current-page",
    "w-[300px]",
    "h-[350px]",
    "w-3/6",
    "md:w-auto",
    "w-auto",
    "place-items-center",
    "xl:grid-cols-3",
    "sm:grid-cols-2",
  ], // Update this based on where your HTML files are located
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"], // 'Inter' is now available in Tailwind
      },
    },
  },
  plugins: [],
};
