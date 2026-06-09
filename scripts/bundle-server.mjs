// Bundle the Node server (TypeScript, NodeNext) into a single standalone ESM
// file the packaged desktop app can run with plain Node — no pnpm, no tsx, no
// node_modules. The enrichment JSON tables are imported, so they get inlined.
import { build } from "esbuild";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

await build({
  entryPoints: [resolve(root, "server/src/index.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  outfile: resolve(root, "desktop/server-bundle.mjs"),
  // The server imports shared via the "@shared" alias and NodeNext ".js"
  // specifiers; esbuild resolves the .js specifiers to the real .ts sources.
  alias: { "@shared": resolve(root, "shared/src") },
  // ws's optional native speedups — left external so the pure-JS fallback runs.
  external: ["bufferutil", "utf-8-validate"],
  // Some bundled CJS deps expect a CommonJS `require` in the ESM output.
  banner: {
    js: "import{createRequire as ___cr}from'module';const require=___cr(import.meta.url);",
  },
  logLevel: "info",
});

console.log("[bundle] wrote desktop/server-bundle.mjs");
