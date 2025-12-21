import { CommonActions, type ParamListBase } from '@react-navigation/native';
import { navigationRef } from './navigationRef';

type RouteSnapshot = {
  name: string;
  params?: ParamListBase[keyof ParamListBase];
};

let lastRoutesLength: number | null = null;
let lastRoute: RouteSnapshot | null = null;

let forwardStack: RouteSnapshot[] = [];
let isForwardNavigation = false;

/**
 * Determines whether there is at least one entry available to navigate forward to.
 *
 * @returns `true` if the forward navigation stack contains one or more entries; otherwise `false`.
 */
export function canGoForward(): boolean {
  return forwardStack.length > 0;
}

/**
 * Navigates to the next entry in the custom forward history stack, if available.
 *
 * This function mimics a "browser forward" operation after a back navigation:
 * it pops the next route from the forward stack and dispatches a navigate action
 * to recreate that screen with its original params.
 *
 * If the navigation container is not ready, or there is no forward entry, this
 * function does nothing.
 *
 * @returns void
 */
export function goForward(): void {
  if (!navigationRef.isReady()) return;
  const next = forwardStack.pop();
  if (!next) return;

  isForwardNavigation = true;
  // Recreate the screen by navigating to it again.
  // This mimics "browser forward" after a back pop.
  navigationRef.dispatch(
    CommonActions.navigate({
      name: next.name,
      params: next.params as object | undefined,
    }),
  );
}

/**
 * React Navigation state-change handler that maintains a lightweight “forward” history stack.
 *
 * This function observes changes to the root navigation state and current route, then:
 * - Detects backward navigation (stack length shrinks) and records the previously active route
 *   into a `forwardStack` so a custom forward gesture can navigate back to it.
 * - Clears `forwardStack` when a new route is pushed via normal navigation (i.e., not triggered by
 *   a forward-gesture flow) to mirror typical browser forward-history behavior.
 * - Updates internal bookkeeping (`lastRoutesLength`, `lastRoute`) for the next change.
 * - Resets the `isForwardNavigation` flag after the forward navigation has been observed.
 *
 * Early-returns when the navigation container is not ready or when state/route information is unavailable.
 *
 * @remarks
 * This handler relies on module-level state such as `navigationRef`, `forwardStack`,
 * `lastRoutesLength`, `lastRoute`, and `isForwardNavigation`.
 *
 * @returns void
 */
export function onNavigationStateChange(): void {
  if (!navigationRef.isReady()) return;

  const state = navigationRef.getRootState();
  const current = navigationRef.getCurrentRoute();
  if (!state || !current) return;

  const routesLength = state.routes.length;

  if (lastRoutesLength != null && lastRoute) {
    const wentBack = routesLength < lastRoutesLength;
    const movedToDifferentRoute = current.name !== lastRoute.name;

    // If the stack shrank, we likely popped the previous screen.
    // Store the popped screen so a left-swipe can "go forward" back to it.
    if (wentBack && movedToDifferentRoute) {
      forwardStack.push(lastRoute);
    }

    const pushedNewRoute = routesLength > lastRoutesLength;

    // If we navigated to a new route (not via our forward gesture), clear forward history.
    if (pushedNewRoute && !isForwardNavigation) {
      forwardStack = [];
    }

    // Any non-forward navigation that changes the current route should also clear forward history.
    if (!wentBack && !isForwardNavigation && movedToDifferentRoute) {
      forwardStack = [];
    }
  }

  lastRoutesLength = routesLength;
  lastRoute = { name: current.name, params: current.params };

  // Reset the flag after the state update is observed.
  if (isForwardNavigation) {
    isForwardNavigation = false;
  }
}
