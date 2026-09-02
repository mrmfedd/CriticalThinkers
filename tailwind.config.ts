import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07090d",
        steel: "#9bb0c7",
        chrome: "#d7dee8",
        flagRed: "#c8102e",
        flagBlue: "#002868",
      },
      fontFamily: {
        display: ["var(--font-display)", "Arial Black", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        metal: "0 18px 50px rgba(0, 0, 0, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
