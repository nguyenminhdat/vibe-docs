# Vibe Docs

A lightweight library for **public HTML documents**, built with plain HTML, CSS, JavaScript and GitHub Pages. Search by title/summary, filter by category, open documents, copy stable links and download the original HTML.

Website: https://nguyenminhdat.github.io/vibe-docs/

## Setup on your computer

Install Node.js 20+, Git and GitHub CLI, then run:

```bash
gh auth login --hostname github.com --git-protocol https --web --scopes repo,workflow
gh repo clone nguyenminhdat/vibe-docs
cd vibe-docs
npm link
```

The linked `vdocs` command works from any folder. If global npm linking is unavailable, run `node /absolute/path/to/vibe-docs/bin/vdocs.mjs publish ...` instead.

## Publish with one command

```bash
vdocs publish ./file.html --public
```

`--public` declares that you have reviewed and cleared the content for public sharing. The CLI collects relative CSS, JS modules, images, fonts and other referenced assets, checks common secret patterns, pulls main, updates the manifest, commits only the document bundle and pushes. GitHub Actions deploys automatically.

```bash
vdocs publish ./report-folder --public --slug quarterly-report --title "Quarterly report" --category Reports --description "A public summary."
```

A folder must contain `index.html`. All supported files in that folder are published; use a dedicated, sanitized folder. Folder mode is best for assets loaded dynamically by JavaScript. Single-file mode follows common HTML attributes, srcset, CSS URLs/imports and JS imports; it cannot detect runtime-generated paths. Use relative asset paths; site-root paths like `/assets/foo.css` are rejected because GitHub Pages uses `/vibe-docs/` as its base path. Nested HTML pages and their links are preserved.

Publish again with the same filename or `--slug` to keep the URL:

```bash
vdocs publish ./file.html --public --slug file
```

Do not rename the slug after sharing a link. Existing title/category/description persist unless explicitly changed. Keep the checkout clean and publish from main; concurrent pushes are rejected safely by Git. On a push failure, the publish commit remains local: pull/rebase after reviewing conflicts, then push. Never force-push.

`--no-push` stages a local preview only, without committing or pushing. Run `npm test`, `npm run check`, `npm run build`. `dist/` contains the static site. The HTML download includes the original HTML only; use the repo folder if you need the complete asset bundle. References to adjacent assets still need those assets for offline viewing.

## Public data boundary

Never publish internal company documents, personal data, passwords, tokens, private keys, internal endpoints or licensed content without public distribution rights. The scanner is a heuristic, not a confidentiality classifier: it cannot inspect hidden data in binaries, every encoded secret, or all organizational policies. Manually review **every file and asset** before adding `--public`. The repository and Git history are public; deleting a file does not erase earlier commits. Do not use this project for private documents.

## Pages deployment

The workflow `.github/workflows/pages.yml` runs tests, checks public content, builds and deploys with the official Pages actions. No runtime dependencies or backend.

To create the repo and enable Pages on a fresh account:

```bash
gh repo create nguyenminhdat/vibe-docs --public --source=. --remote=origin
gh api --method POST repos/nguyenminhdat/vibe-docs/pages --field build_type=workflow
git push -u origin main
```

Check the latest deployment: `gh run list --workflow pages.yml`; wait for a run with `gh run watch RUN_ID --exit-status`.

## Project layout

`public/` is the deployed site, `public/documents.json` is the document index, `public/docs/<slug>/` holds bundles, `bin/vdocs.mjs` is the CLI, and `AGENTS.md` gives Codex the publishing protocol.
