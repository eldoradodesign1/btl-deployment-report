// Génère les icônes d'installation (PNG) à partir de client/public/favicon.svg.
// Fond plein jusqu'aux bords : le système applique lui-même son masque (icônes « maskable »).
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const pub = path.resolve(import.meta.dirname, "..", "client", "public");
const svg = fs.readFileSync(path.join(pub, "favicon.svg"), "utf8").replace('rx="15"', 'rx="0"');
for (const size of [192, 512]) {
  await sharp(Buffer.from(svg), { density: (72 * size) / 64 }).resize(size, size).png({ compressionLevel: 9 }).toFile(path.join(pub, `pwa-${size}.png`));
  console.log(`pwa-${size}.png`);
}
