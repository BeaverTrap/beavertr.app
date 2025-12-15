import type { Config } from "tailwindcss";

const config: Config & { daisyui?: any } = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        dos: ['"Press Start 2P"', "monospace"], // Cassette Theme Font
        dnd: ['"Cinzel"', "serif"], // Homebrew Theme Font
        shadowdarkHeader: ['"JSL Blackletter"', "serif"],
        shadowdarkCategory: ['"Old Newspaper"', "serif"],
        shadowdarkEntry: ['"Montserrat"', "sans-serif"],
      },
      colors: {
        neonGreen: "#39FF14",
        neonCyan: "#0FF",
        maroon: "#800000",
        parchment: "#f5f5dc",
        brown: "#5a3e2b",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          primary: "#3B82F6",
          "base-100": "#ffffff",
          "base-content": "#000000",
          neutral: "#E5E7EB",
          "neutral-content": "#1F2937",
          border: "#D1D5DB",
          "base-200": "#f3f4f6",
          "base-300": "#e5e7eb",
          "font-family-base": "sans-serif",
        },
      },
      {
        dark: {
          primary: "#3B82F6",
          "base-100": "#000000",
          "base-content": "#ffffff",
          neutral: "#111111",
          "neutral-content": "#D1D5DB",
          border: "#333333",
          "font-family-base": "sans-serif",
        },
      },
      {
        cassette: {
          primary: "#39FF14", // Neon Green
          "base-100": "#000000", // Black Background
          "base-content": "#39FF14", // Neon Green Text
          neutral: "#111111",
          "neutral-content": "#39FF14",
          border: "#0FF", // Neon Cyan Borders
          "font-family-base": '"Press Start 2P", monospace',
        },
      },
      {
        homebrew: {
          primary: "#8B4513",
          "base-100": "#f5f5dc",
          "base-content": "#2a1a0a",
          neutral: "#8B7355",
          "neutral-content": "#2a1a0a",
          border: "#8B7355",
          "base-200": "#f0ead8",
          "base-300": "#e5dcc5",
          "font-family-base": '"Cinzel", serif',
        },
      },
    ],
  },
};

export default config;

