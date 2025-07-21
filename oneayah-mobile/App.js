import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Dimensions, LogBox } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// Ignore specific warnings that are not critical
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
]);

// Enable performance optimizations
if (__DEV__) {
  console.log('🚀 OneAyah Mobile - Development Mode');
}

import HomeScreen from './src/screens/HomeScreen';
import MemorizationScreen from './src/screens/MemorizationScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import SettingsScreen from './src/screens/SettingsScreen';

import { AuthProvider } from './src/providers/AuthProvider';

const Tab = createMaterialTopTabNavigator();
const { width } = Dimensions.get('window');

function TabBarIcon({ name, focused, color }) {
  return <Ionicons name={name} size={24} color={color} />;
}

function TabBarLabel({ label, focused, color }) {
  return (
    <Text style={{
      color,
      fontSize: 12,
      fontWeight: focused ? '600' : '400',
      marginTop: 4,
    }}>
      {label}
    </Text>
  );
}

function AppNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      <Tab.Navigator
        initialRouteName="Home"
        tabBarPosition="bottom"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color }) => {
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

            return <TabBarIcon name={iconName} focused={focused} color={color} />;
          },
          tabBarLabel: ({ focused, color }) => {
            let label;
            
            if (route.name === 'Home') {
              label = 'Home';
            } else if (route.name === 'Memorization') {
              label = 'Memorize';
            } else if (route.name === 'Progress') {
              label = 'Progress';
            } else if (route.name === 'Settings') {
              label = 'Settings';
            }

            return <TabBarLabel label={label} focused={focused} color={color} />;
          },
          tabBarActiveTintColor: '#22c55e',
          tabBarInactiveTintColor: '#6b7280',
          tabBarStyle: {
            backgroundColor: '#1a1a1a',
            borderTopColor: 'rgba(255, 255, 255, 0.1)',
            borderTopWidth: 1,
            height: Math.max(80, 80 + insets.bottom),
            paddingBottom: Math.max(8, insets.bottom),
            paddingTop: 8,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: -2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
          },
          tabBarItemStyle: {
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 8,
            width: width / 4,
          },
          tabBarIndicatorStyle: {
            backgroundColor: '#22c55e',
            height: 3,
            borderRadius: 2,
            top: 0,
          },
          tabBarPressColor: 'rgba(34, 197, 94, 0.1)',
          tabBarPressOpacity: 0.8,
          swipeEnabled: true,
          animationEnabled: true,
          tabBarScrollEnabled: false,
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
        />
        <Tab.Screen 
          name="Memorization" 
          component={MemorizationScreen}
        />
        <Tab.Screen 
          name="Progress" 
          component={ProgressScreen}
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen}
        />
      </Tab.Navigator>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" backgroundColor="#1a1a1a" translucent={false} />
        <NavigationContainer
          theme={{
            dark: true,
            colors: {
              primary: '#22c55e',
              background: '#1a1a1a',
              card: '#2d2d2d',
              text: '#ffffff',
              border: 'rgba(255, 255, 255, 0.1)',
              notification: '#22c55e',
            },
          }}
        >
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}