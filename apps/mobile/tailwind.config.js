/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          400: "#e879f9",
          500: "#d946ef",
          600: "#c026d3",
        },
        surface: {
          900: "#18181b",
          950: "#09090b",
        },
      },
    },
  },
  plugins: [],
}
