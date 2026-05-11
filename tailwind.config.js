/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.{html,js}", "./admin/**/*.{html,js}", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        "brand-blue": "#022A6A",
        "brand-yellow": "#E7B901",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"), // Adicionamos o plugin para formatar os artigos
  ],
};
