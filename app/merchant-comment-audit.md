# Audit des commentaires — campagne Merchant

**Périmètre :** audit en lecture seule du schéma et des enregistrements de commentaires Merchant. Aucune donnée, table ou logique applicative n’a été modifiée.

## Constat de la base

| Niveau | Source | Clé de rattachement | Usage métier correct | Disponibilité constatée |
|---|---|---|---|---|
| BA — clôture quotidienne | `ba_daily_attendance.closing_comment` | `campaign_run_id`, `ba_id`, `activity_date` | Commentaire individuel qu’un BA renseigne lors de la clôture de sa journée | 13 commentaires Merchant, du 24 au 26 août 2026 |
| Transaction | `ba_transactions.comment` | `campaign_run_id`, `ba_id`, `occurred_at`, transaction | Note liée à une transaction précise ; ce n’est pas un commentaire journalier BA | 23 commentaires Merchant, du 24 au 26 août 2026 |
| Superviseur — synthèse de période | `campaign_supervisor_report_comments.comment` | `campaign_code`, `report_kind`, `starts_on`, `ends_on` | Synthèse éditoriale du superviseur sur une période, fondée sur les sources tracées dans `source_comments` | 1 synthèse Merchant `compiled`, du 24 au 27 août 2026, générée par IA et reliant 13 commentaires source |
| Superviseur — héritage Privilège | `superviseur_commentaires_quotidiens` et `superviseur_commentaires_hebdomadaires` | `campaign_code`, date ou période | Commentaires historiques de Vodacom Privilège ; ne doivent pas alimenter Merchant | 15 quotidiens et 3 hebdomadaires, tous pour le code `privilege` |

## Écart identifié dans l’application

Le mapping Merchant actuel construit `dailyComments` en ajoutant, pour une même date, à la fois `ba_daily_attendance.closing_comment` et `ba_transactions.comment`, puis en les concaténant. Cette logique mélange un bilan quotidien BA et une note transactionnelle. Elle ne charge pas encore `campaign_supervisor_report_comments`, donc la synthèse du superviseur existante n’est pas utilisée comme telle.

> Un commentaire de transaction ne doit jamais être promu au rang de commentaire journalier de BA ou de commentaire superviseur.

## Règle de restitution recommandée

| Surface de l’application | Source exclusive | Présentation recommandée |
|---|---|---|
| Tooltip d’une date sur la courbe ou l’histogramme Merchant | `ba_daily_attendance.closing_comment` uniquement | Section « Commentaires de clôture BA » avec le nombre de BA concernés et chaque commentaire attribué à son BA. Aucune note transactionnelle ni texte de superviseur ici. |
| Détail d’une transaction | `ba_transactions.comment` uniquement | Bloc « Note de transaction », attaché à la transaction ouverte. |
| Commentaire sous le filtre de période et dans l’export | `campaign_supervisor_report_comments.comment` uniquement | Bloc distinct « Synthèse superviseur » affiché si `campaign_code = merchant` et si la période du rapport correspond exactement à `starts_on`–`ends_on`. |
| Aucune synthèse superviseur disponible pour la période | Aucune substitution | Afficher l’état « Aucune synthèse superviseur enregistrée pour cette période ». BTL pourra ensuite la créer/générer à partir des commentaires BA de clôture, en stockant les sources dans `source_comments`. |

## Décision à valider avant correction

La correction recommandée est de conserver les deux niveaux de données séparés, d’ajouter les noms des BA aux commentaires de clôture dans les tooltips, et de réserver les synthèses de période à `campaign_supervisor_report_comments`. Elle n’entraîne aucune modification des tables existantes ; elle modifie uniquement le mapping de lecture Merchant et les libellés d’affichage.
