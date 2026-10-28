# Fonctionnalités à implémenter

- [x] Ajouter un écran de connexion local avec état connecté/déconnecté et compte de démonstration clairement identifié.
- [x] Remplacer le module Activité par un tableau quotidien avec compteurs d’actions, agents actifs, shops couverts, meilleur jour et jour le plus faible.
- [x] Remplacer le module Activations par une table filtrable, recherchable, triable et paginée avec détail d’une ligne.
- [x] Remplacer le module Analyse croisée par des sélecteurs de dimensions et une matrice de résultats recalculée.
- [x] Remplacer le module Qualité des données par des indicateurs calculés sur les données réelles, les anomalies et les doublons.
- [x] Ajouter un module Import avec dépôt de fichier, lecture CSV/XLSX/XLS côté navigateur, aperçu, validation et remplacement du jeu de données local.
- [x] Ajouter un module Paramètres avec objectif quotidien, export automatique, thème et persistance locale.
- [x] Ajouter un bouton de déconnexion, un menu utilisateur et la persistance de la session dans le navigateur.
- [x] Vérifier les interactions, les états vides, les erreurs d’import et les responsive breakpoints.

## Révision avatars, droits et contrôles

- [x] Remplacer l’authentification actuelle par deux avatars explicites : Vodacom et BTL.
- [x] Donner à Vodacom un compte de lecture avec accès aux jours prestés mais sans détails de performance terrain des hôtesses.
- [x] Donner à BTL un accès complet avec mot de passe fixe `BTL2026`.
- [x] Ajouter les fonctions d’édition BTL pour les noms d’hôtesses, les shops et les cellules éditables du tableau.
- [x] Ajouter une courbe de progression des activations sur toute la campagne avec surbrillance de la zone filtrée.
- [x] Ajouter des mini-courbes de progression dans les lignes Agents et Shops.
- [x] Supprimer le doublon Paramètres et rendre l’entrée restante fonctionnelle.
- [x] Remplacer les scrollbars, flèches number, calendriers date et autres contrôles natifs par des customs cohérents.
- [x] Vérifier les permissions, la visibilité des détails, les éditions BTL et le rendu des contrôles custom.

## Révision BTL - Deployment report

- [x] Renommer l’application en `BTL - Deployment report` dans les métadonnées et l’interface.
- [x] Réduire la fenêtre de login à la marque et à « Choisissez votre avatar » sans description d’avatar, mot de passe affiché ni texte de performance.
- [x] Réafficher chez Vodacom les menus Agents, Shops, Activations, Analyse croisée et Import & sources.
- [x] Faire fonctionner Agents, Shops, Activations et Analyse croisée chez Vodacom en lecture seule.
- [x] Faire fonctionner Import & sources chez Vodacom en lecture avec mise à jour de la source possible.
- [x] Élargir les courbes Agents et Shops sur tout l’espace disponible dans les deux rôles.
- [x] Retirer les champs texte de renommage des Agents et Shops chez Vodacom tout en les conservant chez BTL.
- [x] Donner une fonction concrète à la cloche de notifications avec un centre consultable.
- [x] Vérifier le login minimal, les menus réouverts, l’import Vodacom et le centre de notifications.

## Correction ciblée après retour arrière

- [x] Revenir au checkpoint `049d4f12`, état précédent la séparation des dashboards.
- [x] Restaurer le hero précédent avec son image de fond sans modifier les autres écrans.
- [x] Ajouter chez Vodacom les sections « Ce qui bouge maintenant », « Le mouvement sur toute la campagne » et les autres sections BTL demandées.
- [x] Vérifier que BTL, les menus, les contrôles et les autres modules sont inchangés par rapport à l’état précédent.

## Archive Git-ready

- [x] Préparer une archive contenant le code source, la configuration, les données frontend et la documentation utile.
- [x] Exclure `node_modules`, `dist`, les logs, caches et autres artefacts générés.
- [x] Ajouter un guide d’import dans un dépôt Git et vérifier l’intégrité du ZIP.

## Rapport et exports

- [x] Ajouter un bouton Export visible dans le dashboard et les vues concernées.
- [x] Ouvrir une modale avec un aperçu HTML du rapport de la période sélectionnée.
- [x] Reproduire la structure de la capture : titre, période, KPI, répartition en donut, progression campagne et graphiques Hôtesses/Shops.
- [x] Ajouter l’export XLSX du rapport filtré avec feuilles de synthèse, Hôtesses, Shops et détail.
- [x] Ajouter l’export PDF du rapport filtré avec le même rendu visuel que l’aperçu HTML.
- [x] Vérifier que les graphiques et métriques se recalculent après changement de période.

## Mise en forme réunion et interactions avancées

- [x] Refaire l’export XLSX avec une feuille Synthèse présentable, titres, bandeaux, KPI, formats, largeurs, filtres, gel des volets et feuilles graphiques structurées.
- [x] Ajouter au XLSX des graphiques exploitables pour la progression, les hôtesses, les shops et la répartition en donut.
- [x] Refaire le PDF avec la même hiérarchie, les mêmes métriques et les mêmes graphiques que l’aperçu HTML.
- [x] Arrondir la courbe de progression sur la page d’accueil et dans le rapport exporté.
- [x] Ajouter des tooltips adaptés à chaque jour survolé dans la courbe de progression.
- [x] Afficher la date et la valeur au-dessus de chaque poignée du double curseur pendant la sélection.
- [x] Vérifier les exports sur la période complète et une période S2.

## Synthèse Excel — reproduction exacte de la capture

- [x] Reproduire la composition de la feuille Synthèse avec le bandeau rouge, la ligne de contexte et la grille KPI 3×3.
- [x] Utiliser les mêmes intitulés, emplacements et hiérarchie visuelle que la capture fournie.
- [x] Ajouter dans la Synthèse le graphique de progression, le donut Répartition, les performances Hôtesses et les performances Shops.
- [x] Supprimer les textes « lecture réunion », « graphiques de réunion » et toute annotation éditoriale superflue de la Synthèse.
- [x] Vérifier les données et le rendu de la Synthèse sur une période sélectionnée.

## Administration BTL des activations

- [x] Ajouter un bouton BTL « Nouvelle activation » avec formulaire de saisie contrôlé.
- [x] Permettre à BTL de supprimer une activation depuis le journal avec confirmation explicite.
- [x] Recalculer automatiquement les KPI, courbes, analyses, qualité des données et exports après ajout ou suppression.
- [x] Conserver l’absence de boutons d’ajout/suppression pour Vodacom en lecture seule.
- [x] Valider les champs obligatoires, les dates hors campagne, les doublons potentiels et les erreurs de suppression.
- [x] Tester la persistance locale et le retour à la source de référence.

## Version publique sans données par défaut

- [x] Retirer le jeu de données source de la fixture initiale et démarrer avec zéro activation.
- [x] Supprimer les noms d’agents, shops, clients et numéros des données embarquées par défaut.
- [x] Afficher des états vides propres après connexion avant import.
- [x] Conserver l’import CSV/XLSX accessible depuis Import & sources après connexion.
- [x] Tester que l’import remplit les KPI, vues, analyses, qualité et exports depuis l’état vide.
- [x] Préparer le dépôt public et la publication GitHub Pages avec cette version sans données.

## Performances & attendance — modification ciblée sans commit

- [x] Renommer uniquement le menu « Analyse croisée » en « Performances & attendance ».
- [x] Définir par défaut Lignes = Agent et Colonnes = Date.
- [x] Dans les configurations contenant la dimension Date, remplacer les cellules nulles par « Absent » en rouge.
- [x] Vérifier que les autres menus, vues et données ne changent pas.
- [x] Ne pas effectuer de commit GitHub pour cette modification.

## Commit ciblé puis correction locale des modales

- [ ] Commiter uniquement la modification Performances & attendance déjà validée.
- [ ] Ajouter la fermeture au clic extérieur à toutes les modales concernées.
- [ ] Vérifier les modales sans modifier les autres comportements.
- [ ] Ne pas effectuer de second commit après la correction des modales.

## Dropdowns et analyse Supabase — sans modification de la base

- [x] Ajouter uniquement la fermeture au clic extérieur pour les dropdowns custom.
- [x] Vérifier que les modales continuent de se fermer au clic extérieur.
- [x] Lire la configuration Supabase disponible sans modifier les secrets ni l’application.
- [x] Identifier les tables, colonnes, relations, dates et champs utiles aux activations, agents, shops et imports.
- [x] Vérifier les politiques d’accès et les contraintes pertinentes en lecture seule.
- [x] Produire un plan d’intégration Supabase non destructif avec migration progressive et repli local.
- [x] Ne rien modifier dans la base Supabase et ne pas commit la correction dropdown.

## Leads et commentaires superviseur — étude sans implémentation

- [x] Limiter la future lecture Supabase de l’application à `public.leads` uniquement.
- [x] Laisser les autres tables de l’application de déploiement hors périmètre et inchangées.
- [x] Analyser le schema des commentaires quotidiens et hebdomadaires fourni par l’utilisateur.
- [x] Documenter le lien commentaire quotidien → tooltip de chaque date de courbe/histogramme.
- [x] Documenter le lien commentaire hebdomadaire → message sous le double range slider lors d’une semaine sélectionnée.
- [x] Vérifier si le schema SQL fourni peut être exécuté tel quel et préciser les policies nécessaires.
- [x] Corriger uniquement le positionnement et la fermeture extérieure du menu Notifications.
- [x] Ne pas implémenter les commentaires, ne pas modifier Supabase et ne pas toucher aux autres vues.

## Intégration Supabase leads et commentaires — sauvegarde préalable obligatoire

- [x] Commiter l’état actuel de l’application dans le dépôt GitHub avant toute modification.
- [x] Vérifier que le commit de sauvegarde contient uniquement l’état actuel et qu’il est accessible sur GitHub.
- [x] Créer uniquement les deux tables de commentaires superviseur sans modifier les tables existantes.
- [x] Intégrer la lecture de `public.leads` avec fallback local CSV/XLSX.
- [x] Afficher les commentaires quotidiens dans les tooltips des courbes/histogrammes par date.
- [x] Afficher le commentaire hebdomadaire sous le double range slider pour les semaines sélectionnées.
- [x] Conserver le menu Notifications en overlay sans modifier le layout.
- [x] Tester fallback, permissions, commentaires et régressions avant livraison.

## Import du classeur de commentaires superviseur

- [x] Vérifier que le commit de sauvegarde est visible dans le dépôt GitHub et le pousser si nécessaire.
- [x] Lire le classeur `Commentaires_superviseur_activations_v3(1).xlsx` sans modifier son original.
- [x] Identifier les feuilles, colonnes quotidiennes et hebdomadaires et les valeurs réellement renseignées.
- [x] Normaliser les dates, semaines, métriques numériques et textes vers le schéma Supabase créé.
- [x] Valider les contraintes d’unicité et les lignes rejetées avant écriture.
- [x] Insérer uniquement les commentaires dans les deux tables superviseur.
- [x] Vérifier l’affichage des commentaires dans les tooltips et sous le double range slider.

## Push de l’état actuel puis tooltips en attente de validation

- [ ] Commiter et pousser l’état actuel avec l’intégration leads/commentaires avant toute tooltip modification.
- [ ] Rendre les tooltips quotidiens plus larges, translucides et limités à un extrait lisible.
- [ ] Ouvrir une modale complète au clic sur une date de la courbe de progression.
- [ ] Ouvrir la même modale complète au clic sur une barre/date de l’histogramme.
- [ ] Vérifier que le commit tooltip reste local et n’est pas poussé avant validation utilisateur.

## Préparation des assets sans File Storage

- [x] Auditer les assets volumineux et les références locales nécessaires au projet.
- [x] Générer les fichiers locaux de packaging/documentation sans supprimer les assets existants.
- [x] Ne pas convertir le projet en full-stack et ne pas modifier Supabase à cette étape.
- [x] Vérifier le build et préparer une nouvelle tentative de sauvegarde après résolution des assets.

## Correction du crash d’ordre des hooks — DateRangeFilter

- [x] Reproduire et isoler le rendu conditionnel qui change le nombre de hooks dans `DateRangeFilter`.
- [x] Déplacer ou stabiliser les hooks concernés afin qu’ils soient exécutés dans le même ordre à chaque rendu.
- [x] Vérifier typecheck, build, chargement de `/?from_webdev=1` et changement de période.
- [x] Ne modifier aucune autre fonctionnalité du dashboard.

## Correction ciblée du décalage desktop — carte de période

- [x] Identifier et supprimer uniquement le décalage horizontal entre l’en-tête et les contrôles de la carte de période sur desktop.
- [x] Vérifier le build et le rendu desktop sans modifier les règles mobile ni les autres sections.

## Correction ciblée — modale d’aperçu export

- [x] Rehausser uniquement le z-index de la modale d’aperçu du rapport au-dessus de la sidebar.
- [x] Vérifier le build, la superposition et publier la correction validée.

## Raffinement UX — survol de la courbe de progression

- [x] Aimanter la ligne de survol à la date la plus proche sur la courbe du dashboard.
- [x] Maintenir le tooltip de la date active lorsque le curseur est au-dessus ou au-dessous du point.
- [x] Vérifier l’interaction et le build sans modifier les autres graphiques.

## Correctif ciblé — déclenchement du survol de progression

- [x] Reproduire le défaut de déclenchement du survol signalé sur la courbe.
- [x] Corriger uniquement l’écouteur de déplacement qui active la date et son tooltip.
- [x] Vérifier l’interaction sur toute la zone du graphique et le build.

## Ajustement UX — seuil de magnétisme de la courbe

- [x] Laisser la ligne de survol suivre librement la souris hors d’une zone de ±5 pixels des dates.
- [x] Aimanter la ligne et afficher le tooltip uniquement lorsque le curseur atteint cette zone de proximité.
- [x] Tester le suivi libre et le seuil de ±5 pixels sans modifier les autres graphiques.

## Raffinement UX — tooltip de courbe et aimantation

- [x] Ancrer le tooltip de la date à droite de la position du curseur, au lieu du point.
- [x] Animer fluidement le déplacement de la ligne lorsqu’elle s’aimante à une date.
- [x] Vérifier l’interaction et le build sans modifier les autres graphiques.

## Publication — raffinement de survol

- [x] Publier la version validée du tooltip de courbe et de l’aimantation.

## Objectifs par type de shop — intégration additive

- [x] Modéliser la matrice Shop standard / Airport–Jeffery : Bundle 20/20, Roaming 3/10, Privilège 20/20.
- [x] Ajouter une matrice éditable dans Paramètres sans déplacer les vues existantes.
- [x] Calculer les objectifs journaliers à partir des agents actifs et du type de shop.
- [x] Afficher les objectifs de façon discrète dans les courbes de progression, histogrammes et vues Agents/Shops.
- [x] Vérifier les calculs et préserver tous les layouts existants. Contrôle local : 109 affectations actives, objectifs de 172 (23 juil), 408 (27 juil) et 50 (10 août), cohérents avec les valeurs de tooltip.

## Raffinement objectifs — lisibilité et affichage à la demande

- [x] Réorganiser Matrice d’objectifs, tableau et commentaire en colonne pour offrir toute la largeur disponible au tableau.
- [x] Masquer par défaut les séries objectif du dashboard et les afficher avec un switch dédié.
- [x] Afficher l’objectif total filtré dans le hero sans modifier le volume filtré.
- [x] Préserver les séries objectif actives dans les vues Agents et Shops.
- [x] Vérifier les layouts desktop et mobile ainsi que le build.

## Raffinement objectifs — switches par graphique

- [x] Remplacer le switch unique par un switch indépendant pour la courbe de progression.
- [x] Ajouter un switch indépendant pour l’histogramme quotidien.
- [x] Vérifier les quatre combinaisons d’affichage et le build sans modifier les autres vues.

## Publication et animation — switches objectifs

- [x] Publier la version validée des deux switches indépendants.
- [x] Ajouter un tooltip explicatif au survol de chaque switch.
- [x] Animer les switches et l’apparition/disparition des séries objectif sans modifier les calculs.
- [x] Vérifier les interactions et le build.

## Publication et optimisation mobile — animations objectifs

- [x] Publier les tooltips et transitions validés des switches objectifs.
- [x] Vérifier les deux switches et leurs séries cible sur viewport mobile.
- [x] Optimiser uniquement les animations mobile si nécessaire.
- [x] Contrôler le build et la publication finale.

## Correctifs ciblés — persistance et exports

- [x] Sauvegarder les états indépendants des switches objectif dans localStorage.
- [x] Ajouter les objectifs et le comparatif cible/réalisé à l’aperçu HTML, XLSX et PDF.
- [x] Réparer le contenu de la feuille Synthèse XLSX.
- [x] Rendre l’export PDF fidèle à l’aperçu HTML, avec donut et libellés d’axes visibles.
- [x] Vérifier les fichiers exportés sans publier de nouvelle version.

## Raffinements ciblés — export et pilotage clavier

- [x] Rendre lisibles les étiquettes des barres dans le PDF, sans les tronquer.
- [x] Remplacer la valeur isolée d’atteinte objectif par une barre de progression dans l’aperçu et le PDF.
- [x] Ajouter des icônes discrètes aux tuiles de KPI du rapport HTML et PDF.
- [x] Ajouter le raccourci X pour ouvrir l’export, puis X/XLSX et P/PDF dans la modale.
- [x] Ajouter le pilotage Ctrl+Alt+flèches du sélecteur de dates sans focus.
- [x] Définir et valider le comportement aux limites de la période.
- [x] Vérifier les raccourcis et le rendu sans publier.

## Publication GitHub préalable et correctifs d’export

- [x] Publier l’état actuel validé sur le dépôt GitHub et GitHub Pages.
- [x] Corriger l’erreur XML `sheet1.xml` qui empêche Microsoft Excel d’ouvrir la Synthèse.
- [x] Agrandir et teinter les icônes rouges transparentes des tuiles HTML/PDF.
- [x] Transformer la jauge « Atteinte objectif » en grand rectangle avec pourcentage intégré.
- [x] Garder les raccourcis Ctrl+Alt de période fonctionnels lorsque l’aperçu est ouvert.
- [x] Vérifier les exports et raccourcis, sans republier les nouvelles corrections.

## Publication GitHub et fiabilisation finale des exports

- [x] Publier le checkpoint local validé `9acada97` sur GitHub Pages.
- [x] Corriger l’élément de dessin `drawing1.xml` que Microsoft Excel supprime à l’ouverture.
- [x] Préserver des graphiques compatibles dans la Synthèse XLSX.
- [x] Utiliser des formules liées à « Détail filtré » pour les indicateurs et tableaux XLSX lorsque possible.
- [x] Agrandir les icônes de fond partiellement tronquées dans les tuiles HTML/PDF.
- [x] Autoriser les raccourcis Alt+0 et Alt+1–9 sous l’aperçu d’export.
- [x] Vérifier les exports et raccourcis, sans publier les nouvelles corrections.

## Restauration du dashboard et resynchronisation GitHub

- [x] Comparer la branche main modifiée au dernier checkpoint local validé.
- [x] Restaurer les deux switches Objectifs sur les graphiques du dashboard.
- [x] Préserver les derniers correctifs validés d’export et de raccourcis.
- [x] Vérifier localement le dashboard restauré et les exports.
- [x] Synchroniser la branche main et GitHub Pages après confirmation.

## Source effective GitHub Pages — branche targettings

- [x] Comparer la branche `targettings` utilisée par GitHub Pages au bundle restauré.
- [x] Préparer la restauration des switches Objectifs et des derniers ajouts pour `targettings`.
- [x] Obtenir confirmation avant d’écraser les fichiers de la branche de déploiement.
- [x] Publier la restauration sur `targettings` et vérifier GitHub Pages.

## Main comme source de production et correctifs ciblés

- [x] Publier l’état actuel validé sur `main`.
- [x] Basculer GitHub Pages de `targettings` vers `main` après confirmation.
- [x] Réparer les graphiques de la feuille Synthèse XLSX sans réparation Excel.
- [x] Appliquer le format pourcentage seulement aux parts et taux dans les feuilles XLSX.
- [x] Incliner et alléger les grandes icônes de fond des tuiles HTML/PDF.
- [x] Animer les nombres de l’aperçu d’export.
- [x] Fluidifier uniquement la ligne verticale de survol de la courbe dashboard.
- [x] Vérifier et corriger le chargement des polices visibles dans l’interface.
- [x] Valider localement sans publier les nouveaux correctifs.

## Publication PNG et animations fluides des graphiques d’export

- [x] Publier le checkpoint local `1049f40f` sur la branche main et GitHub Pages.
- [x] Animer la courbe de période sélectionnée comme un tracé progressif fluide.
- [x] Ajouter un easing moderne aux barres de performance hôtesses et shops.
- [x] Ajouter une animation douce de l’anneau de répartition.
- [x] Figer correctement les animations dans la capture PDF.
- [x] Vérifier localement l’aperçu, le PDF et les exports sans republier les animations.

## Correction — transitions continues des graphiques d’export

- [x] Rétablir la ligne rouge continue de la période sélectionnée.
- [x] Interpoler le déplacement de la zone sélectionnée au changement de période.
- [x] Faire évoluer les barres depuis leur largeur courante, sans retour à zéro.
- [x] Faire évoluer les segments du donut depuis leur état courant, sans retour à zéro.
- [x] Vérifier l’aperçu et la capture PDF sans publication.

## Publication et raffinement du glissement de période

- [x] Publier le checkpoint local `520aff43` sur main et GitHub Pages.
- [x] Afficher une infobulle de dates pendant le glissement de sélection.
- [x] Renforcer l’easing rapide puis fortement amorti de la sélection.
- [x] Adapter le rendu final de l’infobulle à la capture PDF.
- [x] Vérifier localement sans republier ces nouveaux raffinements.

## Publication et sélecteur de période dans l’aperçu

- [x] Publier le checkpoint local `3dab44ae` sur main et GitHub Pages.
- [x] Intégrer le sélecteur de période au header de la modale d’aperçu.
- [x] Préserver les raccourcis et le recalcul en direct de l’aperçu.
- [x] Vérifier localement le header, le PDF et le responsive sans publication.

## Correction ciblée — alignement du sélecteur d’aperçu

- [x] Placer le sélecteur à droite du titre dans la ligne de header existante.
- [x] Supprimer la ligne dédiée au sélecteur sans réduire la zone d’aperçu.
- [x] Vérifier le rendu local sans publication.

## Correction de police et publication finale

- [x] Identifier la source du fallback de police dans le dashboard.
- [x] Corriger le chargement des familles et poids de police concernés.
- [x] Vérifier le rendu local du dashboard sans modifier le layout.
- [x] Publier l’état typographique corrigé sur main et GitHub Pages.

## IA Gemini et persistance des actions BTL

- [x] Vérifier les schémas de commentaires et les politiques Supabase sans modifier les tables existantes.
- [x] Ajouter une configuration locale navigateur pour la clé Gemini et les écritures BTL directes.
- [x] Générer un commentaire quotidien ou hebdomadaire seulement s’il est absent de la table concernée.
- [x] Ajouter l’édition et la régénération IA des commentaires dans la vue BTL.
- [x] Persister après confirmation les suppressions et modifications d’activations BTL dans Supabase.
- [x] Valider avec une clé Gemini réelle l’écriture générée et la persistance après reconnexion.

## Publication et migration Gemini sécurisée via Supabase

- [x] Publier le checkpoint local `72409bd9` sur main et GitHub Pages.
- [x] Ajouter la clé sous le nom exact `GEMINI_API_KEY` et supprimer le secret mal nommé.
- [x] Retirer la configuration Gemini du navigateur et la remplacer par un secret Supabase non exposé.
- [x] Déployer une fonction Supabase sécurisée de génération et de persistance des commentaires.
- [x] Restreindre la configuration Gemini à BTL et conserver Vodacom en lecture seule.
- [x] Réduire les données locales au cache de secours et privilégier la synchronisation Supabase partagée.
- [x] Ajouter une nouvelle tentative et un repli pour les saturations temporaires Gemini.
- [x] Valider avec une clé réelle, Supabase et les deux rôles avant publication des nouveaux correctifs.

## Repli Gemini après échec de disponibilité

- [x] Ajouter des modèles Gemini de repli à disponibilité renforcée.
- [x] Conserver le dernier diagnostic Gemini côté fonction sans exposer de secret.
- [x] Redéployer la fonction puis retester une régénération confirmée.

## Compétence réutilisable, publication et animation dashboard

- [x] Créer et valider une compétence réutilisable du flux Gemini–Supabase sécurisé.
- [x] Publier sur main les correctifs locaux de synchronisation Gemini–Supabase.
- [x] Supprimer le secret Supabase Gemini mal nommé après confirmation.
- [x] Animer la courbe de progression dashboard au changement de période.
- [x] Vérifier l’animation, la synchronisation et la publication GitHub Pages.

## Correction ciblée — affichage incomplet du dashboard

- [x] Reproduire le défaut de rendu et identifier son origine.
- [x] Corriger uniquement le composant ou style qui masque les éléments.
- [x] Vérifier le dashboard complet sans modifier le reste.

## Publication GitHub Pages — correction dashboard Vodacom

- [x] Générer le bundle de production correspondant au correctif validé.
- [x] Téléverser le bundle sur la branche `main` avec un commit descriptif.
- [x] Vérifier que la version GitHub Pages affiche le dashboard Vodacom complet.

## Parité des données — dashboard Vodacom et BTL

- [x] Comparer les valeurs et libellés affichés dans les deux dashboards pour une même période.
- [x] Aligner uniquement le volume filtré Vodacom sur le total d’activations BTL et afficher l’objectif associé.
- [x] Valider le correctif puis lister les autres écarts constatés sans les modifier.

## Correctif Vite — connexion WebSocket de prévisualisation

- [x] Diagnostiquer la cause de l’échec de connexion HMR WebSocket dans la prévisualisation.
- [x] Appliquer uniquement le correctif de configuration ou de serveur nécessaire.
- [x] Redémarrer le serveur et vérifier l’absence d’erreur WebSocket dans le navigateur.

## Objectifs partagés et parité Vodacom

- [x] Uniformiser le texte du hero Vodacom avec celui de BTL, sans modifier les autres libellés validés.
- [x] Ajouter les objectifs aux mini-courbes Agents et Shops pour Vodacom.
- [x] Auditer le modèle d’objectifs et créer un stockage Supabase isolé, sans modifier les tables existantes.
- [x] Charger les objectifs partagés dans les deux rôles et permettre leur mise à jour uniquement par BTL.
- [x] Valider les droits, le rendu Vodacom/BTL et la connexion du serveur de développement.
- [x] Publier les modifications validées sur GitHub Pages.

## Chargement des objectifs et commentaire IA de période personnalisée

- [x] Publier l’état actuel sur GitHub Pages avant les nouvelles modifications.
- [x] Identifier les composants de filtre, commentaires et export à raccorder.
- [x] Ajouter un indicateur de chargement des réglages d’objectifs Supabase.
- [x] Générer et conserver localement le commentaire IA d’une période personnalisée.
- [x] Afficher ce commentaire local dans l’export HTML, XLSX et PDF.
- [x] Vérifier les parcours BTL/Vodacom et les exports sans publier ces nouveaux ajouts.

## Correction — commentaire de période et composition de l’export

- [x] Rétablir l’invite et le bouton IA lorsqu’une sélection ne correspond à aucune semaine exacte.
- [x] Conserver le commentaire hebdomadaire existant pour une semaine exacte.
- [x] Insérer le commentaire hebdomadaire sous la courbe dans la tuile Progression campagne de l’aperçu et du PDF.
- [x] Agrandir et épaissir le donut, puis déplacer sa légende sous l’anneau.
- [x] Vérifier les deux cas de période et les exports sans publier le correctif.

## Lecture Vodacom — commentaires de période et export

- [x] Identifier les conditions de rôle qui masquent les commentaires dans le filtre et l’export.
- [x] Afficher les commentaires locaux de période personnalisée dans Vodacom en lecture seule.
- [x] Afficher les commentaires hebdomadaires dans Vodacom en lecture seule.
- [x] Inclure le commentaire applicable dans l’aperçu et les exports Vodacom.
- [x] Vérifier que Vodacom ne peut ni générer, ni modifier, ni enregistrer un commentaire.

## Génération locale de période personnalisée — Vodacom

- [x] Identifier les gardes de rôle qui empêchent actuellement Vodacom de lancer la génération locale.
- [x] Autoriser le bouton Générer par IA pour une période personnalisée dans Vodacom.
- [x] Conserver l’enregistrement du résultat dans le stockage local du navigateur.
- [x] Vérifier que les autres actions d’édition des commentaires restent exclusivement BTL.

## Publication GitHub Pages — génération locale Vodacom

- [x] Générer le bundle de production du dernier correctif validé.
- [x] Téléverser le bundle sur `main` avec un commit descriptif.
- [x] Vérifier la version GitHub Pages publiée.

## Favicon personnalisée

- [x] Créer une favicon opaline représentant l’identité BTL – Deployment report.
- [x] L’intégrer au document HTML de l’application.
- [x] Vérifier son rendu en prévisualisation sans publier la modification.

## Publication favicon et icônes système

- [x] Publier la favicon opaline validée sur GitHub Pages.
- [x] Créer une variante monochrome adaptée aux favoris système.
- [x] Créer les icônes PWA à partir du même symbole.
- [x] Déclarer un manifest PWA et les ressources d’icône correspondantes.
- [x] Vérifier localement les icônes et le manifest sans publier ces nouveaux ajouts.

## Publication PWA et écran de démarrage mobile

- [x] Publier le manifest et les icônes PWA sur GitHub Pages.
- [x] Concevoir un écran de démarrage mobile Halo Opaline.
- [x] Intégrer l’écran de démarrage sans perturber la connexion ni la navigation.
- [x] Vérifier le manifest, les icônes et le démarrage mobile sans publier l’écran de démarrage.

## Publication démarrage PWA et installation guidée

- [x] Publier l’écran de démarrage mobile personnalisé sur GitHub Pages.
- [x] Concevoir une interface mobile guidant l’ajout à l’écran d’accueil.
- [x] Intégrer l’invite d’installation native lorsqu’elle est disponible.
- [x] Ajouter une explication dédiée pour l’installation iOS.
- [x] Vérifier les parcours d’installation et l’absence de régression sans publier le guidage.

## Barre de fenêtre — application desktop installée

- [x] Examiner le manifest et les capacités Window Controls Overlay disponibles.
- [x] Activer le mode de barre de fenêtre personnalisée pour les installations desktop compatibles.
- [x] Ajouter favicon, fermeture et agrandissement/réduction dans la barre dédiée.
- [x] Préserver les interfaces navigateur, mobile et systèmes non compatibles.
- [x] Vérifier le build et le repli de compatibilité sans publier la modification.

## Publication barre desktop et raffinement macOS

- [x] Publier la barre de fenêtre personnalisée sur GitHub Pages.
- [x] Ajouter un raccourci clavier de bascule plein écran hors des champs de saisie.
- [x] Ajuster position, taille et espacement des pastilles au style macOS.
- [x] Vérifier le build et les replis navigateur/mobile sans publier les derniers raffinements.

## Correction — barre native dans la PWA desktop

- [x] Identifier pourquoi l’installation Chrome conserve une barre native malgré la configuration PWA.
- [x] Configurer un mode d’affichage PWA sans barre native pour une nouvelle installation desktop.
- [x] Adapter la barre personnalisée pour qu’elle soit visible dans ce mode.
- [x] Vérifier le build et documenter la réinstallation de l’application nécessaire.

## Publication mode plein écran et raffinement de barre desktop

- [x] Publier le mode PWA plein écran sans barre native sur GitHub Pages.
- [x] Affiner l’effet de survol des trois contrôles personnalisés.
- [x] Réduire la hauteur de la barre personnalisée sans créer de décalage de contenu.
- [x] Vérifier le build et le manifest publié avant de fournir le guide de réinstallation.

## Limitation Chrome — fenêtre desktop sans titre

- [x] Confirmer que la barre visible relève de la fenêtre Chrome et non de l’interface web.
- [x] Vérifier que l’application ne rend pas de seconde barre concurrente.
- [x] Présenter l’alternative nécessaire pour obtenir une fenêtre réellement sans barre de titre.

## Publication repli PWA et infobulles de contrôles

- [x] Publier le repli qui empêche toute seconde barre de fenêtre web.
- [x] Ajouter une infobulle explicite sur chacun des trois contrôles personnalisés.
- [x] Vérifier le build et le repli lorsque Window Controls Overlay est indisponible.

## Seconde campagne Supabase

- [x] Examiner le schéma et les enregistrements mis à jour pour identifier les deux campagnes.
- [x] Définir les champs, objectifs et filtres nécessaires par campagne sans modifier la base existante.
- [x] Ajouter un sélecteur de campagne et filtrer les rubriques de reporting associées.
- [x] Vérifier Dashboard, Activité, Agents, Shops, Activations, exports et les deux rôles.
- [x] Sauvegarder localement l’intégration sans publication GitHub Pages.

## Correctif — visibilité du sélecteur de campagne

- [ ] Reproduire la session où le sélecteur de campagne est absent ou inaccessible.
- [ ] Corriger le positionnement ou la condition d’affichage du sélecteur.
- [x] Vérifier son accès sur desktop et mobile, sans publier le correctif.

## Publication multi-campagnes — sidebar, commentaires et objectifs Merchant

- [ ] Vérifier les sources Merchant disponibles pour les commentaires et les objectifs journaliers.
- [ ] Remplacer le tag de rôle de la sidebar par le sélecteur de campagne sans modifier le switcher de vue inférieur.
- [ ] Ajouter les commentaires Merchant dans le filtre, les tooltips et les exports.
- [ ] Activer les deux switchers d’objectifs dans les graphiques Merchant.
- [ ] Valider Vodacom Privilège et Merchant, puis publier GitHub Pages.

## Parcours BTL — sélection d’utilisateur Supabase

- [x] Identifier les colonnes utiles de `users` et les rôles autorisés : admin, superadmin, sous-admin et superviseur.
- [x] Afficher ces utilisateurs sous forme de tuiles carrées dans le parcours BTL, sans liste verticale.
- [x] Demander le mot de passe seulement après la sélection explicite d’une tuile utilisateur.
- [x] Préserver l’accès direct Vodacom et tous les autres parcours d’application.
- [x] Valider localement la connexion BTL avec un mot de passe réel, les erreurs de mot de passe et la fermeture des modales avant toute publication.

## Profils BTL, changement interne et traçabilité

- [x] Auditer la table `users`, ses contraintes et les actions BTL à journaliser sans modifier les tables métier existantes.
- [x] Ajouter de façon additive les champs de profil nécessaires et une table isolée de journal des modifications.
- [x] Insérer les profils Michael, Benedicte Mondo et Daniel avec leurs rôles, numéros normalisés et mots de passe fournis.
- [x] Différencier clairement les rôles par tuiles, couleurs et icônes dans la connexion BTL.
- [x] Remplacer le changement de compte interne par le même parcours de tuiles et de mot de passe.
- [x] Ajouter dans Paramètres les actions BTL de changement de mot de passe et de photo de profil.
- [x] Journaliser les modifications BTL de données avec auteur, action, contexte et horodatage.
- [x] Vérifier les droits, les parcours desktop/mobile et publier la version validée sur GitHub Pages.

## Correctif — performance et intitulés des profils BTL

- [x] Éliminer le délai perceptible lors de l’ouverture du sélecteur de profils BTL.
- [x] Corriger le débordement de l’icône dans les tuiles de profil.
- [x] Afficher « Opérations » pour les rôles sous-admin, sans modifier leurs permissions.
- [x] Créer le rôle superadministrateur pour Eldo et Ruth, affiché comme « Support ».
- [x] Vérifier les tuiles, le parcours BTL et publier le correctif GitHub Pages.

## Transactions Merchant — gestion BTL

- [x] Identifier les colonnes modifiables et la clé primaire de `ba_transactions` sans modifier son schéma.
- [x] Ajouter une action d’édition accessible uniquement au rôle BTL dans les vues Merchant concernées.
- [x] Ajouter une suppression avec confirmation explicite et persistance Supabase.
- [x] Journaliser les changements BTL liés aux transactions Merchant.
- [x] Vérifier la persistance, la lecture seule Vodacom, les modales et le build avant livraison locale.

## Transactions Merchant — création, filtres et photo

- [x] Publier l’édition et la suppression Merchant validées sur GitHub Pages.
- [x] Identifier les références existantes nécessaires à la création d’une transaction et à l’aperçu de son image.
- [x] Ajouter un bouton BTL de création de transaction avec validation des champs et persistance Supabase.
- [x] Ajouter les filtres custom par statut et par ambassadeur dans la table Merchant.
- [x] Afficher l’image liée à `evidence_path` dans la modale d’édition, avec un état explicite si elle est absente.
- [x] Vérifier la création, les filtres, l’aperçu photo, la lecture seule Vodacom et le build avant livraison locale.

## Renforcement Merchant, profil et permissions

- [x] Vérifier les règles du bucket de preuves et les références nécessaires au téléversement obligatoire d’une nouvelle transaction.
- [x] Rendre la photo de preuve obligatoire dans le formulaire de création Merchant et la téléverser avant l’écriture de la transaction.
- [x] Remplacer les chevrons des filtres et de création par le composant visuel utilisé pour les sélecteurs de campagne et de vue.
- [x] Remplacer l’URL de photo de profil par une zone de dépôt et un sélecteur de fichier avec téléversement sécurisé.
- [x] Ajouter dans Paramètres la matrice Merchant : 15 POS/jour et 3 transactions/POS.
- [x] Restreindre Import & sources aux comptes superadministrateur, sans modifier les autres permissions BTL/Vodacom.
- [x] Vérifier les téléversements, les objectifs et les droits sur desktop/mobile avant livraison locale.

## Sécurité du journal BTL

- [ ] Décider des politiques RLS à appliquer à `btl_data_change_log` avant toute activation de RLS, afin de préserver la journalisation applicative.

## Raffinement Halo Opaline — Merchant et objectifs

- [x] Comparer la table Transactions, ses filtres et ses modales aux surfaces Halo Opaline de référence.
- [x] Réviser la hiérarchie, les libellés, les contrôles et les espacements Merchant sans changer leurs fonctions.
- [x] Renommer les matrices en « Matrice d’objectifs campagne Privilège » et « Matrice d’objectifs campagne Merchant ».
- [x] Aligner visuellement les deux matrices et vérifier le rendu local avant livraison.

## Objectifs et import de transactions Merchant

- [x] Auditer les cibles Merchant persistées et les colonnes obligatoires de `ba_transactions`.
- [x] Rendre les objectifs POS/jour et transactions/POS éditables avec persistance Supabase.
- [x] Ajouter un dépôt CSV/XLSX à la table Transactions Merchant réservé à BTL.
- [x] Présenter une modale d’aperçu qui conserve les lignes incomplètes et identifie les champs manquants.
- [x] Importer uniquement les lignes complètes dans Supabase et verser les anomalies dans Qualité des données.
- [x] Vérifier la persistance, les données importées, les anomalies et la lecture Vodacom avant livraison locale.

## Correctif de matrice Merchant inline

- [x] Comparer la structure et les commandes − / + de la matrice Privilège à la section Merchant actuelle.
- [x] Afficher la matrice Merchant sous forme de contrôles inline identiques, sans modalité séparée.
- [x] Persister les modifications Merchant et actualiser la cible quotidienne affichée.
- [x] Vérifier que la prévisualisation locale sert le nouveau rendu avant livraison.

## Publication, raccourcis de campagne et Performance & présence

- [x] Publier la matrice Merchant inline validée sur GitHub Pages.
- [x] Ajouter Alt+P pour Vodacom Privilège et Alt+M pour Merchant, hors champs de saisie.
- [x] Adapter les dimensions et libellés de Performance & présence à la campagne active.
- [x] Conserver le tableau par date et le statut rouge « Absent » pour toute cellule sans présence.
- [x] Vérifier les raccourcis, les vues Privilège/Merchant et la lecture Vodacom avant livraison locale.

## Montants dans les sorties Merchant

- [x] Identifier les listes, modales et exports Merchant qui présentent une transaction individuelle.
- [x] Afficher le montant formaté dans chaque sortie Merchant concernée.
- [x] Vérifier le format monétaire, la valeur absente et le rendu local avant livraison.

## Montants dans le classeur XLSX Merchant

- [x] Vérifier les feuilles Merchant du classeur et les colonnes de détail disponibles.
- [x] Ajouter le montant à chaque ligne transactionnelle et aux agrégats XLSX Merchant pertinents.
- [x] Vérifier le format numérique du classeur généré avant livraison locale.

## Publication des montants XLSX Merchant

- [x] Préparer et publier le complément XLSX Merchant validé sur GitHub Pages.
- [x] Vérifier la propagation de la version publiée.

## Étude des commentaires Merchant

- [x] Inventorier les colonnes de commentaires de `ba_daily_attendance`, `ba_transactions` et des éventuelles tables de supervision.
- [x] Distinguer les commentaires individuels de clôture BA des commentaires de synthèse superviseur.
- [x] Comparer ces sources à l’agrégation actuellement affichée dans les graphiques et exports.
- [x] Proposer une règle de restitution qui ne mélange pas les niveaux de commentaire.

## Synthèses quotidiennes superviseur Merchant

- [x] Vérifier le modèle et les contraintes de `campaign_supervisor_report_comments` pour les périodes d’une journée.
- [x] Retirer les commentaires BA et transactionnels de tout tooltip et graphique Merchant.
- [x] Charger seulement les synthèses journalières superviseur dans les commentaires de graphique Merchant.
- [x] Permettre à BTL de générer une synthèse quotidienne IA à partir des clôtures BA puis de la sauvegarder dans Supabase.
- [x] Laisser la zone vide dans Vodacom lorsqu’aucune synthèse journalière superviseur n’existe.
- [x] Vérifier la persistance, les droits, les tooltips et le build avant livraison locale.

## Correctif de collecte Gemini Merchant

- [x] Identifier les commentaires BA et les données de clôture réelles à fournir à Gemini pour une synthèse quotidienne et hebdomadaire.
- [x] Comparer le payload actuellement envoyé à Gemini à ces données sources.
- [x] Corriger la collecte et le prompt afin d’éviter toute synthèse tronquée ou incomplète.
- [x] Tester la génération sans modifier les commentaires métier existants.

## Short-code des transactions Merchant

- [x] Ajouter de façon additive `short_code text` dans `public.ba_transactions` et confirmer son existence par lecture du schéma Supabase.
- [x] Exposer Short-code dans le modèle, le chargement Supabase, la création, l’édition et l’import CSV/XLSX Merchant.
- [x] Ajouter la colonne Short-code à la table Transactions BTL avec recherche associée, ainsi qu’aux formulaires de création et d’édition.
- [x] Vérifier localement l’affichage desktop, la valeur absente, le formulaire avec preuve obligatoire, la fermeture extérieure, le typecheck et le build.
- [ ] Obtenir la validation utilisateur avant tout commit ou publication GitHub Pages.

## Correctif Merchant — objectifs terrain et synthèses BA

- [x] Calculer l’objectif quotidien Merchant à partir des ambassadeurs effectivement pointés et des POS visités comme opérationnels, plutôt que d’une cible fixe de 45 transactions.
- [x] Alimenter les courbes, le hero et les exports Merchant avec cette série dynamique, sans recalcul métier dupliqué dans les vues.
- [x] Confirmer que Gemini Merchant déployé lit uniquement les clôtures pertinentes de `ba_daily_attendance.closing_comment` ; `daily_reports` reste limité à Privilège.
- [ ] Vérifier les parcours BTL/Vodacom, le build et l’absence de régression avant une sauvegarde locale sans publication.

> Validation de démarrage : le 03 septembre 2026, la prévisualisation locale affiche correctement l’écran de sélection Vodacom / BTL après le rechargement initial.

> Contrôle BTL en cours : la tuile Michael ouvre bien l’étape de confirmation par mot de passe ; aucune donnée Merchant n’a été modifiée durant ce contrôle.

> Session BTL : l’accès Michael est validé en local. Le dashboard Privilège démarre sans erreur, ses données Supabase et ses objectifs restent inchangés.

> Contrôle Merchant : la session BTL charge 389 transactions sur 9 jours et le total d’objectif affiché est désormais 300, non plus 45 transactions fixes par jour. Une vérification visuelle stabilisée du graphique reste à terminer après synchronisation.

> Série contrôlée : les 300 transactions-cible sont issues de huit journées réellement déployées, avec un plafond de 15 POS configurés, réduit à la fois par les BA pointés et les POS dont `operational_status` est `active`. La ligne d’objectif s’affiche correctement à l’activation de son switch BTL.

> Vérification de cohérence SQL : la série quotidienne Merchant obtenue est 0, 36, 39, 33, 12, 45, 45, 45 et 45 transactions. Elle reflète respectivement l’effectif en pointage et 0, 12, 20, 11, 4, 25, 35, 21 et 42 POS opérationnels, pour un total de 300.

> Les switchers BTL affichent correctement la ligne d’objectif dans la courbe de progression et dans l’histogramme. La console de la prévisualisation ne relève aucune erreur après ces interactions.

> Le retour à l’écran de connexion via la déconnexion BTL fonctionne normalement ; aucun changement d’objectif, transaction ou commentaire n’a été écrit durant la validation.

## Publication du correctif Merchant

- [x] Finaliser le commit GitHub Pages du correctif validé des objectifs Merchant dynamiques et de la source Gemini `closing_comment`.
- [x] Vérifier que la branche `main` et la version GitHub Pages exposent bien ce correctif.

> Publication en cours : les 12 fichiers compilés (index, bundles, ressources PWA et visuels) ont été transférés vers l’interface de dépôt GitHub sur la branche `main`, après confirmation explicite.

> Le message de commit `fix: objectifs Merchant dynamiques selon activité terrain` a été saisi et soumis directement vers `main`. GitHub finalise actuellement le traitement des fichiers.

> Commit distant créé : `adcfa0b` est confirmé sur `main` le 04 septembre 2026. La propagation GitHub Pages reste à vérifier.

> Vérification de production en cours : la nouvelle page titre est servie à l’URL GitHub Pages, mais l’interface n’est pas encore rendue. Les ressources compilées et leurs chemins sont en cours de contrôle avant de déclarer la publication réussie.

> Correctif de publication : le premier index référençait par erreur les bundles sous `assets/` alors qu’ils ont été publiés à la racine du dépôt. L’index corrigé, qui référence les mêmes bundles à la racine, a été téléversé et attend son commit GitHub.

> Le correctif d’index a été soumis avec le message `fix: corriger les chemins des bundles GitHub Pages`. La création du commit est en traitement par GitHub.

> Commit correctif confirmé : `32a5938` est désormais en tête de `main`. GitHub Pages sert encore une page sans interface à cet instant ; la propagation du nouveau commit et les réponses réseau doivent être contrôlées.

> Les bundles principaux à la racine répondent bien en HTTP 200, alors que leurs anciennes adresses `assets/` répondent 404. Le diagnostic d’artefact se poursuit afin d’identifier la dernière référence de ressources avant d’annoncer la publication.

> Diagnostic du rendu vide : la racine React est bien montée, mais le navigateur consulté conserve une feuille de style servie depuis l’ancienne adresse `assets/index-BESF6BpW.css`. La nouvelle feuille à la racine répond déjà correctement. Le contrôle suivant purge l’éventuel cache de service worker avant de confirmer la propagation publique.

> Publication validée : après purge de cache et rechargement, GitHub Pages affiche de nouveau l’écran de connexion complet avec son style Halo Opaline. La branche `main` inclut les commits `adcfa0b` (correctif Merchant) et `32a5938` (chemins d’artefact).

## Transfert des autorisations BDD vers superadmin

- [x] Identifier toutes les actions et paramètres BDD aujourd’hui réservés au rôle `admin`.
- [x] Réserver ces actions exclusivement au rôle `superadmin` sans modifier les droits métier BTL courants.
- [x] Vérifier les parcours admin, superadmin et Vodacom, puis le build.
- [ ] Publier directement le correctif validé sur GitHub Pages.

> Validation locale : l’admin Michael ne voit plus le menu Import & sources et son authentification BDD est refusée. Le superadmin voit le menu et la modale indique explicitement « Vérification superadministrateur ». Vodacom ne voit aucun contrôle de configuration BDD. TypeScript, build et console sont sans erreur.
