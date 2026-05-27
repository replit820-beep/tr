import { cp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const root = process.cwd();

// Step 1: vite build
console.log("🔨 Running vite build...");
execSync("npm run build", { stdio: "inherit", cwd: root });
console.log("✅ Vite build complete");

// Step 2: Find server entry
const serverDir = join(root, "dist", "server");
let serverEntry = join(serverDir, "server.js");
if (!existsSync(serverEntry)) serverEntry = join(serverDir, "index.js");

// Step 3: esbuild — ESM bundle with CJS require() shim in banner
// Banner is generated via node -e to avoid shell escaping issues
console.log("📦 Bundling server...");
const bundleOut = join(root, "dist", "server-bundle.mjs");
const bannerCode = [
  'import { createRequire } from \\"module\\";',
  'import { fileURLToPath } from \\"url\\";',
  'import { dirname } from \\"path\\";',
  'const require = createRequire(import.meta.url);',
  'const __filename = fileURLToPath(import.meta.url);',
  'const __dirname = dirname(__filename);',
].join(" ");

execSync(
  `node_modules/.bin/esbuild "${serverEntry}" --bundle --platform=node --format=esm --outfile="${bundleOut}" --banner:js="$(node -e "console.log('${bannerCode}')")"`,
  { stdio: "inherit", cwd: root, shell: true }
);
console.log("✅ Bundle ready");

// Step 4: Setup .vercel/output
await rm(join(root, ".vercel", "output"), { recursive: true, force: true });
await mkdir(join(root, ".vercel", "output", "functions", "index.func"), { recursive: true });
await mkdir(join(root, ".vercel", "output", "static"), { recursive: true });

// Step 5: Copy client assets
await cp(join(root, "dist", "client"), join(root, ".vercel", "output", "static"), { recursive: true });

// Step 6: Copy bundle
await cp(bundleOut, join(root, ".vercel", "output", "functions", "index.func", "index.mjs"));

// Step 7: package.json
await writeFile(
  join(root, ".vercel", "output", "functions", "index.func", "package.json"),
  JSON.stringify({ type: "module" }), "utf8"
);

// Step 8: vc-config
await writeFile(
  join(root, ".vercel", "output", "functions", "index.func", ".vc-config.json"),
  JSON.stringify({ runtime: "nodejs20.x", handler: "index.mjs", launcherType: "Nodejs", supportsResponseStreaming: true }, null, 2),
  "utf8"
);

// Step 9: Routes
await writeFile(
  join(root, ".vercel", "output", "config.json"),
  JSON.stringify({ version: 3, routes: [{ handle: "filesystem" }, { src: "/(.*)", dest: "/index" }] }, null, 2),
  "utf8"
);

console.log("✅ .vercel/output ready");
