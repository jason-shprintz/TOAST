# TOAST

Tactical Operations And Survival Toolkit (TOAST) is a React Native app providing essential offline utilities and reference modules for survival, navigation, and more.

## Features

- Modules: Core, Navigation, Reference, Signals
- Offline-first design

## Getting Started

### Prerequisites

- Node.js >= 14
- Yarn or npm
- Xcode (for iOS)
- Android Studio (for Android)

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/jason-shprintz/TOAST.git
   cd TOAST
   ```

2. Install dependencies:

   ```sh
   yarn install
   # or
   npm install
   ```

3. Install iOS pods:

   ```sh
   npx pod-install
   # or
   cd ios && pod install
   ```

### Running the App

- **iOS:**

  ```sh
  npx react-native run-ios
  ```

Optional: --mode Debug

```sh
npx react-native run-ios --scheme TOAST --mode Debug
```

- **Android:**

  ```sh
  npx react-native run-android
  ```

## Troubleshooting

### Missing Scheme in Xcode

If you encounter an error about a missing scheme when building for iOS, ensure that the TOAST scheme is shared in Xcode:

```sh
mkdir -p ios/TOAST.xcodeproj/xcshareddata/xcschemes

# copy the real scheme (ignore the ._ file)
cp -f ios/TOAST.xcworkspace/xcshareddata/xcschemes/TOAST.xcscheme \
      ios/TOAST.xcodeproj/xcshareddata/xcschemes/TOAST.xcscheme

# sanity check: project should now list TOAST scheme
xcodebuild -list -project ios/TOAST.xcodeproj | sed -n '1,80p'
```

### macOS `._*` files (AppleDouble)

On macOS (especially when working from an external drive), Finder can create `._*` “AppleDouble” metadata files alongside real files. If these get picked up by build tooling (Metro/Xcode/Gradle) or accidentally committed, they can cause confusing build/runtime issues.

This repo ignores them via `.gitignore`, and also includes a cleanup script to remove any that already exist:

```sh
npm run clean:appledouble
```

---

## License

MIT

## Author

[jason-shprintz](https://github.com/jason-shprintz)

---
