// Déclinaisons claires de l'image signature (hero) pour les ambiances Starfly et Aube.
// Négatif de l'original, teinte ramenée dans sa famille, puis voile coloré propre à chaque ambiance :
// la nuit devient un ciel pâle, l'anneau de verre et la trajectoire restent lisibles.
import path from "node:path";
import sharp from "sharp";

const assets = path.resolve(import.meta.dirname, "..", "client", "public", "assets");
const source = path.join(assets, "vodacom-opaline-hero.png");
const { width, height } = await sharp(source).metadata();

const variants = [
  { file: "hero-starfly.png", tint: { r: 214, g: 230, b: 255 }, hue: 180, saturation: 1.15, brightness: 1.04, tintAlpha: 0.32 },
  { file: "hero-aube.png", tint: { r: 255, g: 200, b: 170 }, hue: 150, saturation: 1.25, brightness: 1.03, tintAlpha: 0.42 },
];

for (const v of variants) {
  const negative = await sharp(source).removeAlpha().negate().modulate({ hue: v.hue, saturation: v.saturation, brightness: v.brightness }).toBuffer();
  const veil = { create: { width, height, channels: 4, background: { ...v.tint, alpha: v.tintAlpha } } };
  await sharp(negative).composite([{ input: await sharp(veil).png().toBuffer(), blend: "soft-light" }, { input: await sharp(veil).png().toBuffer(), blend: "over" }]).png({ compressionLevel: 9, palette: true, quality: 92 }).toFile(path.join(assets, v.file));
  console.log(v.file);
}
