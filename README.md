# ChessMaster Pro ♛

A production-ready Chess app built with React Native + Expo.

## Features
- Full chess rules (castling, en passant, promotion)
- Drag & drop pieces
- Engine analysis (minimax)
- Chess clock with multiple time controls
- Move history & navigation
- Board themes
- Landscape support

## Build APK (3 steps)

### Step 1 — Create Expo Account
Go to https://expo.dev and create a free account.

### Step 2 — Add Secret to GitHub
1. In your GitHub repo → Settings → Secrets → Actions
2. Add new secret: `EXPO_TOKEN`
3. Get your token from https://expo.dev/accounts/[your-username]/settings/access-tokens

### Step 3 — Push to GitHub
GitHub Actions will auto-run and build your APK via EAS.
Download the APK from your Expo dashboard: https://expo.dev

## Local Development
```bash
npm install
npx expo start
```

## Manual APK Build
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```
