import * as path from "node:path";
import { fileURLToPath } from "node:url";

async function build() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  const result = await Bun.build({
    entrypoints: [path.resolve(__dirname, "../src/extension.ts")],
    outdir: path.resolve(__dirname, "../out"),
    target: "node",
    format: "cjs",
    sourcemap: "external",
    external: ["vscode"],
    minify: false,
    splitting: false,
  });

  if (!result.success) {
    console.error("❌ Build failed!");
    result.logs.forEach((log) => console.error(log));
    process.exit(1);
  }

  console.log("✅ Build successful!");
  console.log(`📦 Bundled ${result.outputs.length} file(s)`);
}

build().catch((error) => {
  console.error("❌ Build error:", error);
  process.exit(1);
});
