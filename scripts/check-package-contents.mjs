import { exec } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execAsync = promisify(exec);
const packageRootUrl = new URL("../", import.meta.url);
const packageRootPath = fileURLToPath(packageRootUrl);
const packageUrl = new URL("../package.json", import.meta.url);
const packageJson = JSON.parse(await readFile(packageUrl, "utf8"));

const { stdout } = await execAsync(
  "npm pack --json --dry-run",
  {
    cwd: packageRootPath,
    windowsHide: true,
    shell: true,
  }
);

const packResult = JSON.parse(stdout);
const packedFiles = (packResult[0]?.files ?? [])
  .map((file) => file.path)
  .sort();
const packedFileSet = new Set(packedFiles);
const exportedFiles = Object.values(packageJson.exports)
  .flatMap((target) => {
    if (typeof target === "string") return [target];
    if (target && typeof target.import === "string") return [target.import];
    return [];
  })
  .map((target) => target.replace(/^\.\//, ""));
const missingExportTargets = exportedFiles.filter((target) => !packedFileSet.has(target));
const forbiddenPatterns = [
  /^index\.js$/,
  /^ui\.js$/,
  /^panelChrome\.js$/,
  /^utils\//,
  /^scripts\//,
  /^superceded\//,
  /^ios\.css$/,
  /^styles\/(?:colors|master|minimal|responsive)\.css$/,
];
const forbiddenFiles = packedFiles.filter((file) => forbiddenPatterns.some((pattern) => pattern.test(file)));

if (missingExportTargets.length > 0 || forbiddenFiles.length > 0) {
  if (missingExportTargets.length > 0) {
    console.error("Missing exported files from tarball:");
    for (const file of missingExportTargets) {
      console.error(`- ${file}`);
    }
  }

  if (forbiddenFiles.length > 0) {
    console.error("Unexpected internal files in tarball:");
    for (const file of forbiddenFiles) {
      console.error(`- ${file}`);
    }
  }

  process.exit(1);
}

console.log(`Validated package contents for ${packedFiles.length} files.`);
