# Validation multi-campagnes — 18 août 2026

La campagne **Merchant Educational Campaign** s’affiche depuis le sélecteur de campagne intégré au contexte de la sidebar. Les libellés adaptés aux transactions, ambassadeurs et points de vente sont visibles, le commentaire quotidien Supabase « test » est lu dans le dashboard, et son commentaire hebdomadaire est repris dans l’aperçu d’export.

Sous le rôle BTL, les deux switches d’objectifs Merchant ont été contrôlés. Leur état est isolé par identifiant de campagne dans le stockage local du navigateur, et les deux vues d’objectifs sont rendues actives après rechargement. Sous Vodacom, les contrôles restent en lecture seule.

Le retour de Merchant vers Vodacom Privilège restaure les données de leads, les libellés Activations/Agents/Shops, les commentaires existants et les objectifs partagés. L’aperçu Merchant ainsi qu’un fichier XLSX Merchant ont été générés avec succès.
