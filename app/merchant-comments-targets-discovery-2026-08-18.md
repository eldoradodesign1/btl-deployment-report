# Sources Merchant pour commentaires et objectifs

## Source inspectée

Projet Supabase `upkzlppvwckriuidnyvq`, schéma `public`, inspection en lecture seule le 18 août 2026.

## Commentaires Merchant

La table `ba_daily_attendance` porte le lien vers `campaign_runs` et contient le champ texte `closing_comment`. La table `ba_pos_visits` contient un champ texte `comment`, mais elle ne dispose actuellement d’aucune ligne. La table `ba_transactions` contient également un champ texte `comment` et comporte une transaction Merchant ; son lien de campagne est `campaign_run_id`.

La table de commentaires superviseur existante est spécifique au reporting Vodacom Privilège : elle n’a pas de clé de campagne. Pour Merchant, l’application doit donc agréger les commentaires opérationnels source par date et recourir à la génération IA locale lorsqu’aucun commentaire n’est disponible.

## Objectifs Merchant

La table `campaigns` expose les objectifs `daily_pos_target` et `transactions_per_pos_target`. Les tables Merchant associent les présences et transactions à un `campaign_run_id`, lui-même associé à la campagne. L’objectif journalier calculable est donc : nombre de points de vente actifs du jour × `transactions_per_pos_target`, avec repli sur `daily_pos_target` si nécessaire.

## Contraintes de sécurité

Toutes les tables inspectées ont RLS actif. Aucune écriture ni modification de schéma n’a été effectuée pendant cette analyse.
