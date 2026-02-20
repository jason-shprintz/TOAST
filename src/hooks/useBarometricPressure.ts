import { useEffect, useRef, useState } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';

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

// Access the native module directly to avoid react-native-sensors' JS layer,
// which uses Observable.create with 'this' references that break in strict mode
// and has bridge interop issues with New Architecture when real sensor data flows.
const BarometerNative = NativeModules.RNSensorsBarometer;

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
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!BarometerNative) {
      setAvailable(false);
      setLoading(false);
      setError('Barometer not available on this device.');
      return;
    }

    // setUpdateInterval is a no-op for the barometer on iOS, but call it for
    // parity with Android where it may have effect.
    BarometerNative.setUpdateInterval?.(UPDATE_INTERVAL_MS);

    BarometerNative.isAvailable()
      .then(() => {
        if (!isMounted) {
          return;
        }

        const emitter = new NativeEventEmitter(BarometerNative);
        const subscription = emitter.addListener(
          'RNSensorsBarometer',
          ({
            pressure: p,
            timestamp,
          }: {
            pressure: number;
            timestamp: number;
          }) => {
            if (!isMounted) {
              return;
            }
            const sample: PressureSample = {
              pressure: p,
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
        );

        subscriptionRef.current = subscription;
        // Start after listener is registered to avoid missing early events
        BarometerNative.startUpdates();
      })
      .catch((err: Error) => {
        if (!isMounted) {
          return;
        }
        setAvailable(false);
        setLoading(false);
        setError(err?.message ?? 'Barometer not available on this device.');
      });

    return () => {
      isMounted = false;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      BarometerNative?.stopUpdates?.();
    };
  }, []);

  return { pressure, available, loading, history, error };
}
