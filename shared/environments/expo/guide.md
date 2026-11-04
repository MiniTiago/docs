---
title: @@SDK@@ React Native and Expo quickstart
description: @@SDK@@ SDK. Run a public BTC price and WebSocket screen on iOS and Android with Expo.
---

# React Native and Expo quickstart

Build an iOS and Android screen that reads a public BTC REST price and subscribes to WebSocket prices with `@@PACKAGE@@`. No API key is needed. @@PRICE_KIND@@

## Create the project

Use Node.js with npm and an iOS simulator or Android emulator with a matching Expo Go installation. iOS simulators require macOS and Xcode; Android needs a running virtual device created with Android Studio or the Android SDK command-line tools.

[Download the complete Expo starter](/starters/expo.tar.gz), or create an empty directory and copy every file below. This is a plain Expo app with `index.js` as its entry point.

@@SETUP@@

The SDK installs from `latest`. The starter uses Expo @@EXPO@@, React Native @@RN@@ and React @@NATIVE_REACT@@. @@CONFIG_NOTE@@ See [Runtime compatibility](/compatibility) for the tested OS, Hermes and Expo Go versions.

## Project files

@@FILES@@

## Run on iOS or Android

@@RUN@@

Press **i** to open the iOS simulator or **a** to open the Android emulator. Keep Expo Go in the foreground. The screen shows **BTC REST price** and **BTC WebSocket price**, each followed by a positive price such as `65000.5`.

Tap **Stop stream**. The price component unmounts, its effect cleanup calls `closeAll()`, and the screen shows **Stream stopped. WebSocket closed.** Tap **Start stream** to create a new subscription. Late REST responses are ignored after unmount.

The accepted runtime checks cover public REST, WebSocket updates and cleanup in Expo Go on an iOS simulator and Android emulator. Physical devices, release builds, background recovery and authenticated trading need separate validation for your app.

## Troubleshooting

- @@POLYFILL_TROUBLE@@
- If Metro keeps an old resolution error, stop it and run `npx expo start --clear` from the starter directory.
- If Expo Go rejects the project version, use the Expo Go release that supports the starter's Expo SDK. Check the runtime report for the version used in the recorded checks.
- If price fields stay at **Loading** or **Connecting**, allow the exchange HTTPS and WSS endpoints shown in `market.js` from the simulator or emulator. Exchange regional restrictions apply there too.
