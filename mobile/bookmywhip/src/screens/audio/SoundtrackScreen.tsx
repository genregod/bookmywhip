import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type RouteParams = {
  rideId: number;
};

const SoundtrackScreen = () => {
  const route = useRoute();
  const { rideId } = route.params as RouteParams;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  
  // Soundtrack data
  const [soundtrack, setSoundtrack] = useState({
    name: '',
    description: '',
    genre: '',
    mood: '',
    duration: 0,
    trackCount: 0,
    coverImage: null,
    tracks: [],
  });

  // Simulate fetching soundtrack data
  useEffect(() => {
    // In a real app, you'd fetch this from your API using the rideId
    setTimeout(() => {
      setSoundtrack({
        name: 'Urban Cruiser',
        description: 'An energetic playlist to keep you moving through the city streets',
        genre: 'Electronic',
        mood: 'Energetic',
        duration: 45, // minutes
        trackCount: 12,
        coverImage: null, // This would be a URL to an image
        tracks: [
          { id: 1, title: 'City Lights', artist: 'Neon Drive', duration: '3:24' },
          { id: 2, title: 'Midnight Cruise', artist: 'Urban Beats', duration: '4:12' },
          { id: 3, title: 'Downtown Flow', artist: 'Street Rhythm', duration: '3:56' },
          { id: 4, title: 'Electric Avenue', artist: 'Pulse Wave', duration: '3:45' },
          { id: 5, title: 'Traffic Jam', artist: 'Metro Sounds', duration: '3:30' },
          { id: 6, title: 'Rush Hour', artist: 'City Pulse', duration: '4:02' },
          { id: 7, title: 'Neon Signs', artist: 'Night Driver', duration: '3:51' },
          { id: 8, title: 'Urban Jungle', artist: 'Concrete Beats', duration: '3:38' },
          { id: 9, title: 'Street Corner', artist: 'Traffic Light', duration: '4:15' },
          { id: 10, title: 'Fast Lane', artist: 'Highway Rhythm', duration: '3:44' },
          { id: 11, title: 'Skyline View', artist: 'Tower Sounds', duration: '3:29' },
          { id: 12, title: 'Journey\'s End', artist: 'Arrival Point', duration: '4:32' },
        ],
      });
      setIsLoading(false);
    }, 1500);
  }, [rideId]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    if (currentTrackIndex < soundtrack.tracks.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
    }
  };

  const prevTrack = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    }
  };

  // Current track being "played"
  const currentTrack = soundtrack.tracks[currentTrackIndex];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading your soundtrack...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header with cover art */}
      <View style={styles.header}>
        <View style={styles.coverArtContainer}>
          {soundtrack.coverImage ? (
            <Image 
              source={{ uri: soundtrack.coverImage }} 
              style={styles.coverArt}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.coverArtPlaceholder}>
              <Icon name="music" size={80} color="#10b98150" />
            </View>
          )}
        </View>
        <Text style={styles.playlistName}>{soundtrack.name}</Text>
        <Text style={styles.playlistDescription}>{soundtrack.description}</Text>
        
        <View style={styles.metadataContainer}>
          <View style={styles.metadataItem}>
            <Icon name="music-note" size={18} color="#10b981" />
            <Text style={styles.metadataText}>
              Genre: {soundtrack.genre}
            </Text>
          </View>
          
          <View style={styles.metadataItem}>
            <Icon name="emoticon" size={18} color="#10b981" />
            <Text style={styles.metadataText}>
              Mood: {soundtrack.mood}
            </Text>
          </View>
          
          <View style={styles.metadataItem}>
            <Icon name="clock-outline" size={18} color="#10b981" />
            <Text style={styles.metadataText}>
              {soundtrack.duration} minutes
            </Text>
          </View>
          
          <View style={styles.metadataItem}>
            <Icon name="playlist-music" size={18} color="#10b981" />
            <Text style={styles.metadataText}>
              {soundtrack.trackCount} tracks
            </Text>
          </View>
        </View>
      </View>

      {/* Now Playing */}
      <View style={styles.nowPlayingContainer}>
        <Text style={styles.nowPlayingTitle}>Now Playing</Text>
        
        {currentTrack && (
          <View style={styles.currentTrackContainer}>
            <View style={styles.trackInfoContainer}>
              <Text style={styles.currentTrackTitle}>{currentTrack.title}</Text>
              <Text style={styles.currentTrackArtist}>{currentTrack.artist}</Text>
            </View>
            
            <Text style={styles.trackDuration}>{currentTrack.duration}</Text>
          </View>
        )}
        
        <View style={styles.playerControls}>
          <TouchableOpacity onPress={prevTrack} style={styles.controlButton}>
            <Icon name="skip-previous" size={30} color="#374151" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseButton}>
            <Icon name={isPlaying ? "pause" : "play"} size={30} color="#ffffff" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={nextTrack} style={styles.controlButton}>
            <Icon name="skip-next" size={30} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tracklist */}
      <View style={styles.tracklistContainer}>
        <Text style={styles.tracklistTitle}>Tracklist</Text>
        
        {soundtrack.tracks.map((track, index) => (
          <TouchableOpacity 
            key={track.id}
            style={[
              styles.trackItem,
              currentTrackIndex === index && styles.currentTrackItem
            ]}
            onPress={() => setCurrentTrackIndex(index)}
          >
            <View style={styles.trackItemContent}>
              <Text style={styles.trackNumber}>{index + 1}</Text>
              <View style={styles.trackItemInfo}>
                <Text 
                  style={[
                    styles.trackTitle,
                    currentTrackIndex === index && styles.currentTrackItemText
                  ]}
                  numberOfLines={1}
                >
                  {track.title}
                </Text>
                <Text 
                  style={[
                    styles.trackArtist,
                    currentTrackIndex === index && styles.currentTrackItemSubtext
                  ]}
                  numberOfLines={1}
                >
                  {track.artist}
                </Text>
              </View>
            </View>
            <Text 
              style={[
                styles.trackItemDuration,
                currentTrackIndex === index && styles.currentTrackItemText
              ]}
            >
              {track.duration}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Call-to-action for Audio Preferences */}
      <TouchableOpacity style={styles.preferencesButton}>
        <Text style={styles.preferencesButtonText}>Customize Audio Preferences</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

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
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#6b7280',
    fontSize: 16,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f9fafb', // gray-50
  },
  coverArtContainer: {
    width: width - 100,
    height: width - 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6', // gray-100
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  coverArt: {
    width: '100%',
    height: '100%',
  },
  coverArtPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ecfdf5', // green-50
  },
  playlistName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827', // gray-900
    textAlign: 'center',
    marginBottom: 8,
  },
  playlistDescription: {
    fontSize: 16,
    color: '#6b7280', // gray-500
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  metadataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6', // gray-100
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  metadataText: {
    fontSize: 14,
    color: '#374151', // gray-700
    marginLeft: 6,
  },
  nowPlayingContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6', // gray-100
  },
  nowPlayingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827', // gray-900
    marginBottom: 15,
  },
  currentTrackContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  trackInfoContainer: {
    flex: 1,
  },
  currentTrackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827', // gray-900
  },
  currentTrackArtist: {
    fontSize: 14,
    color: '#6b7280', // gray-500
  },
  trackDuration: {
    fontSize: 14,
    color: '#6b7280', // gray-500
  },
  playerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    padding: 10,
  },
  playPauseButton: {
    backgroundColor: '#10b981', // primary green
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  tracklistContainer: {
    padding: 20,
  },
  tracklistTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827', // gray-900
    marginBottom: 15,
  },
  trackItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6', // gray-100
  },
  currentTrackItem: {
    backgroundColor: '#ecfdf5', // green-50
    borderRadius: 8,
    paddingHorizontal: 10,
    marginHorizontal: -10,
  },
  trackItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  trackNumber: {
    width: 30,
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280', // gray-500
    textAlign: 'center',
  },
  trackItemInfo: {
    flex: 1,
    marginLeft: 10,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827', // gray-900
  },
  trackArtist: {
    fontSize: 13,
    color: '#6b7280', // gray-500
  },
  trackItemDuration: {
    fontSize: 14,
    color: '#6b7280', // gray-500
    marginLeft: 10,
  },
  currentTrackItemText: {
    color: '#059669', // green-600
    fontWeight: '600',
  },
  currentTrackItemSubtext: {
    color: '#10b981', // green-500
  },
  preferencesButton: {
    backgroundColor: '#f3f4f6', // gray-100
    borderRadius: 8,
    padding: 16,
    margin: 20,
    alignItems: 'center',
  },
  preferencesButtonText: {
    color: '#10b981', // primary green
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SoundtrackScreen;