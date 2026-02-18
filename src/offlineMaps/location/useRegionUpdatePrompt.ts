/**
 * Hook for managing region update prompt logic
 * @format
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useRef } from 'react';
import { distanceMiles } from './regionDistance';
import type { OfflineRegion } from '../types';

const STORAGE_KEY = 'offline_region_update_prompt_last_shown';

export interface UseRegionUpdatePromptOptions {
  region: OfflineRegion | null;
  getCurrentLocation: () => Promise<{ lat: number; lng: number } | null>;
  thresholdMiles?: number;
  cooldownHours?: number;
}

export interface UseRegionUpdatePromptResult {
  shouldShow: boolean;
  isChecking: boolean;
  error?: string;

  dismiss: () => void;
  accept: () => void;
}

/**
 * Hook for managing region update prompt
 * Checks if user has moved significantly outside their offline region
 */
export function useRegionUpdatePrompt(
  opts: UseRegionUpdatePromptOptions,
  onAccept?: () => void,
): UseRegionUpdatePromptResult {
  const {
    region,
    getCurrentLocation,
    thresholdMiles = 50,
    cooldownHours = 24,
  } = opts;

  const [shouldShow, setShouldShow] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Track if we've already checked on this mount to avoid repeated checks
  const hasCheckedRef = useRef(false);

  /**
   * Check if enough time has passed since last prompt
   */
  const checkCooldown = useCallback(async (): Promise<boolean> => {
    try {
      const lastShownStr = await AsyncStorage.getItem(STORAGE_KEY);
      if (!lastShownStr) {
        return true; // Never shown before
      }

      const lastShownMs = parseInt(lastShownStr, 10);
      if (isNaN(lastShownMs)) {
        return true; // Invalid data, allow prompt
      }

      const now = Date.now();
      const cooldownMs = cooldownHours * 60 * 60 * 1000;
      const timeSinceLastShown = now - lastShownMs;

      return timeSinceLastShown >= cooldownMs;
    } catch (err) {
      console.error('Failed to check cooldown:', err);
      return false; // On error, don't show prompt to avoid spam
    }
  }, [cooldownHours]);

  /**
   * Save current timestamp as last shown
   */
  const saveCooldown = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch (err) {
      console.error('Failed to save cooldown:', err);
    }
  }, []);

  /**
   * Check if user is outside region threshold
   */
  const checkDistance = useCallback(async (): Promise<void> => {
    // Only check if we have a ready region
    if (!region || region.status !== 'ready') {
      return;
    }

    // Don't check multiple times
    if (hasCheckedRef.current) {
      return;
    }

    hasCheckedRef.current = true;
    setIsChecking(true);
    setError(undefined);

    try {
      // Get user location
      const location = await getCurrentLocation();
      if (!location) {
        // No location available, don't show prompt
        setIsChecking(false);
        return;
      }

      // Calculate distance from region center
      const distance = distanceMiles(
        location.lat,
        location.lng,
        region.centerLat,
        region.centerLng,
      );

      // Check if outside threshold
      if (distance > thresholdMiles) {
        // Check cooldown before showing
        const canShow = await checkCooldown();
        if (canShow) {
          setShouldShow(true);
        }
      }

      setIsChecking(false);
    } catch (err) {
      console.error('Error checking region distance:', err);
      setError(err instanceof Error ? err.message : 'Failed to check location');
      setIsChecking(false);
    }
  }, [region, getCurrentLocation, thresholdMiles, checkCooldown]);

  /**
   * Dismiss prompt and save cooldown
   */
  const dismiss = useCallback(() => {
    setShouldShow(false);
    saveCooldown();
  }, [saveCooldown]);

  /**
   * Accept prompt
   */
  const accept = useCallback(() => {
    setShouldShow(false);
    saveCooldown();
    if (onAccept) {
      onAccept();
    }
  }, [saveCooldown, onAccept]);

  // Check distance on mount and when region changes
  useEffect(() => {
    // Reset check flag so we run distance check for each new/updated region
    hasCheckedRef.current = false;
    checkDistance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region?.id, region?.status]);

  return {
    shouldShow,
    isChecking,
    error,
    dismiss,
    accept,
  };
}
