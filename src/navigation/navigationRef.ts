import {
  createNavigationContainerRef,
  type ParamListBase,
} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<ParamListBase>();

export function canGoBack(): boolean {
  return navigationRef.isReady() && navigationRef.canGoBack();
}

export function goBack(): void {
  if (canGoBack()) {
    navigationRef.goBack();
  }
}
