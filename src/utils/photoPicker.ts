import { Alert } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  CameraOptions,
  ImageLibraryOptions,
} from 'react-native-image-picker';

/**
 * Opens a photo picker dialog allowing the user to select from camera or photo library.
 * @returns A promise that resolves to the selected image URI or undefined if cancelled
 */
export async function pickPhoto(): Promise<string | undefined> {
  return new Promise((resolve) => {
    Alert.alert(
      'Add Photo',
      'Choose a photo source',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const result = await openCamera();
            resolve(result);
          },
        },
        {
          text: 'Photo Library',
          onPress: async () => {
            const result = await openPhotoLibrary();
            resolve(result);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(undefined),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(undefined) },
    );
  });
}

/**
 * Opens the device camera to take a photo.
 * @returns A promise that resolves to the captured image URI or undefined if cancelled
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
      return asset.uri;
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
 * @returns A promise that resolves to the selected image URI or undefined if cancelled
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
      return asset.uri;
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
