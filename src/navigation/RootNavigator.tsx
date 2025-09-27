import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { LoginScreen, ProfileScreen, FoodTrackingScreen, FoodEntryScreen } from '../screens';
import { BottomTabNavigator } from './BottomTabNavigator';
import { DateProvider } from '../contexts/DateContext';
import { useAuthStore } from '../stores';
import type { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFB' }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <DateProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 320,
          }}
        >
          {isAuthenticated ? (
            // User is authenticated - show main app
            <>
              <Stack.Screen 
                name="Main" 
                component={BottomTabNavigator}
              />
              <Stack.Screen 
                name="Profile" 
                component={ProfileScreen}
                options={{
                  headerShown: true,
                  headerTitle: 'Profile',
                  headerBackTitle: 'Back',
                }}
              />
              <Stack.Screen 
                name="FoodTracking" 
                component={FoodTrackingScreen}
                options={{
                  presentation: 'card', // Changed from 'modal' to reduce conflicts
                  headerShown: true,
                  headerTitle: 'Food Tracking',
                  headerBackTitle: 'Back',
                  animation: 'slide_from_bottom', // Smoother animation
                }}
              />
              <Stack.Screen 
                name="FoodEntry" 
                component={FoodEntryScreen}
                options={{
                  headerShown: false, // Let the component handle its own header
                }}
              />
            </>
          ) : (
            // User is not authenticated - show login
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </DateProvider>
  );
};