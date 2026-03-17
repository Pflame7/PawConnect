/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        orange: {
          40: "#fff7ed",
          80: "#ffe7cc",
        },
      },
    },
  },
  plugins: [],
};