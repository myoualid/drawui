import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

for (const name of ["gui", "layout"]) {
  const packageJson = JSON.parse(
    await readFile(path.join(root, "packages", name, "package.json"), "utf8"),
  );
  const entrypoint = path.join(
    root,
    "packages",
    name,
    packageJson.exports["."].import.replace(/^\.\//, ""),
  );
  await import(pathToFileURL(entrypoint).href);
  console.log(`Validated ${packageJson.name}`);
}
