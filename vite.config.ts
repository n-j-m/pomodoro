import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  base: "/pomodoro/",
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
  resolve: {
    alias: {
      "#": resolve(import.meta.dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ["@electric-sql/pglite"],
  },
});
