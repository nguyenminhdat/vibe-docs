# Vibe Docs

A lightweight library for **public HTML documents with random share URLs**, built with plain HTML, CSS, JavaScript and GitHub Pages. Search by title/summary, filter by category, open documents, copy stable links and download the original HTML.

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

`--public` declares that you have reviewed and cleared the content for public sharing. The CLI collects relative CSS, JS modules, images, fonts and other referenced assets, checks common secret patterns, pulls main, updates the publishing registry and listed-only catalog, commits the document bundle and updated registries, and pushes. GitHub Actions deploys automatically.

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

`public/` is the deployed site, `public/documents.json` is the document index, `public/docs/<random-id>/` holds bundles; root `documents.json` is the full publishing registry, `bin/vdocs.mjs` is the CLI, and `AGENTS.md` gives Codex the publishing protocol.

## Optional expiry (public takedown)

```bash
vdocs publish ./file.html --public --expires-in 7d
```

`--expires-in 1d` through `365d` sets an expiry from publication time. Without this flag new documents have no expiry. Updates preserve the existing expiry; passing the flag again explicitly renews it. `--no-expiry` explicitly removes the expiry. The homepage shows the date and filters expired entries.

The Pages workflow checks hourly (at minute 17) and removes expired source bundles and catalog entries, commits the removal, then redeploys in the same workflow. A no-op scheduled check skips build/deployment. GitHub schedules are best-effort: removal is normally at the next hourly check plus deployment time, not guaranteed at the exact expiry minute. GitHub may disable schedules after 60 days of repository inactivity. Check Actions regularly; manual cleanup can be triggered with `gh workflow run pages.yml`. Never rely on this for strict security or regulatory retention deadlines.

This is **public takedown**, not secure erasure or private access. Git history, clones, forks, caches, previous deployment artifacts and downloaded copies may retain the content. HTTPS protects transit, not who can read the document. Use authenticated private storage for sensitive documents; a password added to public HTML/JavaScript is not access control.


## Random URLs and unlisted documents

Each document gets a cryptographically random 128-bit ID (32 hex characters). The ID is generated once using Node crypto and stays the same on updates. `--slug` is a logical key used by the CLI to find an existing document; the slug is no longer the URL.

```bash
# New documents are unlisted by default; add a seven-day expiry if desired.
vdocs publish ./file.html --public --slug my-document --expires-in 7d

# Explicitly include a document in the homepage and search.
vdocs publish ./file.html --public --slug my-document --listed

# Remove it from the homepage without changing its share URL.
vdocs publish ./file.html --public --slug my-document --unlisted
```

Updates preserve visibility unless a flag changes it. Unlisted documents are omitted from the deployed catalog, homepage and search; their HTML receives noindex/nofollow and no-referrer metadata. These are discoverability and referrer precautions, **not access control**. Anyone with the URL can read the content, and the full registry/content remain visible in this public GitHub repository and its history. No password or login is provided by unlisted mode. Never store sensitive documents here.

During migration, built-in listed guide URLs retain legacy redirects. The unlisted Hello Vibe Docs demo has no redirect from its old guessable URL. Its new random URL is the share link. Ordinary updates to it keep that random URL stable.

## Download button from the CLI

`vdocs publish` automatically adds a native **Tải HTML** button to the published page, including unlisted documents. The build also enables it for existing documents. No manual HTML edits are required; local source files stay unchanged. This downloads the published HTML file, including publishing metadata and the download button. Separate CSS/JS/images are not bundled into it; keep those assets for offline use or make your source HTML self-contained.
