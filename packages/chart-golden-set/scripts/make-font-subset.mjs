#!/usr/bin/env node
/**
 * One-time font asset builder (maintenance tool, NOT part of generate).
 *
 * Usage:
 *   node packages/chart-golden-set/scripts/make-font-subset.mjs \
 *     --source /path/to/NotoSansSC-Regular.otf
 *
 * Reads every Chinese character used by src/locale-text.ts, subsets the full
 * Noto Sans SC font down to those characters plus printable ASCII, and writes
 * assets/fonts/NotoSansSC-Subset.ttf. Adding new zh copy to locale-text.ts
 * REQUIRES re-running this script, otherwise resvg renders tofu boxes.
 *
 * Requires node >= 22.18 (type stripping) for the locale-text.ts import.
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";
import { collectChineseCharacters } from "../src/locale-text.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const outputPath = join(scriptDir, "..", "assets", "fonts", "NotoSansSC-Subset.ttf");

const sourceFlagIndex = process.argv.indexOf("--source");
if (sourceFlagIndex === -1 || !process.argv[sourceFlagIndex + 1]) {
  console.error("usage: make-font-subset.mjs --source <full NotoSansSC otf/ttf>");
  process.exit(40);
}
const sourcePath = resolve(process.argv[sourceFlagIndex + 1]);

const asciiPrintable = Array.from({ length: 0x7e - 0x20 + 1 }, (_, i) =>
  String.fromCharCode(0x20 + i)
).join("");
const middleDot = "·";
const chineseCharacters = collectChineseCharacters().join("");
const subsetText = `${asciiPrintable}${middleDot}${chineseCharacters}`;

const source = await readFile(sourcePath);
const subset = await subsetFont(source, subsetText, { targetFormat: "truetype" });
await writeFile(outputPath, subset);
console.log(
  JSON.stringify(
    {
      status: "completed",
      output: outputPath,
      characters: subsetText.length,
      chinese_characters: chineseCharacters.length,
      bytes: subset.length
    },
    null,
    2
  )
);
