// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";


// 模擬 __dirname (因為 ESM 模式裡沒有 __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // 支援 @ 代表 src 路徑
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000", // 本地開發用，Vercel 會自動處理 /api
        changeOrigin: true,
      },
    },
  },
});
