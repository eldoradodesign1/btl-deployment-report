# Diagnostic des données sources — Gemini Merchant

## Observation du 27 août 2026

Les commentaires terrain Merchant à résumer sont enregistrés exclusivement dans `public.ba_daily_attendance.closing_comment`, reliés à un `campaign_run_id` de Merchant et à `activity_date`. Les commentaires observés existent pour les 24, 25 et 26 août 2026, avec plusieurs BA par journée.

La table `public.campaign_supervisor_report_comments` contient les restitutions du superviseur Merchant. Elle utilise le code normalisé `campaign_code = 'merchant'` (et non le slug opérationnel de la table `campaigns`) avec les valeurs `daily`, `weekly` ou `compiled` pour `report_kind`.

## Cause du défaut constaté

Le flux quotidien Merchant lit correctement les clôtures BA. En revanche, le flux hebdomadaire utilisait le contrat générique Vodacom : il recherchait `daily_reports`, ne recevait pas les clôtures `ba_daily_attendance`, puis envoyait à Gemini des métriques ou commentaires incompatibles. Cela explique le texte tronqué et non pertinent observé dans la synthèse « Semaine 1 ».

## Référence de test factuelle

Sur la période Merchant du 24 au 26 août 2026, la base compte 82 transactions, 5 ambassadeurs actifs et 32 POS concernés. Les volumes journaliers sont 17, 36 et 29 transactions, avec un pic de 36 transactions le 25 août. Ces métriques seront transmises avec les commentaires `closing_comment` correspondants, uniquement pour valider le prompt corrigé en brouillon.

## Compatibilité Gemini constatée

Les journaux de la fonction indiquent que `gemini-2.5-flash` et `gemini-2.5-flash-lite` ne sont plus disponibles pour ce projet. La fonction utilise désormais `gemini-3.6-flash` en priorité et `gemini-3.5-flash-lite` comme repli compatible. Elle désactive le budget de raisonnement et rejette toute réponse inférieure au minimum rédactionnel demandé, au lieu de retourner une synthèse tronquée.

## Validation finale

Le repli `gemini-3.5-flash-lite` répond correctement avec une génération limitée à 45 secondes. Le brouillon hebdomadaire Merchant, généré le 27 août 2026 sans persistance, contient 114 mots et restitue les freins réels signalés dans les clôtures BA : POS inactifs ou fermés, démolitions, difficultés réseau et matériel, contraintes de présence MFS et refus marchands. Il ne reprend aucune note individuelle de transaction.

## Correctif attendu

Le flux Merchant doit traiter les périodes quotidiennes et hebdomadaires avec le même jeu de sources : les commentaires `closing_comment` de tous les BA présents dans l’intervalle, associés aux métriques Merchant (transactions, BA actifs, POS couverts). Gemini ne doit jamais lire les notes transactionnelles pour cette synthèse.
