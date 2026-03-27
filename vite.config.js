import { defineConfig } from "vite";
import { resolve } from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { viteSingleFile } from "vite-plugin-singlefile";
import { minify } from "html-minifier-terser";

const minifyHtml = () => ({
  name: "minify-html",
  enforce: "post",
  apply: "build",
  async generateBundle(_, bundle) {
    for (const [name, file] of Object.entries(bundle)) {
      if (file.type === "asset" && name.endsWith(".html")) {
        file.source = await minify(file.source.toString(), {
          collapseWhitespace: true,
          removeComments: true,
          minifyCSS: true,
          minifyJS: true
        });
      }
    }
  }
});

const renameHtml = (from, to) => ({
  name: "rename-html",
  enforce: "post",
  apply: "build",
  generateBundle(_, bundle) {
    if (bundle[from]) {
      bundle[to] = { ...bundle[from], fileName: to };
      delete bundle[from];
    }
  }
});

export default defineConfig(({ mode }) => {
  const isTasker = mode === "tasker";

  return {
    base: mode === "main" ? "/tagly/" : "/",

    build: {
      outDir: isTasker ? "dist/tasker" : "dist",
      emptyOutDir: true,
      assetsInlineLimit: 100_000_000,
      rollupOptions: {
        input: resolve(
          __dirname,
          isTasker ? "tasker/auto-process.html" : "index.html"
        ),
        output: { inlineDynamicImports: !isTasker }
      }
    },
    plugins: [
      viteSingleFile({ useRecommendedBuildConfig: true }),
      isTasker &&
        renameHtml("tasker/auto-process.html", "auto-process/index.html"),
      minifyHtml(),
      !isTasker &&
        viteStaticCopy({
          targets: [
            {
              src: "src/i18n",
              dest: "src"
            },
            {
              src: "src/features/dashboard/process/script.sh",
              dest: "src"
            }
          ]
        })
    ].filter(Boolean)
  };
});
