/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          50: "#FAFAF4",
          100: "#EFF0E4",
          300: "#D7DAC8",
        },
        ink: {
          900: "#17241F",
        },
        muted: "#5B6B62",
        income: "#3F7A57",
        expense: "#A8442A",
        gold: "#B98423",
      },
      fontFamily: {
        serif: ["Lora", "Georgia", "serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
