import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        loopa: {
          lime: "#D9F36A",       // Electric Lime
          lavender: "#A99AF7",   // Soft Lavender
          coral: "#FF876F",      // Coral Orange
          cream: "#F7F3EC",      // Warm Cream
          charcoal: "#242424",   // Deep Charcoal
          card: "#FFFFFF",
          border: "#E7E2D6",
          muted: "#7A7875",
        },
        background: "#F7F3EC",
        foreground: "#242424",
      },
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "system-ui", "-apple-system", "sans-serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        "3xl": "1.75rem",
        "4xl": "2.25rem",
      },
      boxShadow: {
        "playful": "4px 4px 0px 0px #242424",
        "playful-sm": "2px 2px 0px 0px #242424",
        "playful-lg": "6px 6px 0px 0px #242424",
        "glow-lime": "0 0 25px -5px rgba(217, 243, 106, 0.6)",
      },
    },
  },
  plugins: [],
};
export default config;
