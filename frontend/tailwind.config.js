/** @type {import('tailwindcss').Config} */
import tailwindScrollbarHide from "tailwind-scrollbar-hide";
import tailwindScrollbar from "tailwind-scrollbar";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        mts: {
          red: "#FF0032",
          dark: "#CC0028",
          light: "#FFEBED",
        },
      },
      fontFamily: {
        sans: ['"MTS Compact"', "sans-serif"], // ИСПРАВЛЕНО: было MTS Sans
        wide: ['"MTS Wide"', "sans-serif"],
      },
    },
  },
  plugins: [tailwindScrollbarHide, tailwindScrollbar({ nocompatible: true })],
};
