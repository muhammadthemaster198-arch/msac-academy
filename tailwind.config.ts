import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: { navy: "#0B1437", ink: "#16205B", violet: "#6D28D9", azure: "#2563EB", coral: "#FF5A5F", sun: "#FFC93C", mint: "#22D3A6", paper: "#F7F7FF" },
    fontFamily: { display: ["var(--font-display)"], sans: ["var(--font-body)"] },
  } },
  plugins: [],
} satisfies Config;
