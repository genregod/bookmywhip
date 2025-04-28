import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// This will be replaced with actual Maps component
const MapPlaceholder = () => (
  <View style={styles.mapPlaceholder}>
    <Icon name="map" size={80} color="#10b98150" />
    <Text style={styles.mapPlaceholderText}>Map View</Text>
  </View>
);

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Main'
>;

// Mock data for active ride (in a real app, this would come from API)
const activeRide = null; // Set to an object with ride details if there's an active ride

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    // Simulate loading user data
    const timer = setTimeout(() => {
      setUserName('John');  // This would be fetched from the API
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleBookRide = () => {
    navigation.navigate('BookRide');
  };

  const handleViewActiveRide = () => {
    if (activeRide) {
      navigation.navigate('Tracking', { rideId: activeRide.id });
    }
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <ScrollView>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Hello, {userName}</Text>
              <Text style={styles.subGreeting}>Where are you going today?</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Icon name="account" size={24} color="#10b981" />
            </TouchableOpacity>
          </View>

          {/* Map Area */}
          <View style={styles.mapContainer}>
            <MapPlaceholder />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={styles.mainActionButton}
              onPress={handleBookRide}
            >
              <Icon name="car" size={24} color="#ffffff" />
              <Text style={styles.mainActionText}>Book a Ride</Text>
            </TouchableOpacity>

            {activeRide && (
              <TouchableOpacity 
                style={styles.secondaryActionButton}
                onPress={handleViewActiveRide}
              >
                <Icon name="map-marker-path" size={24} color="#ffffff" />
                <Text style={styles.secondaryActionText}>View Active Ride</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Access Cards */}
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickAccessContainer}
          >
            <TouchableOpacity 
              style={styles.quickAccessCard}
              onPress={() => navigation.navigate('RideHistory')}
            >
              <View style={styles.cardIconContainer}>
                <Icon name="history" size={24} color="#10b981" />
              </View>
              <Text style={styles.cardTitle}>Ride History</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAccessCard}
              onPress={() => navigation.navigate('AudioPreferences')}
            >
              <View style={styles.cardIconContainer}>
                <Icon name="music" size={24} color="#10b981" />
              </View>
              <Text style={styles.cardTitle}>Audio Preferences</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAccessCard}
              onPress={() => console.log('Payment methods')}
            >
              <View style={styles.cardIconContainer}>
                <Icon name="credit-card" size={24} color="#10b981" />
              </View>
              <Text style={styles.cardTitle}>Payment Methods</Text>
            </TouchableOpacity>
          </ScrollView>
        </ScrollView>
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb', // light gray background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827', // gray-900
  },
  subGreeting: {
    fontSize: 16,
    color: '#6b7280', // gray-500
    marginTop: 4,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ecfdf5', // green-50
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    height: 200,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb', // gray-50
  },
  mapPlaceholderText: {
    marginTop: 10,
    fontSize: 14,
    color: '#9ca3af', // gray-400
  },
  actionContainer: {
    padding: 20,
  },
  mainActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981', // primary green
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  mainActionText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5', // indigo-600
    borderRadius: 12,
    padding: 16,
  },
  secondaryActionText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827', // gray-900
    padding: 20,
    paddingBottom: 10,
  },
  quickAccessContainer: {
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  quickAccessCard: {
    width: width / 2.5,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ecfdf5', // green-50
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151', // gray-700
  },
});

export default HomeScreen;