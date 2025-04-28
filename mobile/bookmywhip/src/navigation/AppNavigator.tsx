import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Screens (we'll create these next)
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/home/HomeScreen';
import RideHistoryScreen from '../screens/rides/RideHistoryScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import RideDetailScreen from '../screens/rides/RideDetailScreen';
import BookRideScreen from '../screens/rides/BookRideScreen';
import TrackingScreen from '../screens/rides/TrackingScreen';
import AudioPreferencesScreen from '../screens/audio/AudioPreferencesScreen';
import SoundtrackScreen from '../screens/audio/SoundtrackScreen';

// Type definitions for our navigation
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  RideDetail: { rideId: number };
  BookRide: undefined;
  Tracking: { rideId: number };
  AudioPreferences: undefined;
  Soundtrack: { rideId: number };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  RideHistory: undefined;
  Profile: undefined;
};

// Create the navigators
const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Colors based on our web application
const colors = {
  primary: '#10b981', // green-500 from Tailwind
  background: '#ffffff',
  text: '#111827',    // gray-900 from Tailwind
  border: '#e5e7eb',  // gray-200 from Tailwind
};

// Auth Navigator (Login/Register screens)
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator 
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

// Main Tab Navigator (Home/Rides/Profile)
const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9ca3af', // gray-400 from Tailwind
        tabBarStyle: {
          borderTopColor: colors.border,
          paddingTop: 5,
          paddingBottom: 5,
          height: 60,
        },
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home';
          
          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'RideHistory') {
            iconName = 'history';
          } else if (route.name === 'Profile') {
            iconName = 'account';
          }
          
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="RideHistory" 
        component={RideHistoryScreen} 
        options={{ tabBarLabel: 'My Rides' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Root Navigator
const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);

  // Check if user is logged in
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        setUserToken(token);
      } catch (e) {
        console.error('Failed to get token from storage', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken == null ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen 
              name="RideDetail" 
              component={RideDetailScreen} 
              options={{ 
                headerShown: true, 
                title: 'Ride Details',
                headerStyle: {
                  backgroundColor: colors.primary,
                },
                headerTintColor: '#fff',
              }} 
            />
            <Stack.Screen 
              name="BookRide" 
              component={BookRideScreen} 
              options={{ 
                headerShown: true, 
                title: 'Book a Ride',
                headerStyle: {
                  backgroundColor: colors.primary,
                },
                headerTintColor: '#fff',
              }}
            />
            <Stack.Screen 
              name="Tracking" 
              component={TrackingScreen} 
              options={{ 
                headerShown: true, 
                title: 'Track Your Ride',
                headerStyle: {
                  backgroundColor: colors.primary,
                },
                headerTintColor: '#fff',
              }}
            />
            <Stack.Screen 
              name="AudioPreferences" 
              component={AudioPreferencesScreen} 
              options={{ 
                headerShown: true, 
                title: 'Audio Preferences',
                headerStyle: {
                  backgroundColor: colors.primary,
                },
                headerTintColor: '#fff',
              }}
            />
            <Stack.Screen 
              name="Soundtrack" 
              component={SoundtrackScreen} 
              options={{ 
                headerShown: true, 
                title: 'Ride Soundtrack',
                headerStyle: {
                  backgroundColor: colors.primary,
                },
                headerTintColor: '#fff',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;