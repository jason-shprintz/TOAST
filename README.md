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

### 🌰 Core Module (Free)

Fundamental offline tools available to all users.

#### **Planned Core Features**

- **Flashlight & Screen Beacon Tools**  
  - ~~Flashlight toggle, strobe modes,~~ colored screen beacon, ~~SOS pattern~~

- **Local Notes / Field Logs**  
  - Offline notes with optional timestamp + last known GPS position

- **Offline Checklists**  
  - Emergency checklists (bug-out bag, first aid, evacuation), fully editable

- **Device Status Dashboard**  
  - Battery estimate (enhance), ~~storage usage, last GPS fix, offline connectivity status~~

- **Unit Conversion Tools**  
  - Length, weight, temperature, wind speed, pressure conversions

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

---

### 📡 Signals Module

Offline communication, signaling, and emergency tools.

#### **Planned Signals Features**

- **Morse Code Tools**  
  - Text-to-flashlight, text-to-screen blink, tone keying trainer

- **SOS Signaling Modes**  
  - Flashlight SOS, screen SOS, tone/beeping SOS

- **Radio Frequency Reference**  
  - Offline AM/FM emergency stations, NOAA channels, HAM emergency bands

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

- **Survival Field Guide**  
  - ~~Fire starting, water purification, shelter building, edible plants, animal tracks~~

- **First Aid Guide**  
  - ~~CPR, bleeding control, burns, hypothermia, poisoning procedures~~

- **Weather Interpretation Guide**  
  - Cloud types, storm indicators, Beaufort scale, natural navigation techniques

- **Tool & Knot Guides**  
  - ~~Rope strengths, tool usage, knot tutorials with step-by-step visuals~~

- **Emergency Protocols**  
  - Signaling aircraft, SAR procedures, evacuation guidance, lost-person rules

- **Offline Article Caching (Optional)**  
  - Save any web article for offline reading (stored in Markdown/HTML)

---

## License

MIT

## Author

[jason-shprintz](https://github.com/jason-shprintz)

---
