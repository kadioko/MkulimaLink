import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

// Navigation
import AppNavigator from './navigation/AppNavigator';

// Stores
import { useAuthStore } from './stores/authStore';

// Components
import LoadingScreen from './components/LoadingScreen';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

const App: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <StatusBar
            barStyle="dark-content"
            backgroundColor="#ffffff"
          />
          <AppNavigator />
          <Toast />
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
