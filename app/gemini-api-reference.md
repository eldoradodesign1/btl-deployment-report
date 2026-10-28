# Référence API Gemini — intégration directe navigateur

La documentation officielle Gemini consultée le 17 août 2026 indique que l’API Interactions est disponible via `POST https://generativelanguage.googleapis.com/v1beta/interactions`, avec l’en-tête `x-goog-api-key`, un corps incluant `model`, `input`, `system_instruction` et, si nécessaire, `generation_config`. La réponse exposée par les SDK est décrite via `output_text`; l’intégration navigateur utilise donc une extraction tolérante de texte afin de rester compatible avec les formes de réponse REST.

Google recommande d’utiliser une variable d’environnement ou un proxy serveur, et déconseille l’exposition client des clés. Le choix explicite de l’utilisateur est néanmoins une configuration directe navigateur BTL : la clé sera exclusivement stockée dans `localStorage`, n’est jamais incluse dans le code ni dans les bundles publiés, et devra être limitée à l’API Gemini dans Google AI Studio.

Sources officielles :

- https://ai.google.dev/gemini-api/docs/text-generation
- https://ai.google.dev/gemini-api/docs/api-key
