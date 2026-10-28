# Référence d’implémentation — Gemini sécurisé via Supabase

L’API Gemini ne doit pas être appelée depuis le navigateur lorsque la clé doit rester confidentielle. La clé doit être ajoutée comme secret de projet, ici sous le nom `GEMINI_API_KEY`, puis lue uniquement par une Edge Function au moyen de `Deno.env.get("GEMINI_API_KEY")`.

L’Edge Function peut utiliser les secrets Supabase intégrés côté serveur afin de lire et d’écrire les tables de commentaires. Les clés de type `SUPABASE_SERVICE_ROLE_KEY` ne doivent jamais être envoyées au navigateur ; elles servent exclusivement à l’exécution de la fonction.

La documentation Supabase indique que les Edge Functions sont adaptées aux tâches d’IA légères et aux intégrations tierces, et que les secrets de production peuvent être configurés depuis la page Edge Functions → Secrets du tableau de bord.

Sources officielles :

- https://supabase.com/docs/guides/functions/secrets
- https://supabase.com/docs/guides/functions

## Déploiement réalisé

La fonction `generate-supervisor-comment` est déployée dans le projet `upkzlppvwckriuidnyvq` à l’adresse suivante :

`https://upkzlppvwckriuidnyvq.supabase.co/functions/v1/generate-supervisor-comment`

Elle est configurée avec la vérification JWT legacy activée ; l’appel public de l’application devra donc transmettre les en-têtes `Authorization: Bearer <publishable key>` et `apikey: <publishable key>`.

Le 17 août 2026, la page Supabase **Edge Functions → Secrets** du projet était accessible et ne contenait encore aucun secret personnalisé. Elle permet d’ajouter une valeur chiffrée nommée `GEMINI_API_KEY`, qui deviendra disponible immédiatement pour la fonction sans être renvoyée au navigateur.

## Repli Gemini renforcé

Source officielle : https://ai.google.dev/gemini-api/docs/models

- `gemini-2.5-flash-lite` est utilisé en premier pour les synthèses concises.
- `gemini-2.5-flash` est le deuxième choix.
- `gemini-3.5-flash-lite` est le dernier repli configuré.
- `gemini-2.0-flash` est retiré de la liste, car il n’est plus disponible.

## Validation réelle

Le 17 août 2026, une requête `regenerate` quotidienne pour le 30 juillet 2026 a renvoyé HTTP 200 avec `generated: true`. La fonction a créé une synthèse Gemini et l’a persistée dans `superviseur_commentaires_quotidiens`. L’application BTL a ensuite relu le nouveau commentaire depuis Supabase, sans clé Gemini stockée localement.
