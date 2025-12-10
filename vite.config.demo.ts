import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: "examples/basic",
  base: "/mapbox-gl-contextmenu/demo/",
  envDir: resolve(__dirname, "."),
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler"
      }
    }
  },
  build: {
    outDir: resolve(__dirname, "dist-pages/demo"),
    emptyOutDir: true
  }
});
