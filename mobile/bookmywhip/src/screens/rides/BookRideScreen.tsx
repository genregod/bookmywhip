import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Location input component
const LocationInput = ({ 
  label, 
  placeholder, 
  value, 
  onChangeText, 
  icon 
}: { 
  label: string; 
  placeholder: string; 
  value: string; 
  onChangeText: (text: string) => void; 
  icon: string;
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputWrapper}>
      <Icon name={icon} size={20} color="#10b981" style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  </View>
);

// Vehicle type selection component
const VehicleTypeSelector = ({ 
  selected, 
  onSelect 
}: { 
  selected: 'economy' | 'premium'; 
  onSelect: (type: 'economy' | 'premium') => void;
}) => (
  <View style={styles.vehicleTypeContainer}>
    <Text style={styles.sectionTitle}>Vehicle Type</Text>
    
    <View style={styles.vehicleOptions}>
      <TouchableOpacity
        style={[
          styles.vehicleOption,
          selected === 'economy' && styles.vehicleOptionSelected
        ]}
        onPress={() => onSelect('economy')}
      >
        <Icon
          name="car"
          size={24}
          color={selected === 'economy' ? '#10b981' : '#9ca3af'}
          style={styles.vehicleIcon}
        />
        <View>
          <Text
            style={[
              styles.vehicleTitle,
              selected === 'economy' && styles.vehicleTextSelected
            ]}
          >
            Economy
          </Text>
          <Text style={styles.vehicleDescription}>
            Affordable rides, standard vehicles
          </Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.vehicleOption,
          selected === 'premium' && styles.vehicleOptionSelected
        ]}
        onPress={() => onSelect('premium')}
      >
        <Icon
          name="car-sports"
          size={24}
          color={selected === 'premium' ? '#10b981' : '#9ca3af'}
          style={styles.vehicleIcon}
        />
        <View>
          <Text
            style={[
              styles.vehicleTitle,
              selected === 'premium' && styles.vehicleTextSelected
            ]}
          >
            Premium
          </Text>
          <Text style={styles.vehicleDescription}>
            Luxury vehicles, professional drivers
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  </View>
);

// Ride summary component
const RideSummary = ({
  pickupAddress,
  destinationAddress,
  vehicleType,
  distance,
  duration,
  estimatedFare,
  isLoadingEstimate,
}: {
  pickupAddress: string;
  destinationAddress: string;
  vehicleType: 'economy' | 'premium';
  distance: number;
  duration: number;
  estimatedFare: number;
  isLoadingEstimate: boolean;
}) => (
  <View style={styles.summaryContainer}>
    <Text style={styles.sectionTitle}>Ride Summary</Text>
    
    {isLoadingEstimate ? (
      <View style={styles.loadingEstimate}>
        <ActivityIndicator size="small" color="#10b981" />
        <Text style={styles.loadingText}>Calculating ride details...</Text>
      </View>
    ) : (
      <>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Route</Text>
          <Text style={styles.summaryValue}>
            {pickupAddress} → {destinationAddress}
          </Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Distance</Text>
          <Text style={styles.summaryValue}>{distance.toFixed(1)} miles</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Estimated Time</Text>
          <Text style={styles.summaryValue}>{duration} minutes</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Vehicle Type</Text>
          <Text style={styles.summaryValue}>
            {vehicleType === 'economy' ? 'Economy' : 'Premium'}
          </Text>
        </View>
        
        <View style={[styles.summaryItem, styles.fareItem]}>
          <Text style={styles.fareLabel}>Estimated Fare</Text>
          <Text style={styles.fareAmount}>${estimatedFare.toFixed(2)}</Text>
        </View>
      </>
    )}
  </View>
);

// Map placeholder component
const MapPlaceholder = () => (
  <View style={styles.mapContainer}>
    <View style={styles.mapPlaceholder}>
      <Icon name="map" size={60} color="#10b98140" />
      <Text style={styles.mapPlaceholderText}>Route Preview</Text>
    </View>
  </View>
);

const BookRideScreen = () => {
  const navigation = useNavigation();
  
  // State variables
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [vehicleType, setVehicleType] = useState<'economy' | 'premium'>('economy');
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(false);
  const [isBookingRide, setIsBookingRide] = useState(false);
  
  // Dummy values (would be calculated from API)
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [estimatedFare, setEstimatedFare] = useState(0);
  
  // Calculate ride estimate when inputs change
  useEffect(() => {
    if (pickupAddress && destinationAddress) {
      calculateEstimate();
    }
  }, [pickupAddress, destinationAddress, vehicleType]);
  
  // Calculate ride estimate
  const calculateEstimate = () => {
    setIsLoadingEstimate(true);
    
    // Simulate API call for route calculation
    setTimeout(() => {
      // In a real app, this would come from Azure Maps or similar API
      const calculatedDistance = Math.random() * 10 + 1; // 1-11 miles
      const calculatedDuration = Math.floor(calculatedDistance * 4); // ~4 min per mile
      
      // Calculate fare based on vehicle type
      const baseFare = vehicleType === 'economy' ? 5 : 10;
      const perMileRate = vehicleType === 'economy' ? 2 : 3.5;
      const calculatedFare = baseFare + (calculatedDistance * perMileRate);
      
      setDistance(calculatedDistance);
      setDuration(calculatedDuration);
      setEstimatedFare(calculatedFare);
      setIsLoadingEstimate(false);
    }, 1000);
  };
  
  // Book ride
  const bookRide = () => {
    if (!pickupAddress || !destinationAddress) {
      Alert.alert('Error', 'Please enter both pickup and destination addresses');
      return;
    }
    
    setIsBookingRide(true);
    
    // Simulate API call to book ride
    setTimeout(() => {
      setIsBookingRide(false);
      
      // In a real app, this would create a ride in the backend and return the ride ID
      const newRideId = Math.floor(Math.random() * 1000) + 1;
      
      // Navigate to tracking screen
      navigation.navigate('Tracking', { rideId: newRideId });
      
      // Reset form
      setPickupAddress('');
      setDestinationAddress('');
      setVehicleType('economy');
    }, 1500);
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Location Inputs */}
        <LocationInput
          label="Pickup Location"
          placeholder="Enter pickup address"
          value={pickupAddress}
          onChangeText={setPickupAddress}
          icon="map-marker"
        />
        
        <LocationInput
          label="Destination"
          placeholder="Enter destination address"
          value={destinationAddress}
          onChangeText={setDestinationAddress}
          icon="map-marker-radius"
        />
        
        {/* Map Preview */}
        <MapPlaceholder />
        
        {/* Vehicle Type Selection */}
        <VehicleTypeSelector
          selected={vehicleType}
          onSelect={setVehicleType}
        />
        
        {/* Ride Summary */}
        {(pickupAddress && destinationAddress) && (
          <RideSummary
            pickupAddress={pickupAddress}
            destinationAddress={destinationAddress}
            vehicleType={vehicleType}
            distance={distance}
            duration={duration}
            estimatedFare={estimatedFare}
            isLoadingEstimate={isLoadingEstimate}
          />
        )}
        
        {/* Book Ride Button */}
        <TouchableOpacity
          style={styles.bookButton}
          onPress={bookRide}
          disabled={isBookingRide || !pickupAddress || !destinationAddress}
        >
          {isBookingRide ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Icon name="car" size={20} color="#ffffff" />
              <Text style={styles.bookButtonText}>Book Ride</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151', // gray-700
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb', // gray-200
    borderRadius: 12,
    backgroundColor: '#f9fafb', // gray-50
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6', // gray-100
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#9ca3af', // gray-400
    marginTop: 8,
  },
  vehicleTypeContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827', // gray-900
    marginBottom: 12,
  },
  vehicleOptions: {
    borderWidth: 1,
    borderColor: '#e5e7eb', // gray-200
    borderRadius: 12,
    overflow: 'hidden',
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb', // gray-200
    backgroundColor: '#ffffff',
  },
  vehicleOptionSelected: {
    backgroundColor: '#ecfdf5', // green-50
  },
  vehicleIcon: {
    marginRight: 16,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827', // gray-900
    marginBottom: 4,
  },
  vehicleTextSelected: {
    color: '#10b981', // primary green
  },
  vehicleDescription: {
    fontSize: 14,
    color: '#6b7280', // gray-500
  },
  summaryContainer: {
    marginBottom: 20,
    backgroundColor: '#f9fafb', // gray-50
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb', // gray-200
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280', // gray-500
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827', // gray-900
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  fareItem: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb', // gray-200
  },
  fareLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827', // gray-900
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981', // primary green
  },
  loadingEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#6b7280', // gray-500
  },
  bookButton: {
    backgroundColor: '#10b981', // primary green
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default BookRideScreen;