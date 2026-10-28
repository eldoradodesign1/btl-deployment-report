// Génère les icônes à partir de client/public/favicon.svg (logo Orbite) :
// - orbit-icon.svg, orbit-32.png, orbit-180.png : favicons, sous un nom neuf pour échapper au cache des navigateurs ;
// - pwa-192.png, pwa-512.png : icônes d'installation, fond plein jusqu'aux bords (le système applique son masque).
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const pub = path.resolve(import.meta.dirname, "..", "client", "public");
const svg = fs.readFileSync(path.join(pub, "favicon.svg"), "utf8");
fs.writeFileSync(path.join(pub, "orbit-icon.svg"), svg);
const render = (source, size, file) => sharp(Buffer.from(source), { density: (72 * size) / 64 }).resize(size, size).png({ compressionLevel: 9 }).toFile(path.join(pub, file));
await render(svg, 32, "orbit-32.png");
await render(svg, 180, "orbit-180.png");
const fullBleed = svg.replace('rx="15"', 'rx="0"');
for (const size of [192, 512]) await render(fullBleed, size, `pwa-${size}.png`);
console.log("orbit-icon.svg, orbit-32.png, orbit-180.png, pwa-192.png, pwa-512.png");
