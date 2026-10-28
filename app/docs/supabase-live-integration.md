# Intégration Supabase exécutée

## Périmètre

L’application lit uniquement `public.leads` pour alimenter le journal Activations et les calculs déjà présents. Elle ne lit pas les tables `checkins`, `daily_reports`, `shops`, `users`, `assignments`, `targets` ou `notifications` de l’application de déploiement des hôtesses.

## Sauvegarde préalable

Un snapshot de l’état précédent l’intégration a été poussé dans le dépôt public avant les changements Supabase avec le message `chore: snapshot before Supabase integration`.

## Tables créées

Les deux seules tables créées sont `superviseur_commentaires_quotidiens` et `superviseur_commentaires_hebdomadaires`. Leurs index, triggers `updated_at`, RLS et policies de lecture ont été exécutés. Aucune table existante n’a été modifiée et aucune donnée de test n’a été insérée.

## Lecture applicative

Le client public utilise la clé anon uniquement et interroge `leads` avec les champs `timestamp`, `agent_id`, `shop_id`, `client_name`, `msisdn`, `action_type` et `bundle_type`. Les champs sont normalisés vers le modèle Activation existant. Si Supabase est indisponible ou si la requête échoue, le jeu local CSV/XLSX reste utilisé.

## Commentaires

Les commentaires quotidiens sont indexés par date et injectés dans les tooltips de la courbe de progression et de l’histogramme quotidien. Les commentaires hebdomadaires sont indexés par paire `debut|fin` et affichés sous le double range slider lorsque la période correspondante est sélectionnée. Les deux tables sont actuellement vides, donc aucun commentaire n’est visible tant qu’un superviseur n’a pas renseigné ces tables.

## Vérifications

Le build `pnpm check && pnpm build` passe. Les accès REST publics retournent `200` pour `leads` et pour les deux tables de commentaires. Le tableau de bord local affiche les données Supabase de `leads`; l’import CSV/XLSX reste le fallback local. Le menu Notifications conserve son positionnement en overlay et sa fermeture au clic extérieur.

## Import du classeur superviseur

Source : `Commentaires_superviseur_activations_v3(1).xlsx`. Le classeur contient 13 lignes quotidiennes du 23/07/2026 au 07/08/2026 et 3 lignes hebdomadaires pour les semaines 1 à 3. Les champs numériques ont été convertis en nombres, les dates en ISO `YYYY-MM-DD`, les cellules `n.c.` en `NULL`, et le résumé court ainsi que le détail terrain ont été conservés dans un seul texte structuré pour chaque commentaire quotidien. L’import idempotent a été exécuté avec succès : les endpoints REST retournent désormais les 13 lignes quotidiennes et les 3 lignes hebdomadaires. La sélection S1 affiche le commentaire hebdomadaire sous le double range slider ; les tooltips de la courbe et de l’histogramme contiennent les commentaires par date.
