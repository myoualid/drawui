import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const VERSION_LABEL =
  /(<span class="term-version-label" data-layout-version=")[^"]*(">)[^<]*/;

/**
 * Write the layout package version into the docs heading.
 * The published gui and layout versions must match, including layout's dependency.
 */
export async function stampDocsVersion(root) {
  const guiPackage = JSON.parse(
    await readFile(path.join(root, "packages/gui/package.json"), "utf8"),
  );
  const layoutPackage = JSON.parse(
    await readFile(path.join(root, "packages/layout/package.json"), "utf8"),
  );
  const version = layoutPackage.version;
  const guiDependency = layoutPackage.dependencies?.["@aeco-dev/gui"];

  if (guiPackage.version !== version || guiDependency !== version) {
    throw new Error(
      `Published versions must match. @aeco-dev/gui is ${guiPackage.version}, @aeco-dev/layout is ${version}, and its @aeco-dev/gui dependency is ${guiDependency}.`,
    );
  }

  const indexPath = path.join(root, "docs/index.html");
  const html = await readFile(indexPath, "utf8");
  if (!VERSION_LABEL.test(html)) {
    throw new Error("docs/index.html is missing the version label.");
  }

  const stamped = html.replace(VERSION_LABEL, `$1${version}$2${version}`);
  if (stamped !== html) {
    await writeFile(indexPath, stamped, "utf8");
  }

  console.log(`Docs version: ${layoutPackage.name}@${version}`);
  return version;
}
