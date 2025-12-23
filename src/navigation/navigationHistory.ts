import { CommonActions, type ParamListBase } from '@react-navigation/native';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';

type RouteSnapshot = {
  name: string;
  params?: ParamListBase[keyof ParamListBase];
};

/**
 * NavigationHistory manages forward navigation state for a navigation container.
 *
 * This class encapsulates the state needed to track and enable browser-like forward navigation
 * in React Navigation. It maintains a forward stack of routes that can be navigated to after
 * using back navigation.
 *
 * @remarks
 * This class is designed to be instantiated once per NavigationContainer and passed the
 * navigation ref. It provides methods to check if forward navigation is available,
 * perform forward navigation, and track navigation state changes.
 *
 * @example
 * ```tsx
 * const navigationHistory = new NavigationHistory(navigationRef);
 * // In NavigationContainer:
 * <NavigationContainer
 *   ref={navigationRef}
 *   onStateChange={() => navigationHistory.onNavigationStateChange()}
 * >
 * ```
 */
export class NavigationHistory {
  private lastRoutesLength: number | null = null;
  private lastRoute: RouteSnapshot | null = null;
  private forwardStack: RouteSnapshot[] = [];
  private isForwardNavigation = false;
  private navigationRef: NavigationContainerRefWithCurrent<ParamListBase>;

  /**
   * Creates a new NavigationHistory instance.
   *
   * @param navigationRef - Reference to the NavigationContainer
   * @throws Error if navigationRef is null or undefined
   */
  constructor(navigationRef: NavigationContainerRefWithCurrent<ParamListBase>) {
    if (!navigationRef) {
      throw new Error('NavigationHistory requires a valid navigationRef');
    }
    this.navigationRef = navigationRef;
  }

  /**
   * Determines whether there is at least one entry available to navigate forward to.
   *
   * @returns `true` if the forward navigation stack contains one or more entries; otherwise `false`.
   */
  canGoForward(): boolean {
    return this.forwardStack.length > 0;
  }

  /**
   * Navigates to the next entry in the custom forward history stack, if available.
   *
   * This method mimics a "browser forward" operation after a back navigation:
   * it pops the next route from the forward stack and dispatches a navigate action
   * to recreate that screen with its original params.
   *
   * If the navigation container is not ready, or there is no forward entry, this
   * method does nothing.
   *
   * @returns void
   */
  goForward(): void {
    if (!this.navigationRef.isReady()) return;
    const next = this.forwardStack.pop();
    if (!next) return;

    this.isForwardNavigation = true;
    // Recreate the screen by navigating to it again.
    // This mimics "browser forward" after a back pop.
    this.navigationRef.dispatch(
      CommonActions.navigate({
        name: next.name,
        params: next.params as object | undefined,
      }),
    );
  }

  /**
   * React Navigation state-change handler that maintains a lightweight "forward" history stack.
   *
   * This method observes changes to the root navigation state and current route, then:
   * - Detects backward navigation (stack length shrinks) and records the previously active route
   *   into a `forwardStack` so a custom forward gesture can navigate back to it.
   * - Clears `forwardStack` when a new route is pushed via normal navigation (i.e., not triggered by
   *   a forward-gesture flow) to mirror typical browser forward-history behavior.
   * - Updates internal bookkeeping (`lastRoutesLength`, `lastRoute`) for the next change.
   * - Resets the `isForwardNavigation` flag after the forward navigation has been observed.
   *
   * Early-returns when the navigation container is not ready or when state/route information is unavailable.
   *
   * @returns void
   */
  onNavigationStateChange(): void {
    if (!this.navigationRef.isReady()) return;

    const state = this.navigationRef.getRootState();
    const current = this.navigationRef.getCurrentRoute();
    if (!state || !current) return;

    const routesLength = state.routes.length;

    if (this.lastRoutesLength !== null && this.lastRoute) {
      const wentBack = routesLength < this.lastRoutesLength;
      const movedToDifferentRoute = current.name !== this.lastRoute.name;

      // If the stack shrank, we likely popped the previous screen.
      // Store the popped screen so a left-swipe can "go forward" back to it.
      if (wentBack && movedToDifferentRoute) {
        this.forwardStack.push(this.lastRoute);
      }

      const pushedNewRoute = routesLength > this.lastRoutesLength;

      // If we navigated to a new route (not via our forward gesture), clear forward history.
      if (pushedNewRoute && !this.isForwardNavigation) {
        this.forwardStack = [];
      }

      // Any non-forward navigation that changes the current route should also clear forward history.
      if (!wentBack && !this.isForwardNavigation && movedToDifferentRoute) {
        this.forwardStack = [];
      }
    }

    this.lastRoutesLength = routesLength;
    this.lastRoute = { name: current.name, params: current.params };

    // Reset the flag after the state update is observed.
    if (this.isForwardNavigation) {
      this.isForwardNavigation = false;
    }
  }

  /**
   * Resets the navigation history state.
   *
   * This method clears all internal state, useful for testing or when
   * reinitializing the navigation container.
   *
   * @returns void
   */
  reset(): void {
    this.lastRoutesLength = null;
    this.lastRoute = null;
    this.forwardStack = [];
    this.isForwardNavigation = false;
  }
}
