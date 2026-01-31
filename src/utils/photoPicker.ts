import { Alert } from 'react-native';
import RNFS from 'react-native-fs';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  CameraOptions,
  ImageLibraryOptions,
} from 'react-native-image-picker';

/**
 * Opens a photo picker dialog allowing the user to select from camera or photo library.
 * The selected image is copied to app-controlled storage to ensure it persists.
 * @returns A promise that resolves to the selected image URI in app storage or undefined if cancelled
 */
export async function pickPhoto(): Promise<string | undefined> {
  return new Promise((resolve) => {
    let settled = false;

    const safeResolve = (value: string | undefined) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };

    Alert.alert(
      'Add Photo',
      'Choose a photo source',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const result = await openCamera();
            safeResolve(result);
          },
        },
        {
          text: 'Photo Library',
          onPress: async () => {
            const result = await openPhotoLibrary();
            safeResolve(result);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => safeResolve(undefined),
        },
      ],
      { cancelable: true },
    );
  });
}

/**
 * Copies a temporary image file to app-controlled document storage.
 * @param sourceUri - The temporary URI from the image picker
 * @returns The permanent URI in app storage
 */
async function copyToAppStorage(sourceUri: string): Promise<string> {
  try {
    // Generate a unique filename using timestamp and random string
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = sourceUri.split('.').pop() || 'jpg';
    const filename = `photo_${timestamp}_${randomStr}.${extension}`;

    // Use the app's document directory for permanent storage
    const destPath = `${RNFS.DocumentDirectoryPath}/${filename}`;

    // Copy the file from temporary location to permanent storage
    await RNFS.copyFile(sourceUri, destPath);

    // Return the file:// URI for the permanent location
    return `file://${destPath}`;
  } catch (error) {
    console.error('Error copying image to app storage:', error);
    // If copy fails, return the original URI as fallback
    return sourceUri;
  }
}

/**
 * Opens the device camera to take a photo.
 * The captured photo is copied to app-controlled storage for persistence.
 * @returns A promise that resolves to the permanent image URI or undefined if cancelled
 */
async function openCamera(): Promise<string | undefined> {
  const options: CameraOptions = {
    mediaType: 'photo',
    quality: 0.8,
    saveToPhotos: false,
    includeBase64: false,
  };

  try {
    const response: ImagePickerResponse = await launchCamera(options);

    if (response.didCancel) {
      return undefined;
    }

    if (response.errorCode) {
      handleError(response.errorCode, response.errorMessage);
      return undefined;
    }

    if (response.assets && response.assets.length > 0) {
      const asset = response.assets[0];
      if (asset.uri) {
        // Copy to app storage for persistence
        return await copyToAppStorage(asset.uri);
      }
    }

    return undefined;
  } catch (error) {
    console.error('Error opening camera:', error);
    Alert.alert('Error', 'Failed to open camera. Please try again.');
    return undefined;
  }
}

/**
 * Opens the device photo library to select a photo.
 * The selected photo is copied to app-controlled storage for persistence.
 * @returns A promise that resolves to the permanent image URI or undefined if cancelled
 */
async function openPhotoLibrary(): Promise<string | undefined> {
  const options: ImageLibraryOptions = {
    mediaType: 'photo',
    quality: 0.8,
    selectionLimit: 1,
    includeBase64: false,
  };

  try {
    const response: ImagePickerResponse = await launchImageLibrary(options);

    if (response.didCancel) {
      return undefined;
    }

    if (response.errorCode) {
      handleError(response.errorCode, response.errorMessage);
      return undefined;
    }

    if (response.assets && response.assets.length > 0) {
      const asset = response.assets[0];
      if (asset.uri) {
        // Copy to app storage for persistence
        return await copyToAppStorage(asset.uri);
      }
    }

    return undefined;
  } catch (error) {
    console.error('Error opening photo library:', error);
    Alert.alert('Error', 'Failed to open photo library. Please try again.');
    return undefined;
  }
}

/**
 * Handles errors from the image picker.
 */
function handleError(errorCode: string, errorMessage?: string) {
  console.error('Image picker error:', errorCode, errorMessage);

  switch (errorCode) {
    case 'camera_unavailable':
      Alert.alert('Error', 'Camera is not available on this device.');
      break;
    case 'permission':
      Alert.alert(
        'Permission Required',
        'Please grant camera and photo library permissions in your device settings to use this feature.',
      );
      break;
    default:
      Alert.alert(
        'Error',
        errorMessage || 'An error occurred while picking the photo.',
      );
      break;
  }
}
