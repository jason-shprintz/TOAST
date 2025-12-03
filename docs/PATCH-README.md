# Patch Notes: react-native-torch iOS fix

This project uses `patch-package` to persist a native fix for `react-native-torch@1.2.0` on iOS.

## What is patched

- File: `node_modules/react-native-torch/ios/RCTTorch.m`
- Change: Update Objective-C method signature from `RCT_EXPORT_METHOD(switchState:(BOOL *)newState)` to `RCT_EXPORT_METHOD(switchState:(BOOL)newState)` so the React Native bridge can pass JS booleans correctly.

## Why this is needed

- The original signature takes a pointer to `BOOL`, which causes a runtime error on device: "Error while converting JavaScript argument 0 to Objective C type BOOL. Objective C type BOOL is unsupported." Changing it to `BOOL` fixes the bridge conversion.

## How it is applied

- Patch file: `patches/react-native-torch+1.2.0.patch`
- Script: `postinstall` runs `patch-package` automatically after `npm install` to reapply the patch.

## Developer instructions

- Installing dependencies applies the patch:
  - `npm install` (postinstall runs `patch-package`)
- If you wipe `node_modules`, simply run install again; the patch reapplies.
- To regenerate the patch after upgrading the library:
  1. Make the same edit in `node_modules/react-native-torch/ios/RCTTorch.m`.
  2. Run:

    ```zsh
    npx patch-package react-native-torch
    ```

  3. Commit the updated file under `patches/react-native-torch+<new-version>.patch`.

## Related configuration

- `package.json` includes:
  - `devDependencies`: `patch-package`
  - `scripts.postinstall`: `patch-package`

## iOS permission reminder

- Torch uses the camera flash; ensure `NSCameraUsageDescription` exists in `ios/TOAST/Info.plist`.
