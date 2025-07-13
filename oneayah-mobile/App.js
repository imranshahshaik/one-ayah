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
import { AuthProvider } from './src/hooks/useAuth';
import { SupabaseProvider } from './src/hooks/useSupabase';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SupabaseProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="light" backgroundColor="#1a1a1a" />
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
              tabBarInactiveTintColor: '#6b7280',
              headerShown: false,
              tabBarStyle: {
                backgroundColor: '#1a1a1a',
                borderTopColor: 'rgba(255, 255, 255, 0.1)',
                borderTopWidth: 1,
                paddingTop: 8,
                paddingBottom: 8,
                height: 60,
              },
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '600',
                marginTop: 4,
              },
            })}
          >
            <Tab.Screen 
              name="Home" 
              component={HomeScreen}
              options={{
                tabBarLabel: 'Home',
              }}
            />
            <Tab.Screen 
              name="Memorization" 
              component={MemorizationScreen}
              options={{
                tabBarLabel: 'Memorize',
              }}
            />
            <Tab.Screen 
              name="Progress" 
              component={ProgressScreen}
              options={{
                tabBarLabel: 'Progress',
              }}
            />
            <Tab.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{
                tabBarLabel: 'Settings',
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </SupabaseProvider>
  );
}