import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation';
import { useAuthStore } from './src/stores';

export default function App() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    // Initialize Firebase auth state listener
    const unsubscribe = initializeAuth();
    
    // Cleanup on unmount
    return unsubscribe;
  }, [initializeAuth]);

  return (
    <>
      <RootNavigator />
      <StatusBar style="auto" />
    </>
  );
}
