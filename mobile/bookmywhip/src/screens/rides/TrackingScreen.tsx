import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type RouteParams = {
  rideId: number;
};

// Status timeline component
const StatusTimeline = ({ 
  currentStatus 
}: { 
  currentStatus: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' 
}) => {
  // Define steps and their completion status
  const steps = [
    { id: 'requested', label: 'Requested', icon: 'car-clock' },
    { id: 'accepted', label: 'Driver Coming', icon: 'car-arrow-right' },
    { id: 'in_progress', label: 'In Progress', icon: 'car-cruise-control' },
    { id: 'completed', label: 'Completed', icon: 'check-circle' },
  ];

  // Determine which steps are completed based on current status
  const getStepStatus = (stepId: string) => {
    if (currentStatus === 'cancelled') {
      return stepId === 'requested' ? 'completed' : 
             stepId === 'cancelled' ? 'active' : 'pending';
    }

    const statusOrder = {
      requested: 0,
      accepted: 1,
      in_progress: 2,
      completed: 3
    };

    const currentIdx = statusOrder[currentStatus];
    const stepIdx = statusOrder[stepId as keyof typeof statusOrder] || 0;

    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'active';
    return 'pending';
  };

  return (
    <View style={styles.timelineContainer}>
      {steps.map((step, index) => {
        const stepStatus = getStepStatus(step.id);
        const isLast = index === steps.length - 1;

        return (
          <View key={step.id} style={styles.timelineStep}>
            <View style={styles.stepIconContainer}>
              <View 
                style={[
                  styles.stepCircle,
                  stepStatus === 'completed' && styles.stepCompleted,
                  stepStatus === 'active' && styles.stepActive,
                ]}
              >
                <Icon 
                  name={step.icon} 
                  size={16} 
                  color={
                    stepStatus === 'completed' || stepStatus === 'active' 
                      ? '#fff' 
                      : '#9ca3af'
                  } 
                />
              </View>
              {!isLast && (
                <View 
                  style={[
                    styles.stepLine,
                    stepStatus === 'completed' && styles.stepLineCompleted
                  ]} 
                />
              )}
            </View>
            <View style={styles.stepContent}>
              <Text 
                style={[
                  styles.stepLabel,
                  stepStatus === 'completed' && styles.stepLabelCompleted,
                  stepStatus === 'active' && styles.stepLabelActive,
                ]}
              >
                {step.label}
              </Text>
              {stepStatus === 'active' && step.id === 'in_progress' && (
                <Text style={styles.estimatedTime}>
                  Arriving in 10 minutes
                </Text>
              )}
            </View>
          </View>
        );
      })}

      {currentStatus === 'cancelled' && (
        <View style={styles.timelineStep}>
          <View style={styles.stepIconContainer}>
            <View style={[styles.stepCircle, styles.stepCancelled]}>
              <Icon name="close-circle" size={16} color="#fff" />
            </View>
          </View>
          <View style={styles.stepContent}>
            <Text style={[styles.stepLabel, styles.stepLabelCancelled]}>
              Cancelled
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

// Map placeholder component
const MapPlaceholder = () => (
  <View style={styles.mapPlaceholder}>
    <Icon name="map" size={80} color="#10b98150" />
    <Text style={styles.mapPlaceholderText}>Live Tracking Map</Text>
  </View>
);

// Driver info component
const DriverInfo = () => (
  <View style={styles.driverContainer}>
    <View style={styles.driverHeader}>
      <Text style={styles.sectionTitle}>Driver Information</Text>
      <TouchableOpacity style={styles.contactButton}>
        <Icon name="phone" size={20} color="#10b981" />
      </TouchableOpacity>
    </View>

    <View style={styles.driverContent}>
      <View style={styles.driverAvatar}>
        <Icon name="account" size={30} color="#10b981" />
      </View>
      <View style={styles.driverDetails}>
        <Text style={styles.driverName}>Michael Johnson</Text>
        <View style={styles.ratingContainer}>
          <Icon name="star" size={16} color="#f59e0b" />
          <Text style={styles.ratingText}>4.9</Text>
        </View>
      </View>
      <View style={styles.vehicleDetails}>
        <Text style={styles.vehicleName}>Toyota Camry</Text>
        <Text style={styles.licensePlate}>ABC 1234</Text>
      </View>
    </View>
  </View>
);

// Ride details component
const RideDetails = ({ 
  pickupAddress, 
  destinationAddress 
}: { 
  pickupAddress: string; 
  destinationAddress: string;
}) => (
  <View style={styles.rideDetailsContainer}>
    <Text style={styles.sectionTitle}>Ride Details</Text>
    
    <View style={styles.addressContainer}>
      <View style={styles.addressRow}>
        <View style={styles.addressIconContainer}>
          <Icon name="circle-outline" size={14} color="#10b981" />
          <View style={styles.addressLine} />
        </View>
        <View style={styles.addressContent}>
          <Text style={styles.addressLabel}>Pickup</Text>
          <Text style={styles.addressText}>{pickupAddress}</Text>
        </View>
      </View>
      
      <View style={styles.addressRow}>
        <View style={styles.addressIconContainer}>
          <Icon name="map-marker" size={14} color="#10b981" />
        </View>
        <View style={styles.addressContent}>
          <Text style={styles.addressLabel}>Destination</Text>
          <Text style={styles.addressText}>{destinationAddress}</Text>
        </View>
      </View>
    </View>
    
    <View style={styles.rideMetaContainer}>
      <View style={styles.rideMetaItem}>
        <Icon name="clock-outline" size={18} color="#6b7280" />
        <Text style={styles.rideMetaText}>15 min</Text>
      </View>
      
      <View style={styles.rideMetaItem}>
        <Icon name="map-marker-distance" size={18} color="#6b7280" />
        <Text style={styles.rideMetaText}>3.2 mi</Text>
      </View>
      
      <View style={styles.rideMetaItem}>
        <Icon name="cash" size={18} color="#6b7280" />
        <Text style={styles.rideMetaText}>$12.50</Text>
      </View>
    </View>
  </View>
);

// Soundtrack button component
const SoundtrackButton = ({ 
  rideId, 
  navigation 
}: { 
  rideId: number; 
  navigation: any;
}) => (
  <TouchableOpacity 
    style={styles.soundtrackButton}
    onPress={() => navigation.navigate('Soundtrack', { rideId })}
  >
    <Icon name="music" size={20} color="#10b981" />
    <Text style={styles.soundtrackButtonText}>View Ride Soundtrack</Text>
  </TouchableOpacity>
);

const TrackingScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { rideId } = route.params as RouteParams;
  
  const [isLoading, setIsLoading] = useState(true);
  const [ride, setRide] = useState({
    status: 'accepted' as 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled',
    pickupAddress: '123 Main St, Anytown, CA',
    destinationAddress: '456 Market St, Anytown, CA',
  });

  // Simulate fetching ride data
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  // Cancel ride
  const cancelRide = () => {
    // In a real app, this would call the API to cancel the ride
    setRide({ ...ride, status: 'cancelled' });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading ride information...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Status Steps */}
      <View style={styles.statusContainer}>
        <StatusTimeline currentStatus={ride.status} />
      </View>
      
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapPlaceholder />
      </View>
      
      {/* Driver Info */}
      {ride.status !== 'requested' && ride.status !== 'cancelled' && (
        <DriverInfo />
      )}
      
      {/* Ride Details */}
      <RideDetails
        pickupAddress={ride.pickupAddress}
        destinationAddress={ride.destinationAddress}
      />
      
      {/* Soundtrack Button */}
      {ride.status === 'in_progress' && (
        <SoundtrackButton rideId={rideId} navigation={navigation} />
      )}
      
      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {ride.status === 'requested' || ride.status === 'accepted' ? (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={cancelRide}
          >
            <Text style={styles.cancelButtonText}>Cancel Ride</Text>
          </TouchableOpacity>
        ) : ride.status === 'completed' ? (
          <TouchableOpacity 
            style={styles.rateButton}
            onPress={() => console.log('Rate ride')}
          >
            <Icon name="star" size={20} color="#ffffff" />
            <Text style={styles.rateButtonText}>Rate This Ride</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    color: '#6b7280',
    fontSize: 16,
  },
  statusContainer: {
    padding: 20,
    backgroundColor: '#f9fafb', // gray-50
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb', // gray-200
  },
  timelineContainer: {
    paddingVertical: 10,
  },
  timelineStep: {
    flexDirection: 'row',
    minHeight: 50,
  },
  stepIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6', // gray-100
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb', // gray-200
  },
  stepActive: {
    backgroundColor: '#10b981', // primary green
    borderColor: '#10b981',
  },
  stepCompleted: {
    backgroundColor: '#34d399', // green-400
    borderColor: '#34d399',
  },
  stepCancelled: {
    backgroundColor: '#ef4444', // red-500
    borderColor: '#ef4444',
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e5e7eb', // gray-200
    marginVertical: 1,
  },
  stepLineCompleted: {
    backgroundColor: '#34d399', // green-400
  },
  stepContent: {
    flex: 1,
    paddingLeft: 10,
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280', // gray-500
  },
  stepLabelActive: {
    fontWeight: '600',
    color: '#10b981', // primary green
  },
  stepLabelCompleted: {
    color: '#34d399', // green-400
  },
  stepLabelCancelled: {
    color: '#ef4444', // red-500
    fontWeight: '600',
  },
  estimatedTime: {
    fontSize: 12,
    color: '#6b7280', // gray-500
    marginTop: 2,
  },
  mapContainer: {
    height: height * 0.3,
    backgroundColor: '#f3f4f6', // gray-100
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#9ca3af', // gray-400
    marginTop: 10,
  },
  driverContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb', // gray-200
  },
  driverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827', // gray-900
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ecfdf5', // green-50
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ecfdf5', // green-50
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827', // gray-900
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280', // gray-500
    marginLeft: 4,
  },
  vehicleDetails: {
    alignItems: 'flex-end',
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151', // gray-700
    marginBottom: 4,
  },
  licensePlate: {
    fontSize: 14,
    color: '#6b7280', // gray-500
  },
  rideDetailsContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb', // gray-200
  },
  addressContainer: {
    marginTop: 15,
    marginBottom: 20,
  },
  addressRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  addressIconContainer: {
    width: 30,
    alignItems: 'center',
  },
  addressLine: {
    width: 2,
    height: 20,
    backgroundColor: '#10b981', // primary green
    marginTop: 3,
  },
  addressContent: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    color: '#6b7280', // gray-500
    marginBottom: 2,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827', // gray-900
  },
  rideMetaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6', // gray-100
    paddingTop: 15,
  },
  rideMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rideMetaText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280', // gray-500
  },
  soundtrackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecfdf5', // green-50
    borderRadius: 8,
    padding: 14,
    margin: 20,
  },
  soundtrackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981', // primary green
    marginLeft: 8,
  },
  actionsContainer: {
    padding: 20,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6', // gray-100
    borderWidth: 1,
    borderColor: '#e5e7eb', // gray-200
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444', // red-500
  },
  rateButton: {
    backgroundColor: '#10b981', // primary green
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  rateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
});

export default TrackingScreen;