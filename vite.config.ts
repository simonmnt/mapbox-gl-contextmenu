import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig(({ command }) => {
  const isBuild = command === "build";

  if (isBuild) {
    return {
      build: {
        emptyOutDir: false,
        lib: {
          entry: resolve(__dirname, "src/index.ts"),
          name: "MapboxGLContextMenu",
          fileName: "index",
          formats: ["es", "cjs"]
        },
        rollupOptions: {
          external: ["mapbox-gl"],
          output: {
            globals: {
              "mapbox-gl": "mapboxgl"
            }
          }
        }
      }
    };
  }

  return {
    root: "example",
    envDir: resolve(__dirname, "."),
    server: {
      port: 3000,
      open: true
    }
  };
});
