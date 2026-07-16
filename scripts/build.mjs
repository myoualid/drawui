import * as esbuild from "esbuild";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const distDir = path.join(rootDir, "docs/dist");
const scriptsDir = path.join(rootDir, "scripts");
const packageJson = JSON.parse(
  await readFile(path.join(rootDir, "package.json"), "utf8"),
);

const peerPackages = [
  "chart.js",
  "ag-grid-community",
  "jsgantt-improved",
  "showdown",
  "@highlightjs/cdn-assets",
];

const peerExternals = [
  "chart.js/auto",
  "chart.js/*",
  "ag-grid-community",
  "jsgantt-improved",
  "showdown",
  "@highlightjs/cdn-assets/es/highlight.min.js",
  "@highlightjs/cdn-assets/*",
];

const buildOptions = {
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2020",
  minify: true,
  sourcemap: true,
  logLevel: "info",
};

async function buildJavaScript() {
  await esbuild.build({
    ...buildOptions,
    entryPoints: [path.join(rootDir, "src/core.js")],
    outfile: path.join(distDir, "drawui.min.js"),
  });

  await esbuild.build({
    ...buildOptions,
    entryPoints: [path.join(rootDir, "src/index.js")],
    outfile: path.join(distDir, "drawui.full.js"),
    external: peerExternals,
  });

  await esbuild.build({
    ...buildOptions,
    entryPoints: [path.join(rootDir, "src/overlays/index.js")],
    outfile: path.join(distDir, "drawui.overlays.js"),
  });
}

async function buildStylesheets() {
  await esbuild.build({
    bundle: true,
    minify: true,
    logLevel: "info",
    entryPoints: [path.join(scriptsDir, "entries/drawui.min.css")],
    outfile: path.join(distDir, "drawui.min.css"),
  });

  await esbuild.build({
    bundle: true,
    minify: true,
    logLevel: "info",
    entryPoints: [path.join(scriptsDir, "entries/drawui.full.css")],
    outfile: path.join(distDir, "drawui.full.css"),
  });
}

function peerVersion(name) {
  return packageJson.dependencies?.[name] ?? packageJson.peerDependencies?.[name];
}

async function writeFullImportMap() {
  const versions = Object.fromEntries(
    peerPackages.map((name) => [name, peerVersion(name)]),
  );

  const importMap = {
    imports: {
      "drawui/full": "./drawui.full.js",
      "drawui/overlays": "./drawui.overlays.js",
      "chart.js/auto": `https://cdn.jsdelivr.net/npm/chart.js@${versions["chart.js"]}/auto/+esm`,
      "ag-grid-community": `https://cdn.jsdelivr.net/npm/ag-grid-community@${versions["ag-grid-community"]}/dist/package/main.esm.mjs`,
      "jsgantt-improved": `https://cdn.jsdelivr.net/npm/jsgantt-improved@${versions["jsgantt-improved"]}/+esm`,
      showdown: `https://cdn.jsdelivr.net/npm/showdown@${versions.showdown}/+esm`,
      "@highlightjs/cdn-assets/es/highlight.min.js": `https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@${versions["@highlightjs/cdn-assets"]}/es/highlight.min.js`,
    },
  };

  await writeFile(
    path.join(distDir, "importmap.full.json"),
    `${JSON.stringify(importMap, null, 2)}\n`,
    "utf8",
  );
}

async function verifyDist() {
  const minJs = await readFile(path.join(distDir, "drawui.min.js"), "utf8");
  const fullJs = await readFile(path.join(distDir, "drawui.full.js"), "utf8");
  const peerPattern = /chart\.js|ag-grid|jsgantt|showdown|highlightjs/i;

  if (peerPattern.test(minJs)) {
    throw new Error("dist/drawui.min.js must not reference peer dependencies.");
  }

  const requiredFullImports = [
    "chart.js/auto",
    "ag-grid-community",
    "jsgantt-improved",
    "showdown",
    "@highlightjs/cdn-assets/es/highlight.min.js",
  ];

  for (const specifier of requiredFullImports) {
    if (!fullJs.includes(specifier)) {
      throw new Error(
        `dist/drawui.full.js is missing external import: ${specifier}`,
      );
    }
  }

  for (const file of [
    "drawui.min.js",
    "drawui.full.js",
    "drawui.overlays.js",
    "drawui.min.css",
    "drawui.full.css",
    "importmap.full.json",
  ]) {
    await readFile(path.join(distDir, file), "utf8");
  }
}

async function syncDocsAssets() {
  const docsDir = path.join(rootDir, "docs");
  const docsStylesDir = path.join(docsDir, "styles");

  await mkdir(path.join(docsStylesDir, "themes"), { recursive: true });
  await mkdir(path.join(docsStylesDir, "components"), { recursive: true });

  for (const file of ["dark.css", "light.css"]) {
    await cp(
      path.join(rootDir, "styles/themes", file),
      path.join(docsStylesDir, "themes", file),
    );
  }

  for (const file of ["nodes.css", "hud.css", "pie-menu.css"]) {
    await cp(
      path.join(rootDir, "styles/components", file),
      path.join(docsStylesDir, "components", file),
    );
  }
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

await buildJavaScript();
await buildStylesheets();
await writeFullImportMap();
await verifyDist();
await syncDocsAssets();

console.log("Built docs/dist/:");
console.log("- drawui.min.js / drawui.min.css");
console.log("- drawui.full.js / drawui.full.css");
console.log("- drawui.overlays.js");
console.log("- importmap.full.json");
console.log("Synced docs/styles/ for GitHub Pages.");
