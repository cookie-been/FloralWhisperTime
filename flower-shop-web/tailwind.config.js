/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}", "../shared/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: "#2E7D32",
        matcha: "#4CAF50",
        mint: "#E8F5E9",
        ink: "#333333",
        muted: "#666666",
      },
      fontFamily: {
        sans: ["PingFang SC", "Microsoft YaHei", "Helvetica Neue", "Arial", "sans-serif"],
      },
      boxShadow: {
        soft: "0 16px 45px rgba(46, 125, 50, 0.12)",
      },
    },
  },
  plugins: [],
};
