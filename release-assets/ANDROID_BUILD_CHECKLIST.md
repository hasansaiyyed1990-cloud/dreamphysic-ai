# DreamPhysic AI — Android Release Build Checklist

Production APK build, signing, release, and direct-install guide for **DreamPhysic AI**.

Locked brand theme used by every asset in this folder:

| Token | Value |
| --- | --- |
| Obsidian background | `#05070c` |
| Teal | `#2dd4bf` |
| Purple | `#a855f7` |
| Gold | `#fbbf24` |

Assets in this folder:

| File | Size | Use |
| --- | --- | --- |
| `icon.svg` | 1024×1024 | Full app icon (dumbbell + gold pulse, teal→purple gradient, no text) |
| `icon-foreground.svg` | 1024×1024 | Android adaptive icon foreground (emblem inside the inner 66% safe zone, transparent) |
| `icon-background.svg` | 1024×1024 | Android adaptive icon background (obsidian + subtle glow) |
| `splash.svg` | 2732×2732 | Capacitor splash screen source |

---

## 0. Prerequisites

- Node.js 18+ and npm
- JDK 17 (the JDK bundled with Android Studio works)
- Android Studio with the Android SDK installed, `ANDROID_HOME` set
- A backed-up release keystore (step 3) — **lose it and you can never ship an update to the same app**

Run every command below from the Capacitor project root (`frontend/`), unless a step says otherwise.

> **Current repo blocker (checked 2026-11-26):** the repo does not yet contain `frontend/package.json`, a Capacitor config, `frontend/index.html`, or an `android/` project, so the build commands below will fail today. A separate frontend setup must first add a working web project (`package.json` with a `build` script, an HTML entry, and a Capacitor config whose `webDir` matches the build output, usually `dist`) plus the Capacitor packages (`@capacitor/core`, `@capacitor/android`, and `@capacitor/cli` as a dev dependency). This checklist covers the release build once that setup exists; it does not create the frontend setup.

Verify the setup before step 1 — stop and fix the frontend setup if any check fails:

```bash
test -f package.json && echo "package.json OK"
ls capacitor.config.ts capacitor.config.json capacitor.config.js 2>/dev/null
test -f index.html && echo "index.html OK"
```

---

## 1. Bump the version (every release)

In `android/app/build.gradle`, increase both values. `versionCode` must go up on **every** release or Android will refuse the update; `versionName` is what users and `/api/app-version` see.

```groovy
defaultConfig {
    versionCode 2          // +1 every release
    versionName "1.1.0"    // user-facing version
}
```

Keep this `versionName` in sync with `APP_LATEST_VERSION` in step 6.

---

## 2. Generate launcher icons and splash screens

`@capacitor/assets` reads PNG sources, so export the SVGs in this folder to PNG first. The commands below use `rsvg-convert` (install it with `brew install librsvg` on macOS or `sudo apt install librsvg2-bin` on Ubuntu/Debian) and run from `frontend/`, so the SVGs are at `../release-assets/`:

```bash
mkdir -p assets
rsvg-convert -w 1024 -h 1024 ../release-assets/icon.svg            -o assets/icon-only.png
rsvg-convert -w 1024 -h 1024 ../release-assets/icon-foreground.svg -o assets/icon-foreground.png
rsvg-convert -w 1024 -h 1024 ../release-assets/icon-background.svg -o assets/icon-background.png
rsvg-convert -w 2732 -h 2732 ../release-assets/splash.svg          -o assets/splash.png
cp assets/splash.png assets/splash-dark.png

npm install -D @capacitor/assets
npx capacitor-assets generate --android
```

This writes every Android density (mipmap buckets + adaptive icon XML) and the splash drawables into `android/app/src/main/res/`.

---

## 3. Create the release keystore (one time only)

```bash
keytool -genkeypair -v \
  -keystore dreamphysic-release.jks \
  -alias dreamphysic \
  -keyalg RSA -keysize 2048 -validity 10000
```

- `*.jks` is already in `.gitignore` — never commit the keystore or its passwords.
- Back up `dreamphysic-release.jks` plus both passwords in a password manager / offline drive.
- `keystore.properties` is **not** covered by the current `.gitignore`, so ignore it explicitly before creating it, then verify git ignores it:

```bash
printf '\nfrontend/android/keystore.properties\n' >> ../.gitignore
git -C .. check-ignore -v frontend/android/keystore.properties
```

- Put signing credentials in the local `android/keystore.properties`. The Gradle snippet below resolves `storeFile` from `rootProject` (the `android/` folder), so `../dreamphysic-release.jks` is the keystore the `keytool` command above created in `frontend/`:

```properties
storeFile=../dreamphysic-release.jks
storePassword=<your store password>
keyAlias=dreamphysic
keyPassword=<your key password>
```

- Merge this into the existing `android { ... }` block in `android/app/build.gradle` (do not add a second `android` block):

```groovy
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            // Only set when the local file exists, so debug builds still configure
            // on a fresh clone; assembleRelease fails until step 3 is done.
            if (keystorePropertiesFile.exists()) {
                storeFile rootProject.file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

---

## 4. Build the web app and sync Capacitor

```bash
npm install
npm run build
# First build only: create the Android project once (skip if android/ already exists)
test -d android || npx cap add android
npx cap sync android
```

---

## 5. Build and verify the signed release APK

```bash
cd android
./gradlew assembleRelease
cd ..
```

Output APK:

```text
android/app/build/outputs/apk/release/app-release.apk
```

Verify the signature and version before shipping:

```bash
# apksigner / aapt ship with the Android SDK build-tools and are usually not on PATH,
# so resolve the newest installed build-tools folder explicitly:
BUILD_TOOLS="$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -n 1)"

# Signature check
"$BUILD_TOOLS/apksigner" verify --verbose android/app/build/outputs/apk/release/app-release.apk

# Version check: versionCode / versionName must match step 1
"$BUILD_TOOLS/aapt" dump badging android/app/build/outputs/apk/release/app-release.apk | head -n 1

# Smoke test on a connected phone
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

Release gate — do not ship until all pass:

- [ ] `versionCode` increased and `versionName` matches the release
- [ ] `apksigner verify` passes with the release keystore (not a debug key)
- [ ] App installs and opens on a real phone; icon and splash look correct
- [ ] Login, workout logging, and AI features work against the production backend

---

## 6. Publish the update (`/api/app-version`)

The backend serves the in-app update prompt from `GET /api/app-version`, backed by two environment variables (`app.latest-version` / `app.apk-download-url` in `application.properties`):

1. Upload `app-release.apk` to a stable public HTTPS URL.
2. On the backend host (Railway), set:

   ```text
   APP_LATEST_VERSION=<versionName from step 1, e.g. 1.1.0>
   APP_APK_DOWNLOAD_URL=<public APK URL from step 1 above>
   ```

3. Redeploy / restart the backend so the new values load.
4. Verify:

   ```bash
   curl https://<your-backend-domain>/api/app-version
   # Expected: {"latestVersion":"1.1.0","downloadUrl":"https://.../app-release.apk"}
   ```

Only update these values **after** the APK is uploaded — the app must never point users at a missing or older file.

---

## User guide: installing the direct APK

Share this section with users who install outside the Play Store.

### Install

1. Download the APK from the official DreamPhysic AI link.
2. Tap the downloaded file. If Android asks, allow installs from that app:
   **Settings → Apps → Special access → Install unknown apps →** pick your browser / Files app **→ Allow**.
3. Tap **Install**, then **Open**. If Play Protect warns, tap **More details → Install anyway** (only for the official link).

### Keep the app running in the background (important)

Some phones aggressively stop background apps, which can delay reminders and sync. Set DreamPhysic AI to **Unrestricted** battery:

- **Xiaomi / Redmi / Poco (MIUI / HyperOS):** Settings → Apps → Manage apps → DreamPhysic AI → Battery saver → **No restrictions**. Also turn **Autostart** on in the same screen.
- **Vivo / iQOO (Funtouch / OriginOS):** Settings → Apps → DreamPhysic AI → Battery → **Unrestricted** (or Settings → Battery → Background power consumption management → allow DreamPhysic AI).
- **Oppo / Realme (ColorOS):** Settings → Apps → DreamPhysic AI → Battery usage → **Allow background activity / Unrestricted**.

Menu names vary slightly by phone model and OS version. Also allow **Notifications** for DreamPhysic AI when prompted.

### Troubleshooting

- **"App not installed":** an older copy signed with a different key is present. Uninstall the old app first (this clears its local data), then install again.
- **"Parse error" / install fails immediately:** the download is incomplete — download the APK again.
- **Update not offered in-app:** check `/api/app-version` returns the new `latestVersion` and a working `downloadUrl` (step 6).
