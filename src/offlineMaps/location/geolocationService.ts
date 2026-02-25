/**
 * Geolocation service using react-native-geolocation-service
 * @format
 */

import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

/**
 * Request location permissions and return the current device position.
 * Returns null if permissions are denied or location is unavailable.
 */
export async function getCurrentLocation(): Promise<{
  lat: number;
  lng: number;
} | null> {
  try {
    if (Platform.OS === 'ios') {
      const status = await Geolocation.requestAuthorization('whenInUse');
      if (status !== 'granted') {
        console.warn('[Geolocation] iOS permission denied:', status);
        return null;
      }
    } else if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message:
            'TOAST needs your location to center the offline map on your current position.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.warn('[Geolocation] Android permission denied');
        return null;
      }
    }

    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('[Geolocation] Error getting position:', error.message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    });
  } catch (error) {
    console.warn('[Geolocation] Unexpected error:', error);
    return null;
  }
}
