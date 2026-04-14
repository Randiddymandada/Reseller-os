import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        bg: {
          base: "#0a0a0f",
          card: "#111118",
          elevated: "#16161f",
          border: "#1e1e2a",
        },
        accent: {
          red: "#e63946",
          redMuted: "#e6394620",
          amber: "#f4a261",
          green: "#2a9d8f",
          greenMuted: "#2a9d8f20",
          blue: "#4361ee",
        },
        text: {
          primary: "#f0f0f5",
          secondary: "#8888a0",
          muted: "#55556a",
        },
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid": "40px 40px",
      },
    },
  },
  plugins: [],
};

export default config;
