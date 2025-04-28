import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Mock screens for the basic structure
import LoginScreen from './screens/auth/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import BookRideScreen from './screens/BookRideScreen';
import TrackingScreen from './screens/TrackingScreen';
import PaymentScreen from './screens/PaymentScreen';
import ProfileScreen from './screens/ProfileScreen';
import AudioPreferencesScreen from './screens/audio/AudioPreferencesScreen';
import SoundtrackScreen from './screens/audio/SoundtrackScreen';

// Define the stack navigator parameter list
type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  BookRide: undefined;
  Tracking: undefined;
  Payment: undefined;
  Profile: undefined;
  AudioPreferences: undefined;
  Soundtrack: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

function App(): JSX.Element {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#4CAF50', // BookMyWhip green theme
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'BookMyWhip' }}
          />
          <Stack.Screen 
            name="BookRide" 
            component={BookRideScreen} 
            options={{ title: 'Book a Ride' }}
          />
          <Stack.Screen 
            name="Tracking" 
            component={TrackingScreen} 
            options={{ title: 'Track Your Ride' }}
          />
          <Stack.Screen 
            name="Payment" 
            component={PaymentScreen} 
            options={{ title: 'Payment' }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{ title: 'Your Profile' }}
          />
          <Stack.Screen 
            name="AudioPreferences" 
            component={AudioPreferencesScreen} 
            options={{ title: 'Audio Preferences' }}
          />
          <Stack.Screen 
            name="Soundtrack" 
            component={SoundtrackScreen} 
            options={{ title: 'Ride Soundtrack' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;