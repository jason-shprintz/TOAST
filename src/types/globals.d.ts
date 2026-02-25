/**
 * Global function declarations for React Native's JS engine (Hermes/JSC)
 *
 * These globals are available at runtime but are not included in the
 * TypeScript lib targets used by @react-native/typescript-config (which
 * omits the 'dom' lib to avoid conflicts with RN's own type definitions).
 */

declare function btoa(data: string): string;
declare function atob(data: string): string;
