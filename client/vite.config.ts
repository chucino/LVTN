import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const requestedPort = Number(process.env.VITE_PORT || process.env.PORT || 5173);
const cacheSuffix = process.env.VITE_PORT || "";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  cacheDir: cacheSuffix ? `node_modules/.vite-${cacheSuffix}` : "node_modules/.vite",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : 5173,
    strictPort: false,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/public": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
