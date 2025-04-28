import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Mock data for the soundtrack playlist
const MOCK_PLAYLIST = [
  { id: '1', title: 'Cruise Control', artist: 'The Navigators', duration: '3:45' },
  { id: '2', title: 'Highway Journey', artist: 'Road Kings', duration: '4:12' },
  { id: '3', title: 'City Lights', artist: 'Urban Voyagers', duration: '3:21' },
  { id: '4', title: 'Morning Drive', artist: 'Dawn Riders', duration: '2:58' },
  { id: '5', title: 'Sunset Road', artist: 'Twilight Travelers', duration: '4:05' },
  { id: '6', title: 'Downtown Groove', artist: 'Metropolitan', duration: '3:34' },
  { id: '7', title: 'Coastal Highway', artist: 'Ocean Drive', duration: '5:20' },
  { id: '8', title: 'Rush Hour', artist: 'Traffic Jam', duration: '2:47' },
];

const SoundtrackScreen = () => {
  const navigation = useNavigation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePlaylist = () => {
    setIsGenerating(true);
    
    // Simulate playlist generation API call
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  const handlePlayTrack = (trackId: string) => {
    setIsLoading(true);
    
    // Simulate loading the track
    setTimeout(() => {
      setCurrentTrack(trackId);
      setIsPlaying(true);
      setIsLoading(false);
    }, 1000);
  };

  const handleTogglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const renderItem = ({ item }: { item: typeof MOCK_PLAYLIST[0] }) => {
    const isActive = currentTrack === item.id;
    
    return (
      <TouchableOpacity 
        style={[styles.trackItem, isActive && styles.activeTrack]}
        onPress={() => handlePlayTrack(item.id)}
      >
        <View style={styles.trackInfo}>
          <Text style={[styles.trackTitle, isActive && styles.activeText]}>
            {item.title}
          </Text>
          <Text style={[styles.trackArtist, isActive && styles.activeText]}>
            {item.artist}
          </Text>
        </View>
        <Text style={[styles.trackDuration, isActive && styles.activeText]}>
          {item.duration}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Ride Soundtrack</Text>
        <Text style={styles.subtitle}>
          Custom playlist generated based on your preferences and route
        </Text>
      </View>

      <View style={styles.playlistContainer}>
        {isGenerating ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Generating your playlist...</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={MOCK_PLAYLIST}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.playlist}
            />

            <View style={styles.playerControls}>
              {currentTrack && (
                <View style={styles.nowPlaying}>
                  <Text style={styles.nowPlayingLabel}>Now Playing:</Text>
                  <Text style={styles.nowPlayingTitle}>
                    {MOCK_PLAYLIST.find(track => track.id === currentTrack)?.title || ''}
                  </Text>
                </View>
              )}

              <View style={styles.controls}>
                <TouchableOpacity style={styles.controlButton}>
                  <Text style={styles.controlIcon}>⏮</Text>
                </TouchableOpacity>
                
                {isLoading ? (
                  <ActivityIndicator size="small" color="#4CAF50" />
                ) : (
                  <TouchableOpacity 
                    style={[styles.controlButton, styles.playPauseButton]}
                    onPress={handleTogglePlayPause}
                    disabled={!currentTrack}
                  >
                    <Text style={styles.controlIcon}>
                      {isPlaying ? '⏸' : '▶️'}
                    </Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity style={styles.controlButton}>
                  <Text style={styles.controlIcon}>⏭</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>

      <TouchableOpacity 
        style={styles.generateButton}
        onPress={handleGeneratePlaylist}
        disabled={isGenerating}
      >
        <Text style={styles.generateButtonText}>
          {isGenerating ? 'Generating...' : 'Generate New Playlist'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  playlistContainer: {
    flex: 1,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  playlist: {
    paddingBottom: 16,
  },
  trackItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f7f7f7',
  },
  activeTrack: {
    backgroundColor: '#4CAF50',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 14,
    color: '#666',
  },
  trackDuration: {
    fontSize: 14,
    color: '#666',
  },
  activeText: {
    color: '#fff',
  },
  playerControls: {
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    padding: 16,
  },
  nowPlaying: {
    marginBottom: 16,
    alignItems: 'center',
  },
  nowPlayingLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  nowPlayingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  playPauseButton: {
    backgroundColor: '#4CAF50',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  controlIcon: {
    fontSize: 24,
    color: '#333',
  },
  generateButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SoundtrackScreen;