# Asset packaging without File Storage

The project originally contained two large PNG files in `client/public/assets`, which blocked the managed checkpoint process. The local optimization script in `scripts/optimize-assets.py` keeps reversible backups under `/home/ubuntu/webdev-static-assets/original-vodacom-assets` and rewrites the repository copies with smaller PNG files using bounded dimensions, palette optimization and PNG optimization.

The application keeps the same filenames and paths, so no component or runtime data flow is changed. This is a packaging-only operation; it does not enable full-stack mode, add File Storage, modify Supabase or change the application’s business logic.
