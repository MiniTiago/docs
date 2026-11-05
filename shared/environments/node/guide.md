---
title: @@SDK@@ Node.js JavaScript API quickstart
description: Use the @@SDK@@ API in Node.js with plain JavaScript. Create a REST price script, then optionally subscribe to WebSocket prices with import or require.
---

# Node.js / JavaScript quickstart

Read a public @@SYMBOL@@ price with `@@PACKAGE@@`. No API key or TypeScript compiler is needed. @@PRICE_KIND@@

Use Node.js 24 and npm. If you prefer to start from a finished project, [view the complete @@SDK@@ Node.js example on GitHub](@@EXAMPLE_URL@@).

## Create the project

@@PROJECT_SETUP@@

`npm init` creates `package.json`; `npm install` adds the current SDK release. You do not need to edit the package file for these examples.

## Read a price

@@PRICE_FILES@@

Run the file you created:

@@PRICE_RUN@@

The result is a price string, for example:

```text
@@SYMBOL@@ REST price: 65000.5
```

## Stream a price (optional)

@@STREAM_FILES@@

Run the matching file:

@@STREAM_RUN@@

The script prints the first update, closes its WebSocket and exits. SDK connection logs may also appear:

```text
@@SYMBOL@@ WebSocket price: 65001.2
WebSocket closed.
```

## Troubleshooting

- Use `.mjs` for `import` and `.cjs` for `require`. These [Node.js module rules](https://nodejs.org/api/packages.html#packagejson-and-file-extensions) let you choose either format without configuring `"type"` in `package.json`.
- If the SDK cannot be resolved, run the install command from the directory containing your program and `package.json`.
- A failed request or no update within 30 seconds needs a network check. Exchange regional restrictions apply.
- See [Runtime compatibility](/compatibility) for tested versions and [WebSocket subscriptions](/guides/websockets) for continuous subscriptions.
