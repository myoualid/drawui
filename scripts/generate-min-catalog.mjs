import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const examplesDir = path.join(root, "examples/components");
const manifestPath = path.join(examplesDir, "catalog.manifest.json");
const minEntryPath = path.join(root, "src/core.js");
const demosPath = path.join(examplesDir, "demos.js");
const demosFullPath = path.join(examplesDir, "demos.full.js");
const outputPath = path.join(examplesDir, "catalog.json");

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const minSource = await readFile(minEntryPath, "utf8");
const demosSource = await readFile(demosPath, "utf8");
const demosFullSource = await readFile(demosFullPath, "utf8");

const drawUiMethods = [...minSource.matchAll(/static\s+(\w+)\s*\(/g)].map((match) => match[1]);
const namedExports = [...minSource.matchAll(/^export\s+\{\s*([^}]+)\s*\}/gm)]
  .flatMap((match) =>
    match[1]
      .split(",")
      .map((part) => part.trim().split(/\s+as\s+/).pop().trim())
      .filter(Boolean),
  );

const demoIds = [...demosSource.matchAll(/^\s+["']([\w-]+)["']\s*:\s*\(/gm)].map((match) => match[1]);
const fullDemoIds = [...demosFullSource.matchAll(/^\s+["']([\w-]+)["']\s*:\s*\(/gm)].map((match) => match[1]);

function collectFromEntries(entries = []) {
  const ids = [];
  entries.forEach((entry) => {
    if (entry.demo) ids.push(entry.demo);
    if (entry.variants) {
      entry.variants.forEach((variant) => {
        if (variant.demo) ids.push(variant.demo);
      });
    }
  });
  return ids;
}

function collectDemoIds(item) {
  const ids = [];
  if (item.demo) ids.push(item.demo);
  if (item.overviewDemo) ids.push(item.overviewDemo);
  ids.push(...collectFromEntries(item.siblings));
  ids.push(...collectFromEntries(item.alternatives));
  ids.push(...collectFromEntries(item.parts));
  ids.push(...collectFromEntries(item.variants));
  return ids;
}

const manifestDemoIds = manifest.categories.flatMap((category) =>
  category.items.flatMap((item) => collectDemoIds(item)),
);

const peerCategories = manifest.peerCategories?.length
  ? manifest.peerCategories
  : manifest.peerCategory
    ? [manifest.peerCategory]
    : [];

const peerDemoIds = peerCategories.flatMap((category) =>
  (category.items ?? []).flatMap((item) => collectDemoIds(item)),
);

const missingDemos = manifestDemoIds.filter(
  (id) => !demoIds.includes(id) && !fullDemoIds.includes(id),
);
if (missingDemos.length) {
  console.error("Manifest references demos that are not defined in demos.js or demos.full.js:");
  missingDemos.forEach((id) => console.error(`  - ${id}`));
  process.exit(1);
}

const fullOnlyCategoryDemos = manifestDemoIds.filter(
  (id) => !demoIds.includes(id) && fullDemoIds.includes(id),
);
if (fullOnlyCategoryDemos.length) {
  console.warn("Category items reference full-build-only demos (ok for full.html gallery):");
  fullOnlyCategoryDemos.forEach((id) => console.warn(`  - ${id}`));
}

const missingFullDemos = peerDemoIds.filter((id) => !fullDemoIds.includes(id) && !demoIds.includes(id));
if (missingFullDemos.length) {
  console.error("Peer category references demos that are not defined in demos.full.js (or demos.js):");
  missingFullDemos.forEach((id) => console.error(`  - ${id}`));
  process.exit(1);
}

const unusedDemos = demoIds.filter((id) => !manifestDemoIds.includes(id));
if (unusedDemos.length) {
  console.warn("demos.js defines demos not referenced in catalog.manifest.json:");
  unusedDemos.forEach((id) => console.warn(`  - ${id}`));
}

const unusedFullDemos = fullDemoIds.filter(
  (id) => !peerDemoIds.includes(id) && !manifestDemoIds.includes(id),
);
if (unusedFullDemos.length) {
  console.warn("demos.full.js defines demos not referenced by peerCategories:");
  unusedFullDemos.forEach((id) => console.warn(`  - ${id}`));
}

const peerItems = peerCategories.reduce((total, category) => total + (category.items?.length ?? 0), 0);

const catalog = {
  generatedAt: new Date().toISOString(),
  build: "shared",
  title: manifest.title,
  subtitle: manifest.subtitle,
  stats: {
    categories: manifest.categories.length,
    items: manifest.categories.reduce((total, category) => total + category.items.length, 0),
    peerCategories: peerCategories.length,
    peerItems,
    drawUiFactories: drawUiMethods.length,
    namedExports: namedExports.length,
  },
  apiIndex: {
    drawUi: drawUiMethods.map((name) => `DrawUI.${name}()`),
    exports: namedExports,
  },
  categories: manifest.categories,
  peerCategories,
  // Legacy single-bucket alias for older consumers.
  peerCategory: peerCategories.find((category) => category.id === "spreadsheet") ?? peerCategories[0] ?? null,
  fullBuildOnly: manifest.fullBuildOnly,
};

await writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

console.log(`Wrote ${path.relative(root, outputPath)}`);
console.log(
  `  ${catalog.stats.items} demo items across ${catalog.stats.categories} categories`,
);
console.log(`  ${peerItems} peer-only items`);
console.log(
  `  ${catalog.stats.drawUiFactories} DrawUI factories, ${catalog.stats.namedExports} named exports`,
);
