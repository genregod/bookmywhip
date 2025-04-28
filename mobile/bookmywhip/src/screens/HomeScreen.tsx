import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Types
type RootStackParamList = {
  Home: undefined;
  BookRide: undefined;
  Profile: undefined;
  AudioPreferences: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, User!</Text>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.profileIcon}>
              <Text style={styles.profileInitial}>U</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>Map View</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.bookRideButton}
            onPress={() => navigation.navigate('BookRide')}
          >
            <Text style={styles.bookRideText}>Book a Ride</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Features</Text>
          
          <View style={styles.featuresList}>
            <TouchableOpacity 
              style={styles.featureItem}
              onPress={() => navigation.navigate('AudioPreferences')}
            >
              <View style={styles.featureIcon}>
                <Text>🎵</Text>
              </View>
              <Text style={styles.featureText}>Audio Preferences</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text>📅</Text>
              </View>
              <Text style={styles.featureText}>Schedule Ride</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text>📍</Text>
              </View>
              <Text style={styles.featureText}>Saved Places</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text>💰</Text>
              </View>
              <Text style={styles.featureText}>Payment Methods</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.recentRidesContainer}>
          <Text style={styles.sectionTitle}>Recent Rides</Text>
          
          <View style={styles.recentRide}>
            <View style={styles.rideDetail}>
              <Text style={styles.rideLocation}>Home → Office</Text>
              <Text style={styles.rideDate}>Today, 9:30 AM</Text>
            </View>
            <Text style={styles.ridePrice}>$12.50</Text>
          </View>
          
          <View style={styles.recentRide}>
            <View style={styles.rideDetail}>
              <Text style={styles.rideLocation}>Office → Restaurant</Text>
              <Text style={styles.rideDate}>Yesterday, 7:15 PM</Text>
            </View>
            <Text style={styles.ridePrice}>$8.75</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  profileButton: {},
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mapPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  mapText: {
    fontSize: 16,
    color: '#888',
  },
  actionButtons: {
    marginBottom: 20,
  },
  bookRideButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  bookRideText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  featuresContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: (width - 48) / 2,
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  recentRidesContainer: {},
  recentRide: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  rideDetail: {},
  rideLocation: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  rideDate: {
    fontSize: 12,
    color: '#888',
  },
  ridePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});

export default HomeScreen;