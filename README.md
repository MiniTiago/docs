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

- `releases:check` verifies the exact published versions in `releases/package.json` against npm and records metadata in `.work/available-releases.json`.
- `build:release` resolves the releases once, downloads each npm tarball over HTTPS and verifies its npm SHA-512 integrity.
  - If the tarball contains the configured TypeScript source and compiler config, it uses that source.
  - Else, download the allowlisted GitHub repository's archive at the exact `gitHead` recorded by npm.
  - Missing provenance, non-stable versions, unsafe archives and package name/version mismatches fail the build.
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
- `releases/package.json` contains the SDK release versions maintained by Dependabot.
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
npm run check:release-update
```

Builds check examples, links, assets and site metadata before replacing `dist/`. Failed builds leave the previous output intact. To recheck an existing build:

```sh
npm run check
npm run check:public
```

`npm run verify` runs the slower integration suite using isolated fixtures and multiple builds.

## Publishing

Set **Settings > Pages > Source** to **GitHub Actions** and allow deployments from `main` in the `github-pages` environment.

Dependabot checks npm daily at 00:19 UTC, including weekends, and opens a grouped PR when SDK versions change. The versions in `releases/package.json` are build inputs; user installation examples still use the latest SDK without pins.

The [publishing workflow](.github/workflows/publish.yml):

- Builds and validates the exact proposed SDK releases for pull requests.
- Builds and deploys every change to `main` after checks pass.
- Uses GitHub's temporary credentials, with no stored secrets or SDK repository write access.

The [release-update workflow](.github/workflows/release-update.yml) automatically merges successful Dependabot PRs that change only SDK versions, then dispatches publication. It validates the current head, base and manifest before merging. Privileged code comes from `main`, never the PR. Protect `main` with the required **build** check from **GitHub Actions**, require up-to-date branches, and allow squash merges.

This uses [Dependabot's scheduler](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference), so there is no Actions cron to disable after 60 quiet days. Dependabot watches SDK releases only; action-pin upgrades remain reviewed maintenance. Failed SDK updates still need fixing: an update PR left untouched for over 90 days [can pause Dependabot](https://docs.github.com/en/code-security/reference/supply-chain-security/troubleshoot-dependabot/dependabot-updates-stopped). No release PR means no inactivity pause.

To force a full refresh, use **Actions > Build and deploy SDK documentation > Run workflow** on `main`. Each deployment's SDK versions and source identifiers are listed in [build-manifest.json](https://sieblyio.github.io/docs/build-manifest.json).

If a merge succeeds but publication dispatch fails, rerun the failed release-update job; it can retry dispatch without merging again. Its manual **Run workflow** mode accepts a completed PR run ID for read-only inspection.

## Compatibility checks

Recorded results live in [compatibility/results/](compatibility/results/). Each SDK's compatibility guide shows the tested versions, runtime coverage and limitations. These checks use public mainnet APIs and run manually, separately from docs builds and CI.

For example, to check Bybit on Node.js, Bun and Deno:

```sh
COMPAT_WORK_ROOT="$PWD/tmp/compat" npm run compat -- --sdk bybit --package-version latest --targets node,bun,deno
```

This updates the tracked reports in `compatibility/results/`; review them before committing. Browser and Android checks require an interactive session. See [compatibility/run.mjs](compatibility/run.mjs) for available options and [compatibility/native-config/](compatibility/native-config/) for native setup.
