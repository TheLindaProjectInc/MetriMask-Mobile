# MetriMask Mobile — Build Guide

MetriMask is a React Native 0.86 (New Architecture / Fabric) wallet app for the Metrix
blockchain. This guide covers building and running the **Android** build from this
repository as it stands today. iOS build instructions will be added later — the `ios/`
folder and `Gemfile`/`.ruby-version` are present in the repo for that future work, but
are not covered here.

Unlike some older React Native project templates, this repository is a complete,
checked-in project — `android/`, `ios/`, `src/`, and all config files already exist in
git. You do **not** need to run `react-native init` or manually patch anything in
`node_modules/`; dependency patches are applied automatically (see
[Patched dependencies](#patched-dependencies) below).



## Prerequisites

| Tool | Required version | Notes |
|---|---|---|
| Node.js | `^20.19.4`, `^22.13.0`, `^24.3.0`, or `>=25.0.0` | See `engines` in `package.json`. Use `nvm`/`nvm-windows` if you need to switch versions per-project. |
| JDK | 17 | Required by the Android Gradle Plugin. Make sure **`JAVA_HOME`** points at a JDK 17 install — having a different `java` earlier on your `PATH` (common if another JDK was installed system-wide) is fine as long as `JAVA_HOME` itself is correct, since Gradle prefers `JAVA_HOME`. |
| Android SDK | compileSdk/targetSdk 36, buildTools 36.0.0, NDK 27.1.12297006 | Installed automatically by Gradle/Android Studio's SDK manager the first time you build, as long as the SDK licenses are accepted (`sdkmanager --licenses`). |
| Watchman | latest | Optional but recommended on macOS/Linux for faster Metro file-watching. Not available/needed on Windows. |
| Git | any recent version | |

Run `npx react-native doctor` after installing the above — it's the fastest way to catch
environment problems (wrong Node/JDK version, missing SDK components, misconfigured
`ANDROID_HOME`, etc.) before you spend time chasing a build failure that isn't actually
about this project's code.



## Getting started

```
git clone <this repo>
cd MetriMask-Mobile
npm install
```

`npm install` automatically runs `patch-package` via the `postinstall` script — see
[Patched dependencies](#patched-dependencies).



## Running a debug build

**Quickest path** (starts Metro and builds/installs/launches in one step):

```
npm run android
```

**Manual path** (recommended when you want more control — e.g. multiple devices/
emulators connected, or you want to watch the Metro logs in their own terminal):

```
# Terminal 1 — start the Metro bundler
npx react-native start

# Terminal 2 — build and install
cd android
./gradlew assembleDebug
cd ..
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

If you're targeting a **physical device over USB** rather than an emulator, Metro's dev
server needs to be reachable from the device:

```
adb reverse tcp:8081 tcp:8081
adb shell am start -n com.metrimask_mobile/.MainActivity
```

If more than one device/emulator is attached, target a specific one everywhere with
`adb -s <device-serial>` (list serials with `adb devices -l`).



## Release builds

Release builds need a signing keystore, which is deliberately **not** checked into git.

1. Generate a release keystore if you don't already have one:
   ```
   keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```
   Place the resulting file at `android/app/my-release-key.keystore` (or update the
   `storeFile` value below to point wherever you keep it).

2. Copy `android/keystore.properties.example` to `android/keystore.properties` and fill
   in the real values:
   ```
   storeFile=my-release-key.keystore
   keyAlias=my-key-alias
   storePassword=REPLACE_ME
   keyPassword=REPLACE_ME
   ```
   `android/keystore.properties` is gitignored — it's read by `android/app/build.gradle`
   at build time via `keystoreProperties['...']` and never gets committed. **Keep this
   file and the keystore itself backed up somewhere safe outside the repo** — losing the
   release keystore means you can no longer publish updates to an app already
   distributed under it.

3. Build:
   ```
   cd android
   ./gradlew assembleRelease
   ```
   Output APK: `android/app/build/outputs/apk/release/app-release.apk`

4. Verify the signature (don't use `jarsigner -verify` — it only understands the legacy
   v1/JAR signing scheme and will incorrectly report "jar is unsigned" for a
   v2/v3-signed APK):
   ```
   <Android SDK>/build-tools/36.0.0/apksigner verify --verbose android/app/build/outputs/apk/release/app-release.apk
   ```



## Patched dependencies

A few dependencies need small fixes that upstream hasn't merged; these live in
`patches/` as `patch-package` diffs and are applied automatically by the `postinstall`
script every time you run `npm install`. You should never need to hand-edit anything
under `node_modules/` — if a patch needs updating, edit the dependency in
`node_modules/`, then regenerate it with `npx patch-package <package-name>` and commit
the updated `.patch` file.



## Tips for a clean build across different systems

- **Windows: long path failures during the native build.** `android/app/build.gradle`
  already pins CMake to a version bundling ninja ≥1.11 to work around this — ninja
  1.10.x (the AGP default) hits the classic 260-character `MAX_PATH` limit when building
  autolinked Fabric codegen libraries (e.g. `react-native-gesture-handler`), even with
  Windows' "Enable Win32 long paths" policy turned on, because it doesn't use
  `\\?\`-prefixed paths internally. If you still hit `MAX_PATH`-related errors, also
  turn on Windows' long-paths group policy (`gpedit.msc` →
  Computer Configuration → Administrative Templates → System → Filesystem →
  "Enable Win32 long paths") and keep the repo close to a drive root (e.g. `D:\repos\…`
  rather than deeply nested folders).

- **Windows + Git Bash + adb: paths silently get mangled.** If you drive `adb shell`
  from Git Bash (MSYS), any argument that looks like an absolute Unix path (e.g.
  `/sdcard/screen.png`) gets rewritten into a Windows path before adb ever sees it,
  which breaks on-device commands in ways that don't look like a path problem at all.
  Prefix the command with `MSYS_NO_PATHCONV=1` to stop this, e.g.
  `MSYS_NO_PATHCONV=1 adb shell screencap -p /sdcard/screen.png`.

- **Emulator: `INSTALL_FAILED_INSUFFICIENT_STORAGE` on `adb install -r`.** AVDs ship
  with a small userdata partition by default. `adb shell pm trim-caches 500M` or
  `adb uninstall com.metrimask_mobile` (note: this wipes the app's local data — only
  do this if you're OK losing whatever test wallet/state is on that emulator) before
  reinstalling usually clears enough space.

- **Physical device: `adb devices` shows `unauthorized`.** Approve the "Allow USB
  debugging?" prompt on the device itself (check "always allow from this computer" to
  avoid repeating this every time you reconnect).

- **Physical device: `adb shell input` fails with `SecurityException:
  ... INJECT_EVENTS permission`.** Some OEM Android skins (observed on Xiaomi/MIUI)
  block adb's synthetic input injection by default. Enable Developer Options →
  "USB debugging (Security settings)" on the device. This is only needed for
  driving the UI programmatically via `adb shell input`; normal touchscreen use and
  installing/running the app don't need it.

- **16KB page size (Android 15+ / newer devices).** This app is already built against
  React Native 0.86, whose bundled native libraries ship 16KB-page-aligned. No extra
  `packagingOptions` workarounds should be necessary; if you see a 16KB compatibility
  warning at install time on a real device, check `readelf -d`/`llvm-readelf -l` on the
  built `.so` files under `lib/arm64-v8a/` for their `p_align` before reaching for a
  workaround — it usually means a dependency was added or updated with an
  older/non-conforming prebuilt binary.

- **After changing native config** (`android/app/build.gradle`,
  `AndroidManifest.xml`, adding a new native dependency), do a clean rebuild rather
  than an incremental one if something doesn't take effect: `cd android && ./gradlew
  clean && cd .. && npm run android`.
