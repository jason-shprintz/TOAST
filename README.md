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
  npx react-native run-ios
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

## Future Improvements

### Everything

Improvements that encompass the entire app ecosystem

- **Settings button implementation**
  - Font size
  - Dark mode
- **Help button implementation**
  - What is TOAST
  - How to use
  - Migration assistant
  - Privacy Policy
  - Terms of Use
  - Contact
- **Footer actions**
  - Current active item
  - Notifications
  - SOS shortcut
- **Horizontal Scrolling**
  - Implement a more robust horizontal scrolling inside of ScrollView
- **Splash Screen**
  - Update image
  - Update branding
- **Website**
  - Update website with better branding
- **Android Testing**
- **Tablet Testing**

### 🌰 Core Module (Free)

Fundamental offline tools available to all users.

#### **Planned Core Features**

- **Flashlight & Screen Beacon Tools**  
  - Colored screen beacon (RED LIGHT)
  - SOS should have an option to have tone.

- **Local Notes / Field Logs**  
  - The user should have the ability to sort the notes based on time, alpha, or manually.
  - Need to develop sketch.
  - The user should have the ability to add and/or delete categories. This should be an action bar item.

- **Offline Checklists**  
  - Bug-out bag
  - First-aid kit
  - Evacuation kit
  - The user should have the ability to add their own checklist items
  - The checklist should be fully editable

- **Device Status Dashboard**  
  - Battery estimate (enhance)
    - Needs to be instant. Faster is better than accurate.

- **Unit Conversion Tools**  
  - Length
  - Weight
  - Temperature
  - Wind speed
  - Pressure conversions

---

### 🧭 Navigation Module

Offline navigation and orientation tools.

#### **Planned Navigation Features**

- **Offline Map Tiles**  
  - Download regions for full offline pan/zoom map support

- **Compass & Gyro Orientation**  
  - Magnetic/true north, calibration tool, orientation fallback

- **Waypoints & Breadcrumb Trails**  
  - Drop location pins, track movement, breadcrumb rewind

- **Offline “Return to Start” Guidance**  
  - Straight-line heading + distance; off-track warnings

- **Elevation Graphs**  
  - Preloaded DEM elevation data shown on tracked routes

- **Downloadable Trail Packs**  
  - Trails, markers, stats all stored for offline use
  - Research trail APIs that can be stored

---

### 📡 Signals Module

Offline communication, signaling, and emergency tools.

#### **Planned Signals Features**

- **Morse Code Tools**  
  - Text-to-flashlight, text-to-screen blink, tone keying trainer

- **Radio Frequency Reference**  
  - Offline AM/FM emergency stations
  - NOAA channels
  - HAM emergency bands
    - Research creating an API for this to be stored locally

- **Digital Whistle**  
  - High-frequency whistle simulator (device-limited)

- **Signal Mirror Simulator**  
  - High-brightness reflective screen mode with aiming reticle

- **Decibel Meter**  
  - Offline noise-level measurement using microphone

---

### 📘 Reference Module

Offline survival and emergency knowledge packs.

#### **Planned Features**

- Update categories
  - **Survival Field Guide**  
    - Need pictures
  - **First Aid Guide**  
    - Need pictures
  - **Weather Interpretation Guide**  
    - Need pictures
  - **Tool & Knot Guides**  
    - Need pictures
  - **Emergency Protocols**  
    - Need pictures
- Update icons
- Research technical illustrations
- Research local references based on location

---

## License

MIT

## Author

[jason-shprintz](https://github.com/jason-shprintz)

---
