import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: "#07858B",
          "teal-dark": "#066D73",
          "teal-light": "#E7F5F5",
          "teal-subtle": "#F0F9F9",
          bg: "#F7F9FC",
          card: "#FFFFFF",
          text: "#182536",
          muted: "#7B8794",
          border: "#E8EDF2",
          orange: "#FF9B45",
          gold: "#F5B83D",
          pink: "#ED4B9B",
          purple: "#8B4DE8",
          blue: "#5877D9",
          success: "#22A06B",
          error: "#E05252",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 8px -2px rgba(24, 37, 54, 0.05), 0 1px 4px -1px rgba(24, 37, 54, 0.03)",
        "card-hover": "0 10px 25px -5px rgba(7, 133, 139, 0.08), 0 8px 10px -6px rgba(7, 133, 139, 0.05)",
        premium: "0 20px 35px -10px rgba(7, 133, 139, 0.15)",
        gold: "0 10px 25px -5px rgba(245, 184, 61, 0.3)",
      },
      borderRadius: {
        card: "18px",
      },
    },
  },
  plugins: [],
};

export default config;
