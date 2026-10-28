# Validation — guide d’installation mobile

Date : 18 août 2026

- La compilation TypeScript et le build de production sont passés après l’ajout de `InstallAppGuide`.
- Le guide écoute `beforeinstallprompt` pour proposer l’invite native sur les navigateurs compatibles.
- Le parcours iOS présente les étapes Safari « Partager » puis « Sur l’écran d’accueil ».
- La capture mobile 390 × 844 confirme que le bouton discret « Installer l’app » apparaît au-dessus de la barre de navigation, sans modifier la fenêtre de connexion.
- Le guide ne s’affiche pas dans une session déjà installée (`display-mode: standalone` / `navigator.standalone`).
