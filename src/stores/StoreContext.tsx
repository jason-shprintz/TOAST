import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { RootStore } from './RootStore';

const StoreContext = createContext<RootStore | null>(null);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const rootStore = React.useMemo(() => new RootStore(), []);

  // Initialize and load persisted notes and checklists from SQLite on app start
  // Also start device status monitoring for instant battery estimate
  useEffect(() => {
    // Start device status monitoring immediately (synchronously)
    rootStore.coreStore.startDeviceStatusMonitoring();

    // Load persisted data asynchronously
    (async () => {
      try {
        await rootStore.coreStore.loadNotes();
        await rootStore.coreStore.loadChecklists();
      } catch (e) {
        console.warn('Failed to load data on startup:', e);
      }
    })();

    // Cleanup device status monitoring on unmount
    return () => {
      rootStore.coreStore.stopDeviceStatusMonitoring();
    };
  }, [rootStore]);

  return (
    <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>
  );
};

export const useStores = (): RootStore => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStores must be used within a StoreProvider');
  }
  return context;
};

// Convenience hooks for individual stores
export const useCoreStore = () => useStores().coreStore;
export const useNavigationStore = () => useStores().navigationStore;
export const useReferenceStore = () => useStores().referenceStore;
export const useSignalsStore = () => useStores().signalsStore;
