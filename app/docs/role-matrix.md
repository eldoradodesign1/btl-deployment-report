# Rôles et permissions

| Avatar | Authentification | Visibilité | Édition |
|---|---|---|---|
| **Vodacom** | Compte de lecture, sans mot de passe terrain exposé dans l’interface | Dashboard, courbe globale, jours prestés, Activité réduite aux dates et volumes journaliers ; pas de performance détaillée des hôtesses | Aucune édition, aucun import, aucun paramètre métier |
| **BTL** | Mot de passe fixe `BTL2026` | Toutes les vues et tous les détails opérationnels | Renommer les hôtesses, renommer les shops, modifier les cellules métier du tableau, importer, configurer et exporter |

La différence ne sera pas seulement appliquée à la navigation : les données sensibles et les actions d’édition seront également masquées ou désactivées dans le contenu des pages. Le mode Vodacom garde les jours prestés visibles afin de permettre une lecture de présence sans exposer les performances individuelles des hôtesses.

Les éditions BTL seront locales au prototype et persistées dans `localStorage`. Elles n’altèrent pas le fichier source original et pourront être branchées sur la persistance desktop au prochain cycle.
