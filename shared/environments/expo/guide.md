---
title: @@SDK@@ React Native Expo API quickstart
description: Use the @@SDK@@ API in a React Native and Expo app. Display public BTC REST and WebSocket prices on iOS and Android.
---

# React Native and Expo quickstart

Build an iOS and Android screen that reads a public @@SYMBOL@@ REST price and subscribes to WebSocket prices with `@@PACKAGE@@`. No API key is needed. @@PRICE_KIND@@

Use Node.js 24 and npm, with an iOS simulator or Android emulator and a matching Expo Go installation. iOS simulators require macOS and Xcode; Android virtual devices can be created with Android Studio or the Android SDK command-line tools. You can also [view the complete @@SDK@@ Expo example on GitHub](@@EXAMPLE_URL@@).

See [Runtime compatibility](/compatibility) for tested versions.

## Create the project

@@PROJECT_SETUP@@

@@APP_FILES@@

## Run on iOS or Android

```sh
npm start
```

Press **i** to open the iOS simulator or **a** to open the Android emulator. Keep Expo Go in the foreground. The screen shows **@@SYMBOL@@ REST price** and **@@SYMBOL@@ WebSocket price**, each followed by a positive price such as `65000.5`.

Tap **Stop stream**. The price component unmounts, its effect cleanup calls `closeAll()`, and the screen shows **Stream stopped. WebSocket closed.** Tap **Start stream** to create a new subscription. Late REST responses are ignored after unmount.

The accepted runtime checks cover public REST, WebSocket updates and cleanup in Expo Go on an iOS simulator and Android emulator. Physical devices, release builds, background recovery and authenticated trading need separate validation for your app.

## Troubleshooting

- @@POLYFILL_TROUBLE@@
- If Metro keeps an old resolution error, stop it and run `npx expo start --clear` from the starter directory.
- If Expo Go rejects the project version, use the Expo Go release that supports the starter's Expo SDK. Check the runtime report for the version used in the recorded checks.
- If price fields stay at **Loading** or **Connecting**, check internet access from the simulator or emulator and inspect the error shown on the screen. Exchange regional restrictions apply there too.
