import { defineConfig, Plugin, ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import project from "./project.json";
function renameHtmlPlugin(outDir: string, from: string): Plugin {
  return {
    name: "rename-html-plugin",
    closeBundle() {
      const fromPath = path.resolve(__dirname, outDir, from);
      const toPath = path.resolve(__dirname, outDir, "index.html");
      if (fs.existsSync(fromPath)) {
        fs.renameSync(fromPath, toPath);
      }
    },
  };
}
function htmlServePlugin(htmlFile: string): Plugin {
  let htmlContent: string | null = null;
  return {
    name: "html-serve-plugin",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        const pathname = url.split("?")[0];

        // Skip API, HMR, static files, favicon
        if (
          pathname === "/favicon.ico" ||
          pathname.startsWith("/api") ||
          pathname.startsWith("/@") ||
          pathname.startsWith("/node_modules") ||
          /\.[a-zA-Z0-9]+$/.test(pathname)
        ) {
          return next();
        }

        // Serve the HTML file directly (SPA fallback)
        try {
          if (htmlContent === null) {
            htmlContent = fs.readFileSync(
              path.resolve(__dirname, `${htmlFile}.html`),
              "utf-8",
            );
          }
          const html = await server.transformIndexHtml(
            `/${htmlFile}.html`,
            htmlContent,
            req.url,
          );
          res.setHeader("Content-Type", "text/html");
          res.end(html);
        } catch (e) {
          next(e);
        }
      });
    },
  };
}
export default defineConfig(({ mode, command }) => {
  const isWeb = mode === "web";
  const isAdmin = mode === "admin";
  var proxy: Record<string, string | ProxyOptions> | undefined = undefined;
  if (command === "serve") {
    proxy = {
      "/api": {
        target: "http://localhost:" + project.api.port,
        changeOrigin: true,
        ws: true,
      },
    };
  }
  // Default client build mode
  return {
    plugins: [
      htmlServePlugin(isWeb || isAdmin ? mode : "index"),
      isWeb && renameHtmlPlugin("dist-web", "web.html"),
      isAdmin && renameHtmlPlugin("dist-admin", "admin.html"),
      react(),
      tailwindcss(),
      mode === "electron" &&
        electron([
          {
            entry: "electron/index.ts",
            vite: {
              build: {
                sourcemap: mode === "electron",
              },
            },
          },
        ]),
      mode === "electron" && renderer(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@components": path.resolve(__dirname, "./components"),
        "@admin": path.resolve(__dirname, "./admin"),
        "@utils": path.resolve(__dirname, "./utils"),
      },
      dedupe: ["react", "react-dom"],
    },
    optimizeDeps: {
      exclude: [
        "@capgo/capacitor-navigation-bar",
        "@capacitor/status-bar",
        "@capacitor/app",
        "@rdlabo/capacitor-screenshot-event",
        "capacitor-screenshot",
      ],
    },
    server: {
      host: "0.0.0.0",
      port: isWeb
        ? project.web.port
        : isAdmin
          ? project.admin.port
          : project.app.port,
      proxy,
    },
    build: {
      outDir: isWeb ? "dist-web" : isAdmin ? "dist-admin" : "dist",
      emptyOutDir: true,
      rollupOptions: isWeb
        ? {
            input: {
              main: path.resolve(__dirname, "web.html"),
            },
          }
        : isAdmin
          ? {
              input: {
                main: path.resolve(__dirname, "admin.html"),
              },
            }
          : undefined,
    },
  };
});
