import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { NavigationHistory } from './navigationHistory';
import { navigationRef } from './navigationRef';

/**
 * Context for providing NavigationHistory instance throughout the app.
 *
 * This context allows components to access the NavigationHistory instance
 * without relying on module-level state, making the code more testable and
 * supporting multiple navigation containers if needed.
 */
const NavigationHistoryContext = createContext<NavigationHistory | null>(null);

/**
 * Props for NavigationHistoryProvider component.
 */
type NavigationHistoryProviderProps = {
  children: ReactNode;
};

/**
 * Provider component that creates and provides a NavigationHistory instance.
 *
 * This should wrap the NavigationContainer to ensure all child components
 * have access to the navigation history functionality.
 *
 * @param props - Component props
 * @param props.children - Child components to render
 * @returns Provider component
 *
 * @remarks
 * The navigationRef is a module-level constant imported from navigationRef.ts,
 * so it's stable and doesn't need to be included in the dependency array.
 */
export function NavigationHistoryProvider({
  children,
}: NavigationHistoryProviderProps) {
  const navigationHistory = useMemo(
    () => new NavigationHistory(navigationRef),
    [],
  );

  return (
    <NavigationHistoryContext.Provider value={navigationHistory}>
      {children}
    </NavigationHistoryContext.Provider>
  );
}

/**
 * Hook to access the NavigationHistory instance from context.
 *
 * @throws Error if used outside of NavigationHistoryProvider
 * @returns The NavigationHistory instance
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const navigationHistory = useNavigationHistory();
 *   const canGoForward = navigationHistory.canGoForward();
 *   // ...
 * }
 * ```
 */
export function useNavigationHistory(): NavigationHistory {
  const context = useContext(NavigationHistoryContext);
  if (!context) {
    throw new Error(
      'useNavigationHistory must be used within NavigationHistoryProvider',
    );
  }
  return context;
}
