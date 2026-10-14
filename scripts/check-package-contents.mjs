import { exec } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execAsync = promisify(exec);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const forbiddenPatterns = [
  /^index\.js$/,
  /^ui\.js$/,
  /^panelChrome\.js$/,
  /^utils\//,
  /^scripts\//,
  /^superceded\//,
  /^ios\.css$/,
  /^styles\//,
  /^src\//,
  /^dist\/[^/]+\.docs\.css$/,
];

for (const name of ["gui", "layout"]) {
  const packageDir = path.join(root, "packages", name);
  const packageJson = JSON.parse(await readFile(path.join(packageDir, "package.json"), "utf8"));
  const { stdout } = await execAsync("npm pack --json --dry-run", {
    cwd: packageDir,
    windowsHide: true,
    shell: true,
  });

  const packResult = JSON.parse(stdout);
  const packedFiles = (packResult[0]?.files ?? []).map((file) => file.path).sort();
  const packedFileSet = new Set(packedFiles);
  const exportedFiles = Object.values(packageJson.exports)
    .flatMap((target) => {
      if (typeof target === "string") return [target];
      if (target && typeof target.import === "string") return [target.import];
      return [];
    })
    .map((target) => target.replace(/^\.\//, ""));
  const missingExportTargets = exportedFiles.filter((target) => !packedFileSet.has(target));
  const forbiddenFiles = packedFiles.filter((file) =>
    forbiddenPatterns.some((pattern) => pattern.test(file)),
  );

  if (missingExportTargets.length > 0 || forbiddenFiles.length > 0) {
    if (missingExportTargets.length > 0) {
      console.error(`Missing exported files from ${packageJson.name}:`);
      for (const file of missingExportTargets) console.error(`- ${file}`);
    }
    if (forbiddenFiles.length > 0) {
      console.error(`Unexpected internal files in ${packageJson.name}:`);
      for (const file of forbiddenFiles) console.error(`- ${file}`);
    }
    process.exit(1);
  }

  console.log(`Validated ${packageJson.name} (${packedFiles.length} files).`);
}
