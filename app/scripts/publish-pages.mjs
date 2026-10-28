// Copie la version construite (dist/public) à la racine du dépôt, servie par GitHub Pages depuis main.
// La racine ne contient que le site publié : tout ce qui n'est pas dans KEEP est remplacé à chaque publication.
import fs from "node:fs";
import path from "node:path";

const app = path.resolve(import.meta.dirname, "..");
const root = path.resolve(app, "..");
const built = path.join(app, "dist", "public");
const KEEP = new Set([".git", ".gitignore", ".gitattributes", ".nojekyll", ".claude", "app", "README.md"]);

if (!fs.existsSync(path.join(built, "index.html"))) {
  console.error("Rien à publier : lancez d'abord la construction (dist/public/index.html introuvable).");
  process.exit(1);
}

let removed = 0;
for (const entry of fs.readdirSync(root)) {
  if (KEEP.has(entry)) continue;
  fs.rmSync(path.join(root, entry), { recursive: true, force: true });
  removed += 1;
}
fs.cpSync(built, root, { recursive: true });
fs.writeFileSync(path.join(root, ".nojekyll"), "");
console.log(`Publié à la racine : ${fs.readdirSync(built).length} entrées copiées, ${removed} anciennes retirées.`);
