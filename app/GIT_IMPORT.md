# BTL - Deployment report — import Git

Cette archive contient le projet source du prototype web **BTL - Deployment report**.

## Prérequis

- Node.js 20 ou plus récent
- pnpm 10 ou npm récent

## Installation locale

```bash
pnpm install
pnpm dev
```

Le serveur de développement est ensuite disponible sur l’URL affichée par Vite.

## Vérifications

```bash
pnpm check
pnpm build
```

## Import dans Git

Après décompression, placez-vous à la racine du projet puis exécutez :

```bash
git init
git add .
git commit -m "Initial import of BTL Deployment report"
git branch -M main
git remote add origin <URL_DU_DEPOT>
git push -u origin main
```

Le ZIP exclut les dépendances installées, le dossier `dist`, les logs de développement et les caches. Lancez `pnpm install` après l’import Git pour reconstruire `node_modules`.
