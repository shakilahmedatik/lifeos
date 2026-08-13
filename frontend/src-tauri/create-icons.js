import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const iconsDir = join(__dirname, "icons");

mkdirSync(iconsDir, { recursive: true });

// Valid 1x1 RGBA PNG buffer
const pngBuffer = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

writeFileSync(join(iconsDir, "32x32.png"), pngBuffer);
writeFileSync(join(iconsDir, "128x128.png"), pngBuffer);
writeFileSync(join(iconsDir, "128x128@2x.png"), pngBuffer);
writeFileSync(join(iconsDir, "icon.icns"), pngBuffer);
writeFileSync(join(iconsDir, "icon.ico"), pngBuffer);

console.log("Icons created successfully!");
