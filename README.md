# Siebly SDK documentation

The shared TypeDoc and VitePress builder, guides, examples and compatibility harness for the SDK documentation published to GitHub Pages, available at [sieblyio.github.io/docs](https://sieblyio.github.io/docs/).

## Build & Release

Use Node.js 22 or newer.

```sh
npm ci --ignore-scripts
npm run releases:check
DOCS_SITE_URL=https://sieblyio.github.io/docs/ DOCS_INDEXABLE=1 npm run build:release
```

---

- `releases:check` resolves npm's current `latest` releases and records exact metadata in `.work/available-releases.json`.
- `build:release` resolves the releases once, downloads each npm tarball over HTTPS and verifies its npm SHA-512 integrity.
  - If the tarball contains the configured TypeScript source and compiler config, it uses that source.
  - Else, download the allowlisted GitHub repository's archive at the exact `gitHead` recorded by npm.
  - Missing provenance, prereleases tagged as latest, unsafe archives and package name/version mismatches fail the build.
  - No guessed tag or branch is used.

---

To build the release records already resolved by `releases:check`:

```sh
DOCS_RELEASE_RECORD=.work/available-releases.json DOCS_SITE_URL=https://sieblyio.github.io/docs/ DOCS_INDEXABLE=1 npm run build:release
```

### Reusing prepared sources

After sources have been prepared, `npm run build` reuses them. `npm run build -- --sdk bybit` rebuilds one SDK while retaining the other accepted outputs. Changing URL or indexing mode requires a full build.

### Dev / Staging

- `npm run preview` serves generated output at http://localhost:4173/;
- `npm run dev` watches authored content and prepared sources without rerunning compatibility checks.

---

## Architecture

- `shared/` theme, branding, common config, shared Markdown fragments.
- `sdks/<id>/` SDK config, maintained guides, checked TypeScript examples.
- `scripts/` generates the reference, checks examples and assembles the website.
- `compatibility/` real-exchange runtime harness and sanitized recorded results.
- `.work/`, `tmp/`, `verification/`, `dist/` disposable, ignored build data.

Edit guides and examples in `sdks/` and shared text in `shared/content/`. API references are generated from each release's public TypeScript exports and comments.

## Checks

Run the content and builder tests:

```sh
npm run check:content
npm run compat:check-report
npm run check:releases
npm run check:ci
npm run check:site-tests
```

Builds check examples, links, assets and site metadata before replacing `dist/`. Failed builds leave the previous output intact. To recheck an existing build:

```sh
npm run check
npm run check:public
```

`npm run verify` runs the slower integration suite using isolated fixtures and multiple builds.

## Publishing

Set **Settings > Pages > Source** to **GitHub Actions** and allow deployments from `main` in the `github-pages` environment.

The [publishing workflow](.github/workflows/publish.yml):

- Builds and validates all SDKs for pull requests.
- Deploys relevant changes merged to `main` after checks pass.
- Checks every six hours for new npm releases or unpublished documentation changes, deploying if needed.

To force a full refresh, use **Actions > Build and deploy SDK documentation > Run workflow** on `main`. Each deployment's SDK versions and source identifiers are listed in [build-manifest.json](https://sieblyio.github.io/docs/build-manifest.json).

## Compatibility checks

Recorded results live in [compatibility/results/](compatibility/results/). Each SDK's compatibility guide shows the tested versions, runtime coverage and limitations. These checks use public mainnet APIs and run manually, separately from docs builds and CI.

For example, to check Bybit on Node.js, Bun and Deno:

```sh
COMPAT_WORK_ROOT="$PWD/tmp/compat" npm run compat -- --sdk bybit --package-version latest --targets node,bun,deno
```

This updates the tracked reports in `compatibility/results/`; review them before committing. Browser and Android checks require an interactive session. See [compatibility/run.mjs](compatibility/run.mjs) for available options and [compatibility/native-config/](compatibility/native-config/) for native setup.
