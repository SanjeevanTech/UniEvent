import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { EventProvider } from './src/context/EventContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import EventDetailsScreen from './src/screens/EventDetailsScreen';
import AddEventScreen from './src/screens/AddEventScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AppStatusBar from './src/components/AppStatusBar';

const Stack = createNativeStackNavigator(), Tab = createBottomTabNavigator();

const HomeFlow = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="EventDetails" component={EventDetailsScreen} options={{ presentation: 'modal' }} />
  </Stack.Navigator>
);

const Navigation = () => {
  const { user, loading } = useAuth(), { theme } = useTheme();

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: theme.colors.background }}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;

  return (
    <NavigationContainer>
      {!user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}><Stack.Screen name="Login" component={LoginScreen} /></Stack.Navigator>
      ) : (
        <Tab.Navigator screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarStyle: { backgroundColor: theme.colors.navBackground, borderTopColor: theme.colors.border },
          tabBarIcon: ({ focused, color, size }) => {
            const icons = { Home: 'home', AddEvent: 'add-circle', Profile: 'person' };
            const iconName = icons[route.name] || 'help';
            return <Ionicons name={focused ? iconName : `${iconName}-outline`} size={size} color={color} />;
          }
        })}>
          <Tab.Screen name="Home" component={HomeFlow} options={{ title: 'Explore' }} />
          {user.role === 'admin' && <Tab.Screen name="AddEvent" component={AddEventScreen} options={{ title: 'Post' }} />}
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      )}
    </NavigationContainer>
  );
};

export default () => (
  <SafeAreaProvider>
    <AuthProvider><ThemeProvider><EventProvider>
      <AppStatusBar />
      <Navigation />
    </EventProvider></ThemeProvider></AuthProvider>
  </SafeAreaProvider>
);
