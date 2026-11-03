import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Vercel runs api/ as plain Node ES modules: a relative import without the
// `.js` extension crashes the function at load (an opaque 500 in production).
const ROOTS = ["api", "server", "app/lib/due.ts", "app/lib/types.ts"];

function files(p: string): string[] {
  if (statSync(p).isFile()) return [p];
  return readdirSync(p).flatMap((f) => files(path.join(p, f)));
}

describe("serverless function imports", () => {
  const sources = ROOTS.flatMap(files).filter((f) => f.endsWith(".ts"));

  it.each(sources)("%s uses .js on relative imports", (file) => {
    const bad = [
      ...readFileSync(file, "utf8").matchAll(/from\s+"(\.{1,2}\/[^"]+)"/g),
    ]
      .map((m) => m[1])
      .filter((spec) => !spec.endsWith(".js"));
    expect(bad).toEqual([]);
  });

  it("never uses the @/ alias", () => {
    const offenders = sources.filter((f) =>
      /from\s+"@\//.test(readFileSync(f, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
