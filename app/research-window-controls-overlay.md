# Note technique — Window Controls Overlay

La capture utilisateur du 18 août 2026 confirme que la barre visible appartient à la fenêtre Chrome installée, et non au contenu de l’application.

Selon MDN, Window Controls Overlay permet à une PWA desktop installée de masquer le titre par défaut et d’étendre le contenu web dans cette zone, mais les commandes système maximiser, réduire et fermer restent un overlay géré par l’agent utilisateur.

La documentation web.dev précise également que le mode requiert une PWA installée, un système desktop et `display_override: ["window-controls-overlay"]`; il conserve les contrôles de fenêtre et les boutons PWA gérés par le navigateur.

Pour une fenêtre totalement frameless avec seulement des contrôles dessinés par l’application, un wrapper desktop natif comme Tauri ou Electron est nécessaire.

## Sources

- MDN, Window Controls Overlay API : https://developer.mozilla.org/en-US/docs/Web/API/Window_Controls_Overlay_API
- web.dev, Customize the window controls overlay of your PWA's title bar : https://web.dev/articles/window-controls-overlay
