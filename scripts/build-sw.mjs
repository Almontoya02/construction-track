// Runs after `react-router build`: writes the list of every built file into
// build/client/sw.js so the service worker can precache the whole app for
// offline use, and stamps a build id so each deploy installs a fresh cache.
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("build/client");
const swPath = path.join(root, "sw.js");
const skip = new Set(["sw.js", "icon.svg"]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((e) => {
      const full = path.join(dir, e.name);
      return e.isDirectory() ? walk(full) : [full];
    }),
  );
  return files.flat();
}

const files = (await walk(root))
  .map((f) => "/" + path.relative(root, f).split(path.sep).join("/"))
  .filter((f) => !skip.has(f.slice(1)) && !f.endsWith(".map"))
  .sort();

const hash = createHash("sha256");
for (const f of files)
  hash.update(f).update(await readFile(path.join(root, f)));
const buildId = hash.digest("hex").slice(0, 12);

const source = await readFile(swPath, "utf8");
if (!source.includes('"__BUILD_ID__"')) {
  throw new Error("build-sw: no se encontró el marcador __BUILD_ID__ en sw.js");
}
const output =
  `self.__PRECACHE = ${JSON.stringify(["/", ...files])};\n` +
  source.replace('"__BUILD_ID__"', JSON.stringify(buildId));
await writeFile(swPath, output);

console.log(
  `build-sw: ${files.length} archivos precacheados (build ${buildId})`,
);
