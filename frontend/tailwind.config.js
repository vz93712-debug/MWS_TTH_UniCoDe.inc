/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <--- Эта строчка заставит Tailwind сканировать вообще всё в src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
