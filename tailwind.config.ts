import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FFF8F0",
        blush: "#F8C8DC",
        chocolate: "#8B5E3C",
        gold: "#D4AF37",
        ink: "#261B14"
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
        display: ["var(--font-montserrat)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        premium: "0 24px 70px rgba(38, 27, 20, 0.12)",
        soft: "0 12px 35px rgba(38, 27, 20, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
