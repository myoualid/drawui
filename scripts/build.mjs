import * as esbuild from "esbuild";
import { watch } from "node:fs";
import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { stampDocsVersion } from "./stamp-docs-version.mjs";
import { AGENT_JSON_NAME, AGENT_SKILL_NAME, writeAgentPack } from "./write-agent-pack.mjs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const distDir = path.join(rootDir, "dist");
const docsDistDir = path.join(rootDir, "docs/dist");
const scriptsDir = path.join(rootDir, "scripts");
const packageJson = JSON.parse(
  await readFile(path.join(rootDir, "package.json"), "utf8"),
);
const guiJsName = "gui.js";
const guiCssName = "gui.css";
const layoutJsName = "layout.js";
const layoutCssName = "layout.css";
const docsCssName = "docs.css";

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
  sourcemap: false,
  logLevel: "info",
};

const libraryArtifacts = [
  guiJsName,
  guiCssName,
  layoutJsName,
  layoutCssName,
  "importmap.full.json",
  AGENT_SKILL_NAME,
  AGENT_JSON_NAME,
];

async function buildJavaScript() {
  await esbuild.build({
    ...buildOptions,
    entryPoints: [path.join(rootDir, "src/gui/index.js")],
    outfile: path.join(distDir, guiJsName),
    external: peerExternals,
  });

  await esbuild.build({
    ...buildOptions,
    entryPoints: [path.join(rootDir, "src/layout/index.js")],
    outfile: path.join(distDir, layoutJsName),
  });

}

async function buildStylesheet(entry, outfile) {
  await esbuild.build({
    bundle: true,
    minify: true,
    logLevel: "info",
    entryPoints: [entry],
    outfile,
  });
}

async function buildLibraryStylesheets() {
  await buildStylesheet(
    path.join(scriptsDir, "entries/browser-gui.css"),
    path.join(distDir, guiCssName),
  );
  await buildStylesheet(
    path.join(rootDir, "styles/layout.css"),
    path.join(distDir, layoutCssName),
  );
}

async function buildDocsStylesheet() {
  await buildStylesheet(
    path.join(scriptsDir, "entries/docs.css"),
    path.join(docsDistDir, docsCssName),
  );
}

function peerVersion(name) {
  return (
    packageJson.dependencies?.[name] ??
    packageJson.peerDependencies?.[name] ??
    packageJson.devDependencies?.[name]
  );
}

async function writeFullImportMap() {
  const versions = Object.fromEntries(
    peerPackages.map((name) => [name, peerVersion(name)]),
  );

  const importMap = {
    imports: {
      "@aeco-dev/gui": `./${guiJsName}`,
      "@aeco-dev/layout": `./${layoutJsName}`,
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
  const guiJs = await readFile(path.join(distDir, guiJsName), "utf8");
  const layoutJs = await readFile(path.join(distDir, layoutJsName), "utf8");
  const guiCss = await readFile(path.join(distDir, guiCssName), "utf8");
  const layoutCss = await readFile(path.join(distDir, layoutCssName), "utf8");
  const peerPattern = /chart\.js|ag-grid|jsgantt|showdown|highlightjs/i;
  const layoutJsMarker = "leftWorkspaceWidth";
  const layoutCssMarker = ".WorkspaceStack";
  const peerCssMarkers = [
    ".hud-label",
    ".ws-node-view-root",
    ".sequence-task-view-host",
    "--ag-background-color",
  ];

  if (guiCss.includes(layoutCssMarker)) {
    throw new Error(`dist/${guiCssName} unexpectedly includes workspace layout CSS.`);
  }

  if (!layoutCss.includes(layoutCssMarker)) {
    throw new Error(`dist/${layoutCssName} is missing workspace layout CSS.`);
  }

  if (layoutCss.includes(".AppShell") || layoutCss.includes(".Markdown")) {
    throw new Error(`dist/${layoutCssName} must stay layout-only.`);
  }

  for (const marker of peerCssMarkers) {
    if (layoutCss.includes(marker)) {
      throw new Error(`Layout CSS unexpectedly includes peer CSS: ${marker}`);
    }
    if (!guiCss.includes(marker)) {
      throw new Error(`dist/${guiCssName} is missing peer CSS: ${marker}`);
    }
  }

  for (const marker of [".Markdown", ".AppShell", ".RadialMenuOverlay"]) {
    if (!guiCss.includes(marker)) {
      throw new Error(`dist/${guiCssName} is missing core CSS: ${marker}`);
    }
  }

  if (guiJs.includes(layoutJsMarker)) {
    throw new Error("The GUI bundle must not include the layout engine.");
  }

  if (!layoutJs.includes(layoutJsMarker)) {
    throw new Error(`dist/${layoutJsName} is missing the layout engine.`);
  }

  if (!guiJs.includes("export{Button") && !guiJs.includes("Button") ) {
    throw new Error(`dist/${guiJsName} is missing the Button export.`);
  }

  if (peerPattern.test(layoutJs)) {
    throw new Error("The layout bundle must not reference peer dependencies.");
  }

  const requiredPeerImports = [
    "chart.js/auto",
    "ag-grid-community",
    "jsgantt-improved",
    "showdown",
    "@highlightjs/cdn-assets/es/highlight.min.js",
  ];

  for (const specifier of requiredPeerImports) {
    if (!guiJs.includes(specifier)) {
      throw new Error(`dist/${guiJsName} is missing external import: ${specifier}`);
    }
  }

  for (const file of libraryArtifacts) {
    await readFile(path.join(distDir, file), "utf8");
  }

  try {
    await access(path.join(distDir, docsCssName));
    throw new Error(`dist/${docsCssName} is docs-site CSS and must not ship in the library distribution.`);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }

  const docsCss = await readFile(path.join(docsDistDir, docsCssName), "utf8");
  for (const marker of [".Markdown", ".AppShell", layoutCssMarker, ...peerCssMarkers]) {
    if (!docsCss.includes(marker)) {
      throw new Error(`docs/dist/${docsCssName} is missing combined docs CSS: ${marker}`);
    }
  }
}

async function resolveLocalVendorDir() {
  const vendorOverride =
    process.env.AECO_DEV_GUI_LOCAL_VENDOR ||
    process.env.IFCOPENSHELL_GUI_LOCAL_VENDOR ||
    process.env.DRAWUI_LOCAL_VENDOR;
  if (vendorOverride) {
    return path.resolve(vendorOverride);
  }

  const localVendorPath = path.join(scriptsDir, "local-vendor.mjs");
  try {
    await access(localVendorPath);
  } catch {
    return null;
  }

  const local = await import(pathToFileURL(localVendorPath).href);
  return local.default ? path.resolve(local.default) : null;
}

async function syncLocalVendor() {
  const vendorDir = await resolveLocalVendorDir();
  if (!vendorDir) {
    return;
  }

  await mkdir(vendorDir, { recursive: true });

  for (const file of libraryArtifacts) {
    await cp(path.join(distDir, file), path.join(vendorDir, file));
  }

  await cp(
    path.join(rootDir, "types/index.d.ts"),
    path.join(vendorDir, "index.d.ts"),
  );
  await rm(path.join(vendorDir, docsCssName), { force: true });

  console.log(`Synced local vendor: ${vendorDir}`);
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

const watchMode = process.argv.includes("--watch");

async function buildAll({ clean }) {
  if (clean) {
    await rm(distDir, { recursive: true, force: true });
    await rm(docsDistDir, { recursive: true, force: true });
  }

  await mkdir(distDir, { recursive: true });
  await mkdir(docsDistDir, { recursive: true });

  await buildJavaScript();
  await buildLibraryStylesheets();
  await buildDocsStylesheet();
  await writeFullImportMap();
  await writeAgentPack(distDir);
  await verifyDist();
  await syncDocsAssets();

  for (const file of libraryArtifacts) {
    await cp(path.join(distDir, file), path.join(docsDistDir, file));
  }

  await syncLocalVendor();
  await stagePackages();
  await stampDocsVersion(rootDir);

  console.log("Built library dist/:");
  for (const file of libraryArtifacts) {
    console.log(`- ${file}`);
  }
  console.log("Built docs site docs/dist/:");
  console.log(`- ${docsCssName}`);
  for (const file of libraryArtifacts) {
    console.log(`- ${file} (copy for GitHub Pages)`);
  }
  console.log("Synced docs/styles/ for GitHub Pages.");
}

await buildAll({ clean: !watchMode });

if (watchMode) {
  console.log("Watching src/, styles/, and scripts/entries/. Ctrl+C to stop.");
  let timer = null;
  let running = false;
  let queued = false;

  const rebuild = async () => {
    if (running) {
      queued = true;
      return;
    }

    running = true;
    try {
      await buildAll({ clean: false });
    } catch (error) {
      console.error(error);
    } finally {
      running = false;
      if (queued) {
        queued = false;
        await rebuild();
      }
    }
  };

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      void rebuild();
    }, 150);
  };

  for (const dir of ["src", "styles", path.join("scripts", "entries")]) {
    watch(path.join(rootDir, dir), { recursive: true }, schedule);
  }

  await new Promise(() => {});
}

async function stagePackages() {
  const types = await readFile(path.join(rootDir, "types/index.d.ts"), "utf8");
  const layoutMarker = 'declare module "@aeco-dev/layout"';
  const splitAt = types.indexOf(layoutMarker);
  if (splitAt < 0) {
    throw new Error("types/index.d.ts is missing the @aeco-dev/layout module.");
  }

  const guiDir = path.join(rootDir, "packages/gui");
  const layoutPackageDir = path.join(rootDir, "packages/layout");
  const guiTypes = `${types.slice(0, splitAt).trim()}\n`;
  const layoutTypes = `${types.slice(splitAt).trim()}\n`;
  const license = path.join(rootDir, "LICENSE");

  await cp(path.join(distDir, guiJsName), path.join(guiDir, guiJsName));
  await cp(path.join(distDir, guiCssName), path.join(guiDir, guiCssName));
  const fullMap = JSON.parse(await readFile(path.join(distDir, "importmap.full.json"), "utf8"));
  delete fullMap.imports["@aeco-dev/layout"];
  await writeFile(
    path.join(guiDir, "importmap.full.json"),
    `${JSON.stringify(fullMap, null, 2)}\n`,
  );
  await writeFile(path.join(guiDir, "index.d.ts"), guiTypes);
  await cp(license, path.join(guiDir, "LICENSE"));
  await cp(path.join(distDir, AGENT_SKILL_NAME), path.join(guiDir, AGENT_SKILL_NAME));
  await cp(path.join(distDir, AGENT_JSON_NAME), path.join(guiDir, AGENT_JSON_NAME));

  await cp(path.join(distDir, layoutJsName), path.join(layoutPackageDir, layoutJsName));
  await cp(path.join(distDir, layoutCssName), path.join(layoutPackageDir, layoutCssName));
  await writeFile(path.join(layoutPackageDir, "index.d.ts"), layoutTypes);
  await cp(license, path.join(layoutPackageDir, "LICENSE"));

  console.log("Staged npm packages:");
  console.log("- packages/gui");
  console.log("- packages/layout");
}
