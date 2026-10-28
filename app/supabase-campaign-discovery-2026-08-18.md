# Découverte Supabase — campagnes

Source inspectée le 18 août 2026 : projet Supabase `upkzlppvwckriuidnyvq`, tables `public.campaigns`, `campaign_runs`, `points_of_sale`, `ba_daily_attendance` et `ba_transactions`.

| Campagne | Identifiant | Type | État | Source de reporting |
|---|---|---|---|---|
| Vodacom Privilège | `d0676666-99ad-46fc-9b88-d058097fe69d` | `hostess` | active | `public.leads`, avec agents et shops existants |
| Merchant Educational Campaign | `f0f10615-b31f-4241-8333-b1a51d2d761a` | `brand_ambassador` | active | `campaign_runs`, `ba_transactions`, `ba_daily_attendance`, `points_of_sale` et `users` |

La campagne Merchant comporte une vague active nommée `Merchant Educational Campaign — Vague initiale`, prévue du 19 au 28 août 2026. Au moment de l’inspection, les données opérationnelles contenait deux présences, une transaction d’un montant de quatre et aucun déploiement quotidien. Les objectifs métier configurés sont 15 points de vente et 3 transactions par point de vente.

Les champs utiles de `ba_transactions` sont `campaign_run_id`, `ba_id`, `pos_id`, `transaction_reference`, `amount`, `occurred_at`, `status` et `client_number`. Les champs utiles de `points_of_sale` sont `campaign_id`, `denomination`, `agent_number`, `pool`, `activity` et `mfs_name`.

La lecture applicative doit rester non destructive : aucune table existante ne doit être modifiée par cette intégration.
