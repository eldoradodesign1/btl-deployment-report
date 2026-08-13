# Functional checks — enriched prototype

The live preview opens on a local login screen with the demonstration credentials prefilled. Submitting the explicit demo account opens the authenticated shell and persists the session in the browser.

The authenticated navigation exposes Dashboard, Activité, Agents, Shops, Activations, Analyse croisée, Qualité des données, Import & sources and Paramètres. The Agents view now shows the real ranking from the 612 source rows. The Activity view shows 14 daily rows, recalculates the average at 43.7, identifies 04 August as the best day with 76 activations and 08 August as the weakest with 10 activations.

The Activations journal exposes 68 pages for the full source, with nine rows per page. Searching for a real agent name reduces the journal to 95 matching rows over 11 pages and keeps the date-sorting control available.

Analyse croisée renders a real Agent × Shop matrix and recomputes immediately when the row dimension is switched to Date. The Date × Shop matrix keeps all 14 active dates and preserves the correct daily totals, including 76 activations on 04 and 05 August.

Qualité des données calculates the reference profile as 612 imported rows, 0 rejected rows, 0 missing dates, 0 missing agents, 0 missing shops, 0 unknown actions, 4 missing phone numbers and 84 duplicate occurrences. Import & sources shows the active local source, a CSV dropzone, recognized separators and a reset action without sending files away from the browser.

Paramètres exposes the daily objective, automatic-export preference, contrast toggle and team label. The team label is editable in the live form and is ready to be committed to local storage with the save control.

Saving the edited team label updates the sidebar profile immediately to `Equipe Nord`, confirming the local settings state is applied. The profile control remains the intended logout action; this path should receive one final click check before delivery.

The explicit top-bar logout control now clears the session and returns the browser to the prefilled local login screen. This completes the login-to-dashboard-to-logout journey without generating an EXE.

The browser import was extended to XLSX/XLS using the same workbook structure. A clean re-upload of `Rapport_Activite_Vodacom_Privilege.xlsx` now previews 612 exploitable rows, the sheet `1. Détail des activations`, ISO dates such as `2026-07-23` and the correct `Opt-in Privilège` action. The hidden file input is reset after preview close so selecting the same file again works.

After scrolling the preview clear of the browser chrome, confirming the workbook returns to Dashboard with the expected 612 activations, 553 Privilège opt-ins, 12 agents and 9 shops. The import confirmation path is therefore functional end to end.

The revised login now presents exactly two avatar choices: Vodacom — Lecture campagne, and BTL — Pilotage complet. The login copy makes the boundary explicit: Vodacom sees days prestés only, while BTL is the editing and control account.

Vodacom login is verified: the sidebar exposes only Dashboard and Activité; Dashboard shows 14 jours prestés instead of performance KPIs, and Activité displays the date/status table without hôtesse, shop, client, action or performance details.

BTL login is verified with the fixed password `BTL2026`. After authentication, the complete sidebar returns: Agents, Shops, Activations, Analyse croisée, Qualité des données, Import & sources and one working Paramètres entry. Dashboard includes the full campaign progression chart.

Agents now shows a mini progression curve on every ranked line and exposes an inline rename field in BTL mode. Renaming the first displayed hôtesse to `Hôtesse Alpha` and blurring the field updates the ranking immediately, confirming the local edit path.

Shops now shows the matching mini progression curves and inline rename fields. Paramètres is represented by one sidebar entry only; the view opens correctly and the native number arrows have been replaced by the custom − / value / + stepper.

Analyse croisée now renders custom dropdown triggers for Lignes and Colonnes. Opening Lignes shows the bespoke glass menu with Agent, Date, Shop, Catégorie and Type d’action; no native select toolkit is exposed.

Dashboard progression is verified with S2: the full campaign curve remains visible, the active zone from 27 juil to 01 août is highlighted, the two handles move to that interval and the filtered volume recalculates to 244 activations.

The BTL Shops view remains editable under the active S2 filter. The first shop field accepted `SHOP NORD` and blur committed the value to the local dataset, while the mini progression curves stayed visible.

The local source was reset after testing, restoring the reference totals of 612 activations, 553 Privilège opt-ins, 12 agents and 9 shops before delivery.

The browser title and visible chrome now read `BTL - Deployment report`. The login window is reduced to the brand, `Choisissez votre avatar`, the Vodacom and BTL avatar cards, and the continue action; the former role descriptions, password helper and performance text are gone.

Vodacom now sees the full sidebar again, including Agents, Shops, Activations, Analyse croisée and Import & sources. Agents and Shops render the mini progression curves across the available row space, show the `Lecture` state and no longer expose the BTL inline rename inputs.

Vodacom Activations opens the searchable read-only journal, Analyse croisée opens the matrix with custom dropdowns, and Import & sources opens the XLSX/CSV dropzone plus reset action. The import path is therefore accessible to Vodacom without exposing BTL rename fields.

The notification bell now opens a local `CENTRE DE SIGNAUX` with a source-ready signal and a quality-control signal. Opening the panel marks the unread dot as read, and the panel explains that signals stay in the browser.

The final minimal login was rechecked: Vodacom opens directly from the avatar choice; BTL reveals only a masked `Code d’accès` field after selecting the avatar, accepts `BTL2026`, and returns to the complete BTL dashboard.

The last dashboard-separation change was rolled back to checkpoint `049d4f12`. The previous hero image is restored. The only subsequent code change forces the existing BTL dashboard sections to render for Vodacom as well: `Ce qui bouge maintenant`, `Le mouvement sur toute la campagne`, cadence quotidienne, signal du jour, répartition terrain, points de vente and lecture rapide. BTL was re-authenticated and its dashboard remained unchanged.

The Export button opens an HTML report preview with the supplied capture-inspired structure: red report header, selected period, KPI grid, campaign progression with the filtered segment highlighted in red, activation donut, hôtesse performance bars and shop performance bars. The full-period preview shows 612 rows; selecting S2 recalculates the report to 244 rows, 221 Privilège opt-ins, 17 Bundles, 6 Roaming and 6 active days. XLSX and PDF actions were triggered from the modal without browser console errors.

The revised XLSX export now contains six styled sheets: Synthèse, Progression campagne, Hôtesses, Shops, Détail filtré and Graphiques. The workbook was inspected after download: the synthesis title is red with Aptos Display 18pt white text, section headers are colored, columns have explicit widths, ranking/detail sheets have autofilters, and the detail sheet contains all 612 filtered rows. The generated PDF is a one-page A4 landscape with the same visible hierarchy as the HTML report, including the KPI grid, progression panel, donut and two performance panels.

The dashboard progression now uses rounded SVG strokes and exposes one hover target per active day with a date and activation-count tooltip. The date-range selector shows floating Début and Fin labels with the selected day above each range handle. The styled exports were also triggered after the S2 filter path was rechecked for period sensitivity.

The scoped cross-analysis change was verified locally without any GitHub commit: the menu and page now read `Performances & attendance`, the defaults are `Lignes = Agent` and `Colonnes = Date`, and missing Agent/Date combinations render as red `Absent` cells instead of `—`. Other navigation and screens were left untouched.
