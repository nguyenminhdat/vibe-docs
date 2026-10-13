# Codex: Vibe Docs publishing protocol

This repository is PUBLIC and serves https://nguyenminhdat.github.io/vibe-docs/.

When the user requests publication here, complete the work autonomously within that scope. Never publish internal documents, sensitive/personal data, credentials, private URLs, proprietary work or content that has not been cleared for public release. If confidentiality is uncertain, stop and ask the user to sanitize or explicitly identify a public-safe version. Do not add `--public` merely because publication was requested.

1. Use this checkout. Check `gh auth status`, ensure the authenticated account can push `nguyenminhdat/vibe-docs`, and use `main` with a clean working tree. If needed, guide the user through `gh auth login`; never ask for tokens in chat or write credentials into the repo.
2. Read and inspect the exact HTML and **all** assets to be published. Only use a dedicated public-safe bundle. Do not search for or upload unrelated user/company files. The scanner complements this review and cannot replace it.
3. Choose a stable lowercase slug. Reuse an existing slug for updates. Use descriptive title, short description and a category matching the library.
4. Prefer `vdocs publish /path/to/file.html --public --slug stable-name --title "Title" --category Guides --description "Summary"`. For dynamic assets, publish a folder containing index.html. If not installed, use `node bin/vdocs.mjs publish ...` from the repo.
5. The CLI pulls, collects/validates assets, updates the catalog, commits the relevant public files and publishing registry and pushes main. Do not force-push or commit unrelated pending changes. If push fails, inspect the local commit and resolve remote changes without overwriting other work.
6. Verify the newest Actions run belongs to the pushed commit, wait for success and request the live homepage, manifest, document URL and key assets. Check search, category filtering, copy-link and download when browser control is available. Updates must retain the original URL.
7. Return the live document link, repo link and any concrete verification limits. Never report deployment success based only on a successful push.

For changes to the project itself, run `npm test && npm run check && npm run build` before committing. Keep no backend, no database and no unnecessary dependencies. Deploy only `public/` through the build output. Node 20+ is required. Build outputs and temporary files stay ignored.

## Expiring documents

When the user requests a limited publication window, add `--expires-in 7d` (or the requested 1–365 days). Existing expiry is preserved on updates; only explicitly renew it or use `--no-expiry` when requested. Explain that removal runs on a best-effort hourly schedule and cannot erase Git history or downloaded copies. Never describe the public repository as private, or expiry as guaranteed secure deletion. Do not rewrite Git history as part of routine expiry. Use `gh workflow run pages.yml` to trigger an immediate expired-content check when requested.


## Share URLs and visibility

New documents receive a random 128-bit ID; preserve it on every update. `--slug` is the logical identity, not the public URL. New documents default to unlisted. Keep updates unlisted unless the user explicitly requests public catalog listing; add `--listed` for the homepage/search, or `--unlisted` to remove a listing. The CLI maintains root documents.json and generates a listed-only public/documents.json. Never copy the full registry into dist or public. Explain that unlisted is not private: repository content and Git history remain public. If the user needs restricted access or sensitive-document sharing, stop publication to this repository and request an authenticated private-storage solution.
