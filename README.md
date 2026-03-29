# Localiza Saúde Mobile 🏥

A React Native mobile application for finding and booking appointments with healthcare professionals.

## Tech Stack

- **React Native 0.83** with React 19
- **Expo SDK 55** with Expo Router
- **React Native Unistyles v3** for theming
- **TypeScript** for type safety
- **EAS Build** for local and cloud builds

## Get started

1. Install dependencies

   ```bash
   npm install
   # or
   bun install
   ```

2. Start the development server

   ```bash
   npm start
   ```

3. Run on a device

   Since this app uses native modules (Unistyles v3), you need a development build:

   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

## Building the App

This project includes scripts for building the app locally using EAS Build.

### Quick Build Commands

```bash
# Development builds (with debug tools)
npm run build:dev:ios        # iOS simulator
npm run build:dev:android    # Android APK
npm run build:dev:all        # All platforms

# Production builds
npm run build:prod:ios       # iOS device
npm run build:prod:android   # Android APK
npm run build:prod:all       # All platforms
```

### Using the Build Script

For more control, use the build script directly:

```bash
node scripts/build-local.js [dev|prod] [ios|android|all]
```

**Examples:**
```bash
node scripts/build-local.js dev ios       # Development iOS
node scripts/build-local.js prod android  # Production Android
```

### Build Profiles

- **Development (`dev`)**: Includes debug tools, source maps, and development client
  - App ID: `com.llf.localiza-saude.dev`
  - App Name: "Localiza Saúde (Dev)"
  
- **Production (`prod`)**: Optimized, minified, production-ready
  - App ID: `com.llf.localiza-saude`
  - App Name: "Localiza Saúde"

📖 **For detailed build instructions, see [BUILD.md](./BUILD.md)**

## Project Structure

```
src/
├── app/                    # Expo Router screens
│   ├── (bottom-tabs)/     # Main app tabs
│   ├── login.tsx          # Login screen
│   └── _layout.tsx        # Root layout with auth
├── components/
│   ├── ui/                # Reusable UI components
│   │   └── button.tsx     # Button component
│   └── icons.tsx          # App icons
├── contexts/
│   └── auth.tsx           # Authentication context
└── styles/
    └── unistyles.ts       # Theme configuration
```

## Features

- ✅ Modern React 19 patterns (no forwardRef needed)
- ✅ Full TypeScript support
- ✅ Light/Dark theme support with Unistyles
- ✅ Authentication flow (Google, Apple, Email)
- ✅ File-based routing with Expo Router
- ✅ Local EAS builds
- ✅ Development and Production variants

## Development

### Linting

```bash
npm run lint
```

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Unistyles](https://reactnativeunistyles.vercel.app/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [EAS Build](https://docs.expo.dev/build/introduction/)

## License

[Add your license here]
