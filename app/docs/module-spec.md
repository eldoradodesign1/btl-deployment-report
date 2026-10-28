# Fonctionnalités du prototype enrichi

## Authentification locale

Le prototype démarre sur un écran de connexion cohérent avec le cockpit. Il s’agit d’une simulation locale destinée à valider l’expérience et non d’un mécanisme de sécurité de production : le compte de test affiché est `pilotage@vodacom.cd` et la session est conservée dans `localStorage` jusqu’à la déconnexion.

## Activité

La page regroupe les lignes par date de sélection active. Elle affiche les trois types d’action, le total, le nombre d’agents distincts et le nombre de shops distincts. Elle ajoute le meilleur jour, le jour le plus faible, la moyenne quotidienne et une barre horizontale par date.

## Activations

La page expose les lignes détaillées de la sélection avec recherche globale sur agent, shop, client, numéro et type d’action. Les lignes sont paginées, triables par date ou volume de correspondance, et un panneau de détail se déploie pour afficher les sept champs métier.

## Analyse croisée

Deux sélecteurs déterminent la dimension des lignes et celle des colonnes. Les dimensions disponibles sont Agent, Date, Shop, Catégorie et Type d’action. La matrice compte les activations correspondant à chaque combinaison et reste reliée au filtre de période.

## Qualité des données

Les indicateurs sont calculés à chaque rendu sur le jeu visible : lignes totales, dates manquantes, agents manquants, shops non renseignés, actions inconnues, numéros manquants et occurrences de doublons exacts. Les anomalies sont visibles dans un tableau séparé.

## Import navigateur

L’import accepte les CSV à séparateur `;`, `,` ou tabulation, gère les guillemets, les dates françaises et les colonnes dans un ordre variable. Un aperçu est affiché avant validation. Le fichier Excel reste indiqué comme source attendue pour la version desktop ; le prototype web valide directement le flux CSV côté navigateur et conserve le jeu importé dans `localStorage`.

## Paramètres

L’objectif quotidien, l’export automatique, le thème et le nom de l’équipe sont modifiables. Les réglages sont persistés localement. Le prototype signale que la génération d’Excel et l’export à la fermeture restent des fonctions de la future version desktop.
