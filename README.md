# TOAST

Tech-Offline And Survival Tools (TOAST) is a React Native app providing essential offline utilities and reference modules for survival, navigation, and more.

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
  npx react-native run-ios --scheme TOAST
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
