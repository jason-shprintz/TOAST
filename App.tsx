import AppNavigator from './src/navigation/AppNavigator';
import { StoreProvider } from './src/stores';

export default function App() {
  return (
    <StoreProvider>
      <AppNavigator />
    </StoreProvider>
  );
}
