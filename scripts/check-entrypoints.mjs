import { readFile } from "node:fs/promises";

const packageUrl = new URL("../package.json", import.meta.url);
const packageRootUrl = new URL("../", import.meta.url);
const packageJson = JSON.parse(await readFile(packageUrl, "utf8"));
const entrypoints = Object.entries(packageJson.exports)
  .map(([, target]) => target)
  .filter((target) => typeof target === "string" && target.endsWith(".js"));

for (const entrypoint of entrypoints) {
  const resolvedUrl = new URL(entrypoint.replace(/^\.\//, ""), packageRootUrl);
  await import(resolvedUrl);
}

console.log(`Validated ${entrypoints.length} JavaScript entrypoints.`);
