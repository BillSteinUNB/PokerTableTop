import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { guardDevelopmentConnections } from "./scripts/dev-reset-guard.js";
export default defineConfig(({ mode }) => {
  const { VITE_SERVER_URL: serverUrl } = loadEnv(mode, process.cwd(), "VITE_");
  if (process.env.VERCEL && !serverUrl)
    throw new Error(
      "Set VITE_SERVER_URL to the Northflank HTTPS origin in Vercel's environment variables, then redeploy.",
    );
  if (serverUrl) {
    const url = new URL(serverUrl);
    if (
      !/^https?:$/.test(url.protocol) ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      url.username ||
      url.password ||
      (process.env.VERCEL && url.protocol !== "https:")
    )
      throw new Error(
        "VITE_SERVER_URL must be the game server's http(s) origin with no path. Vercel requires HTTPS.",
      );
  }
  return {
    plugins: [
      react(),
      {
        name: "development-connection-guard",
        configureServer(server) {
          guardDevelopmentConnections(server.httpServer);
        },
      },
    ],
    server: {
      port: 3000,
      host: "0.0.0.0",
      strictPort: true,
      proxy: {
        "/socket.io": { target: "http://127.0.0.1:3001", ws: true },
        "/api": "http://127.0.0.1:3001",
      },
    },
    preview: {
      port: 3000,
      proxy: {
        "/socket.io": { target: "http://127.0.0.1:3001", ws: true },
        "/api": "http://127.0.0.1:3001",
      },
    },
  };
});
