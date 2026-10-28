# Vodacom Privilège — directions visuelles

## Approach 1 — Halo Opaline

Un dashboard sombre et précis où le glassmorphism est lisible par couches : surfaces fumées, halos cyan et touches de corail. L’intention est de donner une sensation de cockpit de pilotage premium, sans tomber dans l’esthétique jeu vidéo.

**Probability:** 0.07

## Approach 2 — Atelier Papier Minéral

Une interface claire, presque éditoriale, qui traite les données comme un rapport de direction : papier ivoire, vert bouteille, bleu encre et cartes très aérées. Le ton serait plus institutionnel et plus calme.

**Probability:** 0.04

## Approach 3 — Signal Indigo Calme

Une interface claire-obscure inspirée des instruments de contrôle contemporains : fond bleu nuit texturé, panneaux translucides, rubans d’information et accents lime/cyan. Le système reste lisible et professionnel mais possède une signature visuelle plus distinctive.

**Probability:** 0.02

# Direction retenue — Halo Opaline

## Design Movement

Glassmorphism éditorial, nourri par les interfaces de contrôle aérien et les dashboards SaaS haut de gamme : transparence mesurée, lumière latérale, hiérarchie typographique nette et densité maîtrisée.

## Core Principles

1. La donnée principale doit être lisible en moins de trois secondes, même sur un fond riche.
2. La profondeur vient de la lumière, du blur et du contraste des surfaces, pas d’une accumulation de bordures ou de dégradés.
3. Le filtre de période est une pièce maîtresse : il doit être visible, manipulable et compréhensible avant les graphiques.
4. Chaque interaction doit confirmer le changement d’état sans bruit visuel : transitions courtes, focus visible et feedback contextuel.

## Color Philosophy

Le bleu nuit ancre la confiance et la concentration. Le cyan opalin sert les actions et les volumes positifs. Le corail indique les points de tension ou les données à examiner. Le blanc cassé et le lilas froid assurent les niveaux de lecture sur les surfaces translucides. La couleur de marque est **Opaline Cyan `#8BE8E5`**, utilisée avec retenue pour garder le dashboard sérieux.

## Layout Paradigm

Une coque latérale compacte organise les modules, tandis que le contenu s’étend en ruban vertical : en-tête éditorial, bloc de période pleine largeur, bande de KPI, puis une composition asymétrique de graphiques et de classement. Le filtre de période reste au-dessus de la ligne de flottaison et garde son contexte même quand le reste de la page descend.

## Signature Elements

Les surfaces possèdent un reflet opalin discret en haut à gauche. Les états actifs utilisent une pilule lumineuse et non un simple changement de couleur. Le double curseur de période est rendu comme un rail continu avec des poignées en verre et une ligne de sélection cyan visible.

## Interaction Philosophy

Les boutons de semaines sont des raccourcis de lecture, pas des onglets décoratifs : cliquer sur une semaine repositionne immédiatement les deux poignées du rail et met à jour la phrase de contexte. Les contrôles avancés restent disponibles pour les analyses fines. Les cartes KPI et les graphiques répondent aux mêmes filtres sans rechargement.

## Animation

Les panneaux apparaissent en fondu court et léger, avec un décalage de 40 ms entre les groupes. Les curseurs glissent avec une interpolation douce, les boutons passent à une échelle de 0.98 au clic et les graphiques dessinent leur état sans sauter de hauteur. Les animations sont désactivées ou réduites pour `prefers-reduced-motion`.

## Typography System

Le display utilise **Space Grotesk** pour ses formes techniques et sa présence dans les chiffres. Le texte courant utilise **DM Sans** pour sa lisibilité. Les labels restent en capitales espacées à 11–12 px, les titres de section en 16–20 px, les chiffres KPI en 30–42 px et le titre principal en 34–48 px selon la largeur.

## Brand Essence

Le cockpit local qui transforme les activations Vodacom Privilège en décisions lisibles, pour les équipes terrain et leurs responsables, sans dépendre d’Excel comme interface. **Précis, calme, lumineux.**

## Brand Voice

Les titres sont directs, les CTA sont orientés action et les microcopies expliquent l’effet d’un réglage sans jargon technique.

> « La période est le premier signal. Affinez-la, puis lisez le mouvement. »

> « Voir ce qui a réellement bougé. »

## Wordmark & Logo

Le symbole est un anneau incomplet traversé par une trajectoire cyan : il évoque à la fois le suivi d’une campagne et la boucle de pilotage. Le nom est composé en Space Grotesk SemiBold avec un espacement légèrement augmenté ; le symbole reste indépendant du texte et doit être reconnaissable à petite taille.

## Signature Brand Color

**Opaline Cyan `#8BE8E5`.**

## Style Decisions

- The incomplete-ring trajectory motif recurs in the hero, period control, chart zone and insight strip as the primary product signature.
- Opaline Cyan is reserved for active controls, selected ranges, positive volume and key numerals; coral marks signal or tension states only.
- Surfaces are intentionally differentiated into editorial hero/control glass, primary data glass and quiet secondary glass, all lit from the same top-left opaline source.
- The incomplete-ring trajectory is also a functional selection signal on entry roles and BTL profile identities; it strengthens active state recognition without changing the concise, previously approved login copy.
