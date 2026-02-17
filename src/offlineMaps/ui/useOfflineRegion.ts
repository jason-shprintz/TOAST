/**
 * Hook to fetch active offline region
 * @format
 */

import { useEffect, useState } from 'react';
import { createRegionRepository } from '../db/regionRepository';
import type { OfflineRegion } from '../types';

export type UseOfflineRegionStatus = 'loading' | 'ready' | 'missing' | 'error';

export interface UseOfflineRegionResult {
  region: OfflineRegion | null;
  status: UseOfflineRegionStatus;
  error?: string;
}

const repository = createRegionRepository();

/**
 * Hook to access the currently active offline region
 * Returns the region with status='ready' and tilesPath set
 */
export function useOfflineRegion(): UseOfflineRegionResult {
  const [region, setRegion] = useState<OfflineRegion | null>(null);
  const [status, setStatus] = useState<UseOfflineRegionStatus>('loading');
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    const loadActiveRegion = async () => {
      try {
        setStatus('loading');
        setError(undefined);

        // Initialize repository if needed
        await repository.init();

        // Get the active region (status = 'ready')
        const activeRegion = await repository.getActiveRegion();

        if (!mounted) {
          return;
        }

        if (!activeRegion) {
          setStatus('missing');
          setRegion(null);
          return;
        }

        // Validate that tilesPath exists for ready regions
        if (!activeRegion.tilesPath) {
          setStatus('error');
          setError('Region is ready but tilesPath is missing');
          setRegion(null);
          return;
        }

        setRegion(activeRegion);
        setStatus('ready');
      } catch (e) {
        if (!mounted) {
          return;
        }

        setStatus('error');
        setError(e instanceof Error ? e.message : 'Failed to load region');
        setRegion(null);
      }
    };

    loadActiveRegion();

    return () => {
      mounted = false;
    };
  }, []);

  return { region, status, error };
}
