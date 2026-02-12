import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        zen: {
          bg: "#0A0A1A",
          surface: "#12122A",
          accent: "#6C63FF",
          glow: "#A78BFA",
        },
      },
    },
  },
  plugins: [],
};

export default config;