# WKSEO Portfolio

Static portfolio website for WKSEO.

## Preview Locally

Run a static server from this folder:

```powershell
python -m http.server 8010
```

Then open:

```text
http://127.0.0.1:8010/
```

If `python` is not available on Windows, use any static server that serves this folder as the web root.

## GitHub Pages

This site is built as plain static HTML/CSS/JavaScript.

Recommended GitHub Pages settings:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

The `.nojekyll` file is included so GitHub Pages serves all static assets directly.

## Structure

```text
.
├── index.html
├── projects/
├── assets/
└── PROJECT_TEMPLATE.txt
```

## Internal Handoff

For an internal GitHub or static hosting setup, upload the contents of this folder to the repository root.

Do not upload the broader `New project 5` working folder. That folder contains local backups, cache files, generation scripts, and workspace-specific paths that are not needed for deployment.

## Rights

Projects are presented for portfolio purposes only. Product names, trademarks, imagery, and related materials remain the property of their respective owners.
