# Étude Supabase corrigée — `leads` uniquement

## Périmètre confirmé

La base Supabase est utilisée par une autre application, celle du déploiement des hôtesses. **BTL - Deployment report ne doit lire que `public.leads` pour alimenter le menu Activations.** Les tables `checkins`, `daily_reports`, `assignments`, `targets`, `users`, `shops` et `notifications` appartiennent à l’autre application et restent hors périmètre de lecture, hors périmètre d’écriture et inchangées.

La connexion existante et le reste du comportement de l’application doivent rester identiques. L’intégration future doit donc se limiter à un adaptateur `leads → Activation`, sans remplacer les calculs, les filtres, les vues ou les exports déjà présents. L’import CSV/XLSX reste le repli lorsque Supabase n’est pas disponible.

## Ce qui a été vérifié

Le projet inspecté est **BTL Deployment Tracker - By Eldo**, ref `upkzlppvwckriuidnyvq`. L’inspection du dashboard, du Table Editor, des policies et du SQL Editor a été menée en lecture seule. Aucun enregistrement, policy, table, trigger, fonction, secret ou configuration n’a été modifié.

| Élément | Décision pour cette application |
| --- | --- |
| `public.leads` | **Seule table à lire** pour le journal Activations et les données qui alimentent les calculs existants |
| `superviseur_commentaires_quotidiens` | Table future de commentaires ; lecture par date pour les tooltips, mais pas encore intégrée |
| `superviseur_commentaires_hebdomadaires` | Table future de commentaires ; lecture par semaine/période, mais pas encore intégrée |
| Toutes les autres tables de l’application de déploiement | **Ne pas lire, ne pas écrire, ne pas modifier** |

Les colonnes `id`, `timestamp`, `agent_id`, `shop_id` et `client_name` de `leads` étaient visibles dans le Table Editor. Les autres colonnes doivent être revalidées via une connexion applicative contrôlée avant d’écrire l’adaptateur, car une requête ciblée `information_schema` dans l’éditeur a retourné zéro ligne malgré la présence de la table. Il ne faut pas déduire de ce résultat que la table est vide ou incomplète.

## Logique des commentaires superviseur

Le schema fourni définit deux niveaux indépendants. Le commentaire quotidien est identifié sans ambiguïté par `date`, grâce à la contrainte unique `superviseur_commentaires_quotidiens_date_unique`. Une fois les `leads` chargés et agrégés par date, le dashboard cherchera le commentaire correspondant à chaque date de la courbe de progression et de l’histogramme quotidien. Le tooltip affichera le commentaire de cette date, avec ses métriques de contexte si elles sont disponibles.

Le commentaire hebdomadaire est identifié par `semaine`, avec `debut` et `fin`. Quand l’utilisateur sélectionne un raccourci de semaine dans le double range slider, l’application cherchera le commentaire dont la période correspond au raccourci sélectionné et l’affichera juste sous le slider. Le texte ne doit pas apparaître pour une sélection libre qui ne correspond à aucune semaine enregistrée. Il faut décider avant intégration si `semaine` signifie `S1/S2/S3` de la campagne ou numéro ISO de semaine ; le comportement actuel de l’interface suggère d’utiliser un identifiant de campagne explicite, ou de s’appuyer prioritairement sur `debut` et `fin`.

Les colonnes quantitatives du schema sont des instantanés de contexte superviseur. Elles ne doivent pas remplacer les agrégations déjà calculées par l’application sans comparaison préalable. La règle sûre est : `leads` reste la source du volume et des graphiques ; les tables de commentaires fournissent le texte et, à titre informatif, les métriques saisies par le superviseur.

## Le schema.sql peut-il être exécuté tel quel ?

Le schema est compatible avec PostgreSQL/Supabase sur le plan syntaxique : extension `pgcrypto`, UUID, contraintes `unique`, index, trigger `updated_at` et contrôle `debut <= fin` sont cohérents. Toutefois, **je ne recommande pas de l’exécuter aveuglément dans cette base existante** sans deux vérifications.

Premièrement, `create or replace function public.set_updated_at()` utilise un nom générique. Si une fonction de même signature existe déjà pour l’autre application, elle pourrait être remplacée. Il est plus sûr de renommer cette fonction, par exemple `public.set_superviseur_commentaires_updated_at()`, et de faire pointer uniquement les deux triggers de commentaires vers cette fonction.

Deuxièmement, les lignes RLS sont commentées. Le schema crée les tables mais n’autorise pas automatiquement leur lecture via la Data API. Il faut donc choisir explicitement qui peut lire les commentaires et qui peut les créer ou les modifier. Pour le besoin décrit, la politique future devrait au minimum séparer la lecture dashboard de l’écriture superviseur, sans donner de permission sur les autres tables de l’application de déploiement.

La version recommandée est donc : exécuter les `CREATE TABLE`, index et contraintes après vérification d’existence ; renommer la fonction de trigger pour éviter une collision ; activer RLS sur les deux nouvelles tables ; puis ajouter les policies adaptées à l’authentification réelle. **Aucune de ces opérations n’a été exécutée.**

## Plan d’intégration non destructif

### Étape 1 — Ajouter un adaptateur de lecture `leads`

Lire uniquement `public.leads` et transformer ses colonnes vers le contrat `Activation` actuel. Les valeurs de date, agent, shop, type d’action, catégorie, client et numéro seront normalisées dans un seul module d’adaptation. Les composants de dashboard, le filtre de période, la qualité et les exports ne seront pas réécrits.

### Étape 2 — Conserver un repli local

Le mode local actuel reste disponible. Si la lecture `leads` échoue, renvoie des colonnes incompatibles ou est bloquée par RLS, l’application garde son état vide et laisse l’utilisateur importer CSV/XLSX comme aujourd’hui. Aucun démarrage ne doit dépendre obligatoirement d’un fichier Excel si Supabase fonctionne, mais aucun échec Supabase ne doit casser l’application.

### Étape 3 — Ajouter la lecture des commentaires uniquement après création des deux tables

Une fois les tables créées et leurs policies validées, charger les commentaires quotidiens par une requête limitée aux dates réellement affichées et les commentaires hebdomadaires par `debut`/`fin`. Les commentaires sont des compléments d’affichage ; ils ne modifient pas les lignes de `leads` et ne pilotent pas les KPI.

### Étape 4 — Afficher les commentaires sans changer les autres écrans

Le commentaire quotidien est injecté seulement dans le contenu du tooltip de la courbe de progression et de l’histogramme quotidien. Le commentaire hebdomadaire est injecté seulement sous le double range slider après sélection d’un raccourci de semaine. Activité, Activations, Agents, Shops, Performances & attendance, Qualité, Paramètres et Export conservent leur comportement existant.

### Étape 5 — Valider avant bascule

Comparer le nombre de `leads`, les dates min/max, les catégories, les agents, les shops et les totaux avec un export de référence. Tester une période complète, S1, S2, S3, une sélection libre et une période sans commentaire. Vérifier que la lecture n’accède à aucune table de déploiement autre que `leads` et que l’import local fonctionne toujours en repli.

## État de la correction autorisée maintenant

La seule modification d’application réalisée pour cette demande concerne le menu **Notifications** : son panneau est maintenant positionné dans la fenêtre, contraint à la largeur disponible et fermé par clic extérieur. Le typecheck, le build et le parcours local ont été vérifiés. Les commentaires superviseur ne sont pas implémentés, Supabase n’a pas été modifié et aucun commit GitHub n’a été créé pour cette correction.
