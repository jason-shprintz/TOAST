import { useEffect, useRef, useState } from 'react';
import {
  barometer,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';

/** A single pressure sample with timestamp */
export interface PressureSample {
  pressure: number; // hPa
  timestamp: number; // ms since epoch
}

/** Maximum number of samples to retain (one per minute, 24 h = 1440) */
const MAX_SAMPLES = 1440;

/** Update interval in milliseconds */
const UPDATE_INTERVAL_MS = 60_000;

export interface UseBarometricPressureResult {
  /** Current pressure reading in hPa, or null if unavailable */
  pressure: number | null;
  /** Whether the sensor is available on this device */
  available: boolean;
  /** Whether a first reading is still being acquired */
  loading: boolean;
  /** Historical samples collected since the screen mounted */
  history: PressureSample[];
  /** Error message if something went wrong */
  error: string | null;
}

/**
 * Hook that subscribes to the device barometer and accumulates a history of
 * pressure readings.  Gracefully handles devices that lack the sensor.
 */
export function useBarometricPressure(): UseBarometricPressureResult {
  const [pressure, setPressure] = useState<number | null>(null);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<PressureSample[]>([]);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    let isMounted = true;

    try {
      setUpdateIntervalForType(SensorTypes.barometer, UPDATE_INTERVAL_MS);

      const subscription = barometer.subscribe(
        ({ pressure: p, timestamp }) => {
          if (!isMounted) {
            return;
          }
          const sample: PressureSample = {
            pressure: p,
            // react-native-sensors always provides a timestamp; the fallback to
            // Date.now() is a defensive guard that should never be reached in
            // practice.  Either value represents milliseconds since epoch, so
            // window filtering remains accurate.
            timestamp: timestamp ?? Date.now(),
          };
          setPressure(p);
          setHistory((prev) => {
            const next = [...prev, sample];
            return next.length > MAX_SAMPLES
              ? next.slice(next.length - MAX_SAMPLES)
              : next;
          });
          setLoading(false);
          setAvailable(true);
        },
        (err: Error) => {
          if (!isMounted) {
            return;
          }
          setAvailable(false);
          setLoading(false);
          setError(err?.message ?? 'Barometer not available on this device.');
        },
      );

      subscriptionRef.current = subscription;
    } catch {
      if (isMounted) {
        setAvailable(false);
        setLoading(false);
        setError('Barometer not available on this device.');
      }
    }

    return () => {
      isMounted = false;
      subscriptionRef.current?.unsubscribe();
    };
  }, []);

  return { pressure, available, loading, history, error };
}
