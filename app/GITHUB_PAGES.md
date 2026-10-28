# GitHub Pages

The public build starts with an empty local dataset. Users authenticate locally, then import a CSV, XLSX or XLS file from **Import & sources**. Imported records remain in the browser’s local storage and are not sent to a server by this static build.

The deployment workflow builds `dist/public` and publishes it to GitHub Pages. The repository path is configured for `btl-deployment-report`.
