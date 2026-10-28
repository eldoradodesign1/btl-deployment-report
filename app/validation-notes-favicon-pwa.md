# Validation favicon et PWA — 18 août 2026

- La favicon opaline est prête pour GitHub Pages dans le commit `61fd1b6`.
- Le workflow GitHub Pages associé au commit `61fd1b6` a abouti, et la favicon est accessible publiquement sous le sous-chemin de l’application.
- Le commit `9860db2` publie le manifest PWA et les icônes 192/512 ; le workflow Pages associé a abouti et le manifest public référence correctement les deux ressources.
- La variante système monochrome est disponible sous `client/public/favicon-monochrome.svg`.
- Les icônes PWA sont générées en PNG aux tailles 192 × 192 et 512 × 512.
- Le manifest est servi localement, référence les deux icônes et déclare l’affichage autonome.
- Le build de production contient la favicon, la variante monochrome, le manifest et les deux icônes PWA.
