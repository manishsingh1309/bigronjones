import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

const viteRoot = __dirname;

/** Admin and shared code live outside Vite root; resolve npm deps from here. */
function resolveExternalWorkspaceDeps(): Plugin {
  const rootPrefix = path.normalize(`${viteRoot}${path.sep}`);

  return {
    name: "resolve-external-workspace-deps",
    enforce: "pre",
    async resolveId(id, importer, options) {
      if (!importer) return null;
      if (id.startsWith(".") || id.startsWith("\0") || path.isAbsolute(id)) {
        return null;
      }

      if (path.normalize(importer).includes(rootPrefix)) return null;

      return this.resolve(id, path.join(viteRoot, "package.json"), {
        ...options,
        skipSelf: true,
      });
    },
  };
}

// Project layout (relative to this file):
//   ./src                  — frontend source
//   ../shared/data         — data shared with backend
//   ../shared/lib          — pure utilities shared with backend
//   ../backend/api         — Vercel serverless functions (not built by Vite)
//   ../admin/frontend      — admin UI (pages, components, api client)
//
// Path-alias rules used in source code:
//   @/components/*  → ./src/components/*
//   @/hooks/*       → ./src/hooks/*
//   @/pages/*       → ./src/pages/*
//   @/lib/*         → ../shared/lib/*       (browser-safe utils)
//   @/data/*        → ../shared/data/*      (programs, products, seedBlogs, …)
//   @/*             → ./src/*               (catch-all)
//   @admin/*        → ../admin/frontend/*   (admin UI)
export default defineConfig({
  // The frontend directory is the Vite project root: index.html lives here.
  root: __dirname,
  // .env files live at the repo root, alongside package.json — not inside frontend/.
  envDir: path.resolve(__dirname, ".."),
  plugins: [resolveExternalWorkspaceDeps(), react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: /^@admin\/(.*)$/,
        replacement: path.resolve(__dirname, "../admin/frontend/$1"),
      },
      {
        find: /^@\/components\/(.*)$/,
        replacement: path.resolve(__dirname, "src/components/$1"),
      },
      {
        find: /^@\/hooks\/(.*)$/,
        replacement: path.resolve(__dirname, "src/hooks/$1"),
      },
      {
        find: /^@\/pages\/(.*)$/,
        replacement: path.resolve(__dirname, "src/pages/$1"),
      },
      {
        find: /^@\/lib\/(.*)$/,
        replacement: path.resolve(__dirname, "../shared/lib/$1"),
      },
      {
        find: /^@\/data\/(.*)$/,
        replacement: path.resolve(__dirname, "../shared/data/$1"),
      },
      { find: /^@\/(.*)$/, replacement: path.resolve(__dirname, "src/$1") },
    ],
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
        secure: false,
      },
    },
    hmr: {
      host: "localhost",
      port: 3000,
      protocol: "ws",
    },
  },
  preview: {
    port: 3000,
    host: true,
    // Required when Render runs `vite preview` (Node web service start command).
    allowedHosts: [".onrender.com"],
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
