import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "bg-base": "var(--bg-base)",
        "bg-card": "var(--bg-card)",
        "bg-elevated": "var(--bg-elevated)",
        "bg-border": "var(--bg-border)",
        "border-hover": "var(--bg-border-hover)",
        "accent-red": "var(--accent-red)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
      },
      fontFamily: {
  display: ['"Syne"', "sans-serif"],
  body: ['"DM Sans"', "sans-serif"],
},
    },
  },
  plugins: [],
};

export default config;
