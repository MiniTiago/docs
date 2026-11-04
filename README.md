# Siebly SDK documentation

The shared TypeDoc and VitePress builder, guides, examples and compatibility harness for the SDK documentation published to GitHub Pages, available at [sieblyio.github.io/docs](https://sieblyio.github.io/docs/).

## Documentation Updates

A huge portion of the docs is codegen directly from the rich types included with each of our SDKs. Most of the remaining custom content is Markdown in `sdks/<sdk>/docs/`.

| Content                                   | Source                                                                                                                  |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| SDK introductions, quickstarts and guides | `sdks/<sdk>/docs/`                                                                                                      |
| Shared guidance                           | [shared/content/](shared/content/)                                                                                      |
| Included code examples                    | `sdks/<sdk>/examples/`                                                                                                  |
| Main documentation landing page           | [scripts/portal.mjs](scripts/portal.mjs)                                                                                |
| Navigation labels and common footer       | [shared/config.mjs](shared/config.mjs)                                                                                  |
| Compatibility page wording                | [shared/content/compatibility/](shared/content/compatibility/) and [compatibility/report.mjs](compatibility/report.mjs) |

---

Notes:

- Follow `<!--@include: ...-->` and `<<< ...` references to edit shared text or examples at their source.
- Keep the includes so each change reaches every page that uses it. Preserve heading anchors such as `{#verify-the-result}` when renaming sections.
- API references come from the released SDK's source comments;
- Installation snippets use package metadata. Edit those inputs for changes to generated content.
- Files under `.work/` and `dist/` are overwritten during builds. Do not edit these directly.

After the initial build below, use `npm run dev` while editing. Refresh the preview after it reports "Preview updated."

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
- `releases/package.json` contains the SDK release versions maintained by release automation.
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
npm run check:release-refresh
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

The [release-update workflow](.github/workflows/release-update.yml) automatically merges successful Dependabot PRs and manual refresh PRs that change only SDK versions, then dispatches publication. It validates the current head, base and manifest before merging. Privileged code comes from `main`, never the PR. Protect `main` with the required **build** check from **GitHub Actions**, require up-to-date branches, and allow squash merges.

This uses [Dependabot's scheduler](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference), so there is no Actions cron to disable after 60 quiet days. Dependabot watches SDK releases only; action-pin upgrades remain reviewed maintenance. Failed SDK updates still need fixing: an update PR left untouched for over 90 days [can pause Dependabot](https://docs.github.com/en/code-security/reference/supply-chain-security/troubleshoot-dependabot/dependabot-updates-stopped). No release PR means no inactivity pause.

To check npm immediately, use **Actions > Refresh SDK releases > Run workflow** on `main`. It checks `latest` for the three allowlisted SDK packages and opens, updates or reuses a bot-owned PR on `automation/refresh-sdk-releases`. Versions must be stable and move forward. The summary links to the PR. If the manifest already matches npm, the action stops without creating a PR, build or deployment. Existing human changes are rejected, and an expected-head update protects concurrent edits. A later release starts a clean proposal from current `main`, even when the previous refresh branch remains after merging.

The action locates the exact token-created `pull_request` run for the bot PR and validates its author, repository, base, head, manifest-only diff and increasing SDK versions before approving it. It waits up to 15 minutes for that real PR build, then calls the shared guarded merger directly from trusted `main` code. This avoids both redundant branch builds and reliance on a suppressed follow-up event. A dispatched branch build does not satisfy GitHub's native required-check gate. The PR build remains read-only, and merging still requires the protected **build** check and current main ancestry. The merger then dispatches publication on `main`. No new secrets or protection changes are required. An approval permission failure reports the exact run URL and stops without a fallback.


To rebuild and publish the versions already recorded in `releases/package.json`, use **Actions > Build and deploy SDK documentation > Run workflow** on `main`. This does not check npm for newer versions. Each deployment's SDK versions and source identifiers are listed in [build-manifest.json](https://sieblyio.github.io/docs/build-manifest.json).

If refresh orchestration stops before merging, rerun **Refresh SDK releases**; it reuses the PR and its real validation run. If refresh merges successfully but publication dispatch fails, use **Build and deploy SDK documentation > Run workflow** on `main` to publish the recorded versions. For Dependabot, rerunning a failed release-update job can retry publication without merging again. The release-update manual mode accepts a completed PR run ID for read-only inspection.

## Analytics and Search Console

Indexable builds automatically load the same GA4 web stream as siebly.io (`G-KQWZYX9C7R`) on the portal, SDK pages and error pages. Preview builds omit the tag; a production build served on another origin also does not send traffic. The docs do not add a consent prompt.

The stream's enhanced measurement setting **Page views > Page changes based on browser history events** must remain enabled. It measures VitePress navigation without additional manual pageview events.

To compare the sites in GA4 reports or Explorations, filter by **Hostname**:

- Docs: `sieblyio.github.io`, with **Page path** beginning `/docs/`.
- Main website: `siebly.io` (include `www.siebly.io` if used).

Docs events also carry the built-in **Content group** value `Documentation`. No custom dimension is needed. In the shared stream's **Configure tag settings > Configure your domains**, include `siebly.io` and `sieblyio.github.io` to preserve journeys between the sites.

### Interaction events

`shared/public/analytics.js` owns event names, parameter allowlisting, context and the GA transport. `shared/site-services.mjs` supplies its build settings from the existing SDK catalogue. The shared theme connects the supported VitePress router hooks to that controller. Portal pages load the same controller. New pages and SDKs inherit this integration without page-specific tracking.

| Event | Meaning |
| --- | --- |
| `content_copy` | A code or install-command copy operation finished. `copy_result` is `success` or `failure`; count only successes for adoption intent. |
| `content_select` | An SDK, code tab or search result was selected. `selection_type` is `exchange`, `code_tab` or `search_result`. |
| `navigation_click` | A link was activated, including middle clicks and keyboard activation. Destinations distinguish guides, references, tutorials, sections, packages, repositories and support. This records intent, not arrival. |
| `docs_search` | A local-search query settled for 600 ms, or its result was selected earlier. `search_result` is `results` or `no_results`. |
| `page_not_found` | A missing page was shown, once per missing-page arrival. |

The names and meanings of copy, selection and navigation events match the main website's interaction contract. Successful copying uses the actual clipboard operation outcome, including the browser fallback's boolean result. Analytics errors do not change the copy result. Ordinary text selection and system clipboard shortcuts are outside the copy-button measurement.

All events and pageviews receive `exchange` from the SDK catalogue ID (`all` on the portal), plus `page_family`: `docs_portal`, `docs_overview`, `docs_quickstart`, `docs_guide`, `docs_reference`, `docs_compatibility` or `docs_not_found`. Supported router hooks configure destination context before the stream's automatic history pageview, using Google's documented [`update: true` configuration](https://developers.google.com/analytics/devguides/collection/ga4/reference/config#update) to merge the parameters without sending another initial pageview. Custom parameters use stream configuration because global `set` values do not reliably propagate to automatic GA events. Interaction events retain their source page until the destination renders. No manual pageview is emitted.

Copy context includes `section_id`, `content_id` and `content_type` (`code` or `install_command`). A snippet's ID combines its nearest heading anchor and code-block position in that section. Code-group selections use the heading and group position, with the source-defined tab title in `option_id`. These positional IDs can change when blocks are inserted; interpret them with the page and deployment period. There are no content hashes or independently maintained SDK lists.

Search collects outcomes and destinations, never the entered term. `search_result_count` means the number of rendered results, capped at 16 by VitePress; it is not the total number of matching documents. `search_result_position` is the selected result's one-based position. Repeated settled refinements count as separate searches, so use sessions or users when measuring whether a visitor found a result. A result selection also emits its normal navigation event; do not add those event totals together.

Payloads exclude copied text, search terms, URL queries and arbitrary external URL paths. The six documented UTM campaign fields are passed separately as GA campaign parameters so clean page URLs preserve campaign attribution. External destinations carry their host and category; known SDK destinations and first-party pages also carry the destination path. Section links carry an existing heading ID. Custom events use `send_to` for the production stream so another destination on the shared Google tag cannot receive them accidentally. Preview origins cannot install the interaction handlers or collect events.

The main property's registered event dimensions cover `page_family`, `section_id`, `exchange`, `content_id`, `content_type`, `copy_result`, `selection_type`, `option_id`, destination fields and `search_result`. Optional custom metrics `search_result_count` and `search_result_position` describe the rendered list and selection position.

Open the [Documentation overview](https://analytics.google.com/analytics/web/#/a369918626p506928453/reports/dashboard?collectionId=16272088440&r=16272142083), also available under **Reports > Documentation > SDK usage**. The published collection includes SDK engagement, successful copies, search outcomes, selections, navigation, copy failures and missing pages. Each report and overview card filters to the docs hostname/path and production stream; interaction reports also select the relevant event and outcome. New fields can take 24–48 hours to appear. The default last-28-days range excludes today, so include today when checking the rollout.

Useful saved reports compare views and engaged sessions across SDKs, successful copies by page/snippet, search results and selections, destination categories, and missing pages or failed copies. Filter to **Content group = Documentation**, the production stream and docs hostname/path. Use users or sessions with at least one successful copy for conversion rates; repeated copies are not additional adopters. Copy and package-link activity indicate adoption intent, not confirmed installation or successful SDK/API usage. Collection starts when this instrumentation is deployed and cannot recover earlier interactions.

`npm run check:site-tests` covers initialization, context changes, clipboard outcomes, navigation, search and payload exclusion. Browser verification must route the production origin to a local build and intercept Google requests so test interactions do not enter production reports.

The Google verification file is maintained unchanged in `shared/verification/` and copied to the site's root. After deployment, verify the URL-prefix property `https://sieblyio.github.io/docs/` in Search Console and submit `https://sieblyio.github.io/docs/sitemap.xml`. Keep the verification file in subsequent deployments.

## Compatibility checks

Recorded results live in [compatibility/results/](compatibility/results/). Each SDK's compatibility guide shows the tested versions, runtime coverage and limitations. These checks use public mainnet APIs and run manually, separately from docs builds and CI.

For example, to check Bybit on Node.js, Bun and Deno:

```sh
COMPAT_WORK_ROOT="$PWD/tmp/compat" npm run compat -- --sdk bybit --package-version latest --targets node,bun,deno
```

This updates the tracked reports in `compatibility/results/`; review them before committing. Browser and Android checks require an interactive session. See [compatibility/run.mjs](compatibility/run.mjs) for available options and [compatibility/native-config/](compatibility/native-config/) for native setup.

For iOS runtime checks, prepare the published release sources with `npm run build:release`, boot an iOS simulator and install Expo Go for the Expo SDK version in `compatibility/config.mjs`. The simulator app must support that Expo SDK; a Metro bundle alone does not verify runtime execution. Run:

```sh
xcrun simctl list devices booted
COMPAT_IOS_UDID="<booted-device-UDID>" npm run compat -- --sdk hyperliquid --targets react-native-ios --keep
COMPAT_IOS_UDID="<booted-device-UDID>" npm run compat -- --sdk bybit --targets react-native-ios,react-native-ios-configured --keep
COMPAT_IOS_UDID="<booted-device-UDID>" npm run compat -- --sdk binance --targets react-native-ios,react-native-ios-configured --keep
```

`COMPAT_IOS_UDID` is optional when exactly one simulator is booted. Accept Expo Go's first launch prompt if shown. The app has five minutes to load its development bundle and return results; set `COMPAT_NATIVE_TIMEOUT_MS` to change that bound (1,000 to 900,000 ms). The live WebSocket check retains its separate 25-second deadline. Run SDKs sequentially because the runner owns `tmp/compat.lock` and Expo Go displays one consumer at a time. Default Bybit and Binance Metro builds may fail; the configured targets apply the documented consumer polyfills. Successful runtime reports identify the simulator, Expo Go version and run ID, with raw results and screenshots in the printed evidence directory. `--keep` retains the generated consumers under `tmp/` for inspection.

### Environment quickstarts

The Bun, Deno, Vite, Next.js server and Expo guides are generated by
`scripts/environments.mjs`. Edit runnable app files and guide prose in
`shared/environments/`. The exchange methods come from
`compatibility/adapters/`; Vite and Metro recipes use the same files as the
compatibility checks. SDK dependencies install from `latest`; recorded tested
versions remain in the runtime compatibility report.

Every guide displays its complete project and links to a generated starter
archive. Publication validates each archive against an explicit file list and
its maintained contents, including nested Route Handler files. Local caches,
dependencies and credentials cannot be added to the downloads. Run
`npm run check:content` to check all generated guides, imports and archive guards.
