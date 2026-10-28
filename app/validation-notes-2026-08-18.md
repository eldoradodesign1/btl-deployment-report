# Validation — commentaires IA de périodes personnalisées

Date de contrôle : 18 août 2026.

La fonction Edge `generate-supervisor-comment` a été déployée avec le mode `custom` et l’action `generate_local`. Ce mode consulte les rapports terrain pour alimenter Gemini, puis renvoie uniquement le commentaire au client : aucune écriture n’est réalisée dans les tables de commentaires Supabase.

Un commentaire a été généré pour la période personnalisée du 23 juillet au 10 août 2026, puis confirmé dans le navigateur. Il est stocké sous la clé locale `btl-local-custom-period-comments:v1` et est réaffiché après rechargement.

L’aperçu HTML, le classeur XLSX et le PDF incluent le bloc « COMMENTAIRE DE PÉRIODE · LOCAL ». Le classeur téléchargé contient le texte dans sa feuille Synthèse ; le PDF d’une page montre le bloc dans sa partie haute. Le build TypeScript/Vite et la console navigateur ont été contrôlés sans erreur.
