# BTL – Deployment report

Tableau de bord des campagnes terrain BTL (Vodacom Privilège, Merchant), publié sur
https://eldoradodesign1.github.io/btl-deployment-report/.

## Organisation du dépôt

- `app/` : le code source (React + Vite, issu de l'export Manus).
- La racine : la version construite, servie telle quelle par GitHub Pages depuis `main`.
  Elle est entièrement régénérée à chaque publication ; on n'y modifie rien à la main.

## Travailler sur l'appli

```bash
cd app
corepack pnpm install
corepack pnpm dev            # http://localhost:3000/btl-deployment-report/
corepack pnpm check          # vérification des types
corepack pnpm publish:pages  # construit puis copie le résultat à la racine
```

Après `publish:pages`, committer `app/` et la racine ensemble.
