# Validation multi-campagnes — 18 août 2026

## Campagne Merchant Educational Campaign

- Le sélecteur global expose la campagne Merchant et Vodacom Privilège.
- Le dashboard applique le vocabulaire Transactions, Ambassadeurs et Points de vente.
- La rubrique Activité affiche les colonnes Transactions, Ambassadeurs, Points de vente et Cadence.
- Les rubriques Ambassadeurs et Transactions emploient leur vocabulaire Merchant.
- L’aperçu d’export et le classeur XLSX Merchant utilisent les intitulés dédiés.

## Campagne Vodacom Privilège

- Le retour via le sélecteur restaure les libellés Activations, Agents et Shops.
- Les données historiques, les objectifs et les commentaires existants restent disponibles.

## Sécurité et persistance

- Aucun changement de table Supabase n’a été effectué.
- La campagne Merchant reste en lecture seule pour les opérations d’activation.
- La sélection de campagne est conservée localement par navigateur sous `btl-selected-campaign`.
