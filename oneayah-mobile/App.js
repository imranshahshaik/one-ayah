import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import MemorizationScreen from './src/screens/MemorizationScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Providers
import { AuthProvider } from './src/providers/AuthProvider';
import { SupabaseProvider } from './src/providers/SupabaseProvider';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SupabaseProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;

                if (route.name === 'Home') {
                  iconName = focused ? 'home' : 'home-outline';
                } else if (route.name === 'Memorization') {
                  iconName = focused ? 'book' : 'book-outline';
                } else if (route.name === 'Progress') {
                  iconName = focused ? 'analytics' : 'analytics-outline';
                } else if (route.name === 'Settings') {
                  iconName = focused ? 'settings' : 'settings-outline';
                }

                return <Ionicons name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: '#22c55e',
              tabBarInactiveTintColor: 'gray',
              headerStyle: {
                backgroundColor: '#1a1a1a',
              },
              headerTintColor: '#fff',
              tabBarStyle: {
                backgroundColor: '#1a1a1a',
                borderTopColor: '#333',
              },
            })}
          >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Memorization" component={MemorizationScreen} />
            <Tab.Screen name="Progress" component={ProgressScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </SupabaseProvider>
  );
}