import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          const packagePath = id.split("node_modules/")[1];
          const packageSegments = packagePath.split("/");
          const packageName = packageSegments[0].startsWith("@")
            ? `${packageSegments[0]}/${packageSegments[1]}`
            : packageSegments[0];

          if (packageName === "lucide-react") {
            return "icons";
          }

          if (packageName === "react" || packageName === "react-dom" || packageName === "scheduler") {
            return "react";
          }

          if (packageName === "react-router" || packageName === "react-router-dom") {
            return "router";
          }

          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@shared": fileURLToPath(new URL("../shared", import.meta.url)),
    },
  },
});
