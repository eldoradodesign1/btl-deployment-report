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
