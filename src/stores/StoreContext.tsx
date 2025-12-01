import React, { createContext, useContext, ReactNode } from 'react';
import { RootStore } from './RootStore';

const StoreContext = createContext<RootStore | null>(null);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const rootStore = React.useMemo(() => new RootStore(), []);

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
