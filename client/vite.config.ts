import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  // Load env file based on the current mode (development, production, etc.)
  // The third argument '' loads all variables regardless of the VITE_ prefix
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url))
      }
    },
    server: {
      port: Number(env.VITE_PORT) || 4000,
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL, // Use the environment variable for the API base URL
          changeOrigin: true, // Needed for virtual hosted sites
          rewrite: (path) => path.replace(/^\/api/, "") // Remove /api prefix when forwarding the request
        }
      }
    }
  }
});
