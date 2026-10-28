# Validation — correction des commentaires de période et de l’export

Date de contrôle : 18 août 2026.

Une période personnalisée a été sélectionnée par le raccourci de plage. L’interface BTL affiche de nouveau le bloc « COMMENTAIRE DE PÉRIODE · LOCAL », l’explication que la sélection ne correspond pas à une semaine précise, ainsi que le bouton « Générer par IA ».

La semaine 2 du 27 juillet au 1er août 2026 a ensuite été sélectionnée. Son commentaire hebdomadaire Supabase reste affiché sous le filtre, est transmis à l’aperçu dans la tuile « Progression campagne », puis est inclus dans le PDF et la Synthèse XLSX. Le classeur téléchargé contient la chaîne « COMMENTAIRE HEBDOMADAIRE » dans `xl/worksheets/sheet1.xml`.

Le PDF hebdomadaire d’une page affiche le commentaire sous le graphique de progression. Le donut est plus grand et plus épais, avec une légende horizontale placée sous l’anneau. Le typecheck et le build de production ont réussi.
