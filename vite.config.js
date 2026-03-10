import { defineConfig } from "vite";
import { resolve } from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig(({ mode }) => {
  if (mode === "tasker") {
    return {
      build: {
        outDir: "dist/tasker",
        emptyOutDir: true,
        assetsInlineLimit: 100000000,
        rollupOptions: {
          input: {
            "auto-process": resolve(__dirname, "tasker/auto-process.html")
          },
          output: {
            entryFileNames: "runner.js"
          }
        }
      },
      plugins: [
        viteSingleFile({
          useRecommendedBuildConfig: false,
          inlinePattern: ["**"]
        })
      ]
    };
  }

  // Default: main build
  return {
    build: {
      outDir: "dist",
      emptyOutDir: true,
      assetsInlineLimit: 0,
      rollupOptions: {
        input: {
          main: resolve(__dirname, "index.html")
        },
        output: {
          entryFileNames: "src/assets/js/app.js",
          chunkFileNames: "src/assets/js/[name].js",
          assetFileNames: assetInfo => {
            if (assetInfo.name?.endsWith(".css"))
              return "src/assets/css/app.css";

            if (/.(png|jpg|gif|svg|ico|webp)$/i.test(assetInfo.name ?? ""))
              return "src/assets/img/[name][extname]";

            return "src/assets/[name][extname]";
          }
        }
      }
    },
    plugins: [
      viteStaticCopy({
        targets: [
          { src: "src/i18n", dest: "src" },
          { src: "src/assets/icons", dest: "src/assets" },
          { src: "src/assets/brand", dest: "src/assets" },
          { src: "src/features/dashboard/process/script.sh", dest: "src" }
        ]
      })
    ]
  };
});
