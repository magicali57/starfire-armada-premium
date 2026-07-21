import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Throwaway resolution shim so scripts/verification/*.ts can import the
// real "@/..." bundler-style aliases and extensionless relative specifiers
// straight from src/ under plain `node --experimental-strip-types`, without
// installing ts-node/tsx (this sandbox's npm registry access is
// unreliable/hangs — see docs/handoffs precedent). Verification-only; never
// referenced by the app itself.
const SRC_ROOT = fileURLToPath(new URL("../../src/", import.meta.url));
const CANDIDATE_SUFFIXES = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

function resolveOnDisk(basePath) {
  for (const suffix of CANDIDATE_SUFFIXES) {
    const candidate = basePath + suffix;
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const abs = path.join(SRC_ROOT, specifier.slice(2));
    const resolved = resolveOnDisk(abs) ?? abs;
    return nextResolve(pathToFileURL(resolved).href, context);
  }
  if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
    const parentPath = fileURLToPath(context.parentURL);
    const abs = path.resolve(path.dirname(parentPath), specifier);
    if (!path.extname(abs)) {
      const resolved = resolveOnDisk(abs);
      if (resolved) return nextResolve(pathToFileURL(resolved).href, context);
    }
  }
  return nextResolve(specifier, context);
}

// .tsx files with no actual JSX (e.g. app/routes.tsx) are otherwise rejected
// by Node's extension-based format detection even under
// --experimental-strip-types (which only auto-recognizes .ts/.mts/.cts).
// Force the same "strip types" handling for .tsx by reading the source
// ourselves and re-declaring the format explicitly.
export async function load(url, context, nextLoad) {
  if (url.endsWith(".tsx")) {
    const source = readFileSync(fileURLToPath(url), "utf8");
    return { format: "module-typescript", source, shortCircuit: true };
  }
  return nextLoad(url, context);
}
