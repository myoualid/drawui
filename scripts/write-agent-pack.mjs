import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const AGENT_JSON_NAME = "aeco-dev-gui.json";
export const AGENT_SKILL_NAME = "SKILL.md";

/**
 * Build the agent inventory from the public registry and copy the usage guide.
 * Both files ship in the published @aeco-dev/gui package.
 */
export async function writeAgentPack(outputDir) {
  const registry = JSON.parse(await readFile(path.join(root, "src/api/registry.json"), "utf8"));
  const gui = JSON.parse(await readFile(path.join(root, "packages/gui/package.json"), "utf8"));
  const layout = JSON.parse(await readFile(path.join(root, "packages/layout/package.json"), "utf8"));
  const skill = await readFile(path.join(root, "docs/ai/SKILL.md"), "utf8");

  const exportsByPackage = {};
  for (const symbol of registry.symbols) {
    for (const entry of symbol.entrypoints ?? []) {
      if (!exportsByPackage[entry]) exportsByPackage[entry] = [];
      exportsByPackage[entry].push(symbol.name);
    }
  }

  const document = {
    name: "aeco-dev GUI",
    description:
      "Full public API inventory for aeco-dev GUI. Read SKILL.md for usage rules. This file lists every registered symbol.",
    packages: {
      gui: {
        name: gui.name,
        version: gui.version,
        module: "./gui.js",
        style: "./gui.css",
        types: "./index.d.ts",
      },
      layout: {
        name: layout.name,
        version: layout.version,
        module: "./layout.js",
        style: "./layout.css",
        types: "./index.d.ts",
      },
    },
    install: "npm install @aeco-dev/gui @aeco-dev/layout",
    imports: {
      components: 'import { Button, StackPanel } from "@aeco-dev/gui";',
      layout: 'import { World, Layout, Panel } from "@aeco-dev/layout";',
      styles: ['import "@aeco-dev/gui/gui.css";', 'import "@aeco-dev/layout/layout.css";'],
    },
    exports: exportsByPackage,
    symbols: registry.symbols,
    factoryNotes: registry.factoryNotes ?? [],
    cssEntryPoints: registry.cssEntryPoints ?? [],
    skill: AGENT_SKILL_NAME,
  };

  const json = `${JSON.stringify(document, null, 2)}\n`;
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, AGENT_JSON_NAME), json, "utf8");
  await writeFile(path.join(outputDir, AGENT_SKILL_NAME), skill, "utf8");
  await mkdir(path.join(root, "docs/ai"), { recursive: true });
  await writeFile(path.join(root, "docs/ai", AGENT_JSON_NAME), json, "utf8");
  return { jsonName: AGENT_JSON_NAME, skillName: AGENT_SKILL_NAME };
}
