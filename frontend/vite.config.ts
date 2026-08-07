import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const rootDir = path.resolve(__dirname, "..");
  const env = { ...loadEnv(mode, rootDir, ""), ...loadEnv(mode, process.cwd(), "") };
  const targetUrl = env.VITE_API_URL || `http://127.0.0.1:${env.BACKEND_PORT || 3000}`;

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: Number(env.FRONTEND_PORT || 5173),
      proxy: {
        "/api": {
          target: targetUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
