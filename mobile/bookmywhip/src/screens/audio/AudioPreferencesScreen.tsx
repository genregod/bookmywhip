import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Slider,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AudioPreferencesScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Audio preferences state
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [contentRating, setContentRating] = useState<'clean' | 'explicit'>('clean');
  const [volume, setVolume] = useState(70);
  const [preferredMoods, setPreferredMoods] = useState<string[]>([]);
  const [allowPersonalization, setAllowPersonalization] = useState(true);

  // Available options (in a real app, these might come from an API)
  const genreOptions = [
    'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Country', 
    'Jazz', 'Classical', 'Electronic', 'Folk', 'Reggae'
  ];
  
  const moodOptions = [
    'Happy', 'Relaxed', 'Energetic', 'Focused',
    'Romantic', 'Chill', 'Melancholic', 'Upbeat'
  ];

  useEffect(() => {
    // Simulate fetching preferences from API
    setTimeout(() => {
      // These would be the actual values from your API
      setFavoriteGenres(['Pop', 'Rock', 'Electronic']);
      setContentRating('clean');
      setVolume(70);
      setPreferredMoods(['Happy', 'Energetic']);
      setAllowPersonalization(true);
      setIsLoading(false);
    }, 1000);
  }, []);

  const toggleGenre = (genre: string) => {
    if (favoriteGenres.includes(genre)) {
      setFavoriteGenres(favoriteGenres.filter(g => g !== genre));
    } else {
      setFavoriteGenres([...favoriteGenres, genre]);
    }
  };

  const toggleMood = (mood: string) => {
    if (preferredMoods.includes(mood)) {
      setPreferredMoods(preferredMoods.filter(m => m !== mood));
    } else {
      setPreferredMoods([...preferredMoods, mood]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // In a real app, you'd send this data to your API
    const preferences = {
      favoriteGenres,
      contentRating,
      volume,
      preferredMoods,
      allowPersonalization,
    };
    
    console.log('Saving preferences:', preferences);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert('Success', 'Your audio preferences have been saved');
    }, 1000);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Audio Preferences</Text>
        <Text style={styles.subtitle}>
          Customize your ride soundtrack experience
        </Text>
      </View>

      {/* Favorite Genres */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Favorite Genres</Text>
        <Text style={styles.sectionSubtitle}>
          Select your favorite music genres
        </Text>
        
        <View style={styles.chipContainer}>
          {genreOptions.map(genre => (
            <TouchableOpacity
              key={genre}
              style={[
                styles.chip,
                favoriteGenres.includes(genre) && styles.chipSelected
              ]}
              onPress={() => toggleGenre(genre)}
            >
              <Text
                style={[
                  styles.chipText,
                  favoriteGenres.includes(genre) && styles.chipTextSelected
                ]}
              >
                {genre}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content Rating */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Content Rating</Text>
        <Text style={styles.sectionSubtitle}>
          Choose your preferred content rating
        </Text>
        
        <View style={styles.ratingContainer}>
          <TouchableOpacity
            style={[
              styles.ratingOption,
              contentRating === 'clean' && styles.ratingSelected
            ]}
            onPress={() => setContentRating('clean')}
          >
            <Icon 
              name="check-circle" 
              size={24} 
              color={contentRating === 'clean' ? '#10b981' : '#d1d5db'} 
              style={styles.ratingIcon}
            />
            <View>
              <Text style={styles.ratingTitle}>Clean</Text>
              <Text style={styles.ratingDescription}>
                No explicit content
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.ratingOption,
              contentRating === 'explicit' && styles.ratingSelected
            ]}
            onPress={() => setContentRating('explicit')}
          >
            <Icon 
              name="check-circle" 
              size={24} 
              color={contentRating === 'explicit' ? '#10b981' : '#d1d5db'} 
              style={styles.ratingIcon}
            />
            <View>
              <Text style={styles.ratingTitle}>Explicit</Text>
              <Text style={styles.ratingDescription}>
                May include explicit content
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Volume */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default Volume</Text>
        <Text style={styles.sectionSubtitle}>
          Set your preferred default volume
        </Text>
        
        <View style={styles.volumeContainer}>
          <Icon name="volume-low" size={24} color="#6b7280" />
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={volume}
            onValueChange={setVolume}
            minimumTrackTintColor="#10b981"
            maximumTrackTintColor="#e5e7eb"
            thumbTintColor="#10b981"
          />
          <Icon name="volume-high" size={24} color="#6b7280" />
          <Text style={styles.volumeText}>{volume}%</Text>
        </View>
      </View>

      {/* Preferred Moods */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferred Moods</Text>
        <Text style={styles.sectionSubtitle}>
          Select moods you enjoy while riding
        </Text>
        
        <View style={styles.chipContainer}>
          {moodOptions.map(mood => (
            <TouchableOpacity
              key={mood}
              style={[
                styles.chip,
                preferredMoods.includes(mood) && styles.chipSelected
              ]}
              onPress={() => toggleMood(mood)}
            >
              <Text
                style={[
                  styles.chipText,
                  preferredMoods.includes(mood) && styles.chipTextSelected
                ]}
              >
                {mood}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Personalization */}
      <View style={styles.section}>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchTitle}>Allow Personalization</Text>
            <Text style={styles.switchDescription}>
              Create playlists based on your ride characteristics
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#e5e7eb', true: '#d1fae5' }}
            thumbColor={allowPersonalization ? '#10b981' : '#9ca3af'}
            onValueChange={setAllowPersonalization}
            value={allowPersonalization}
          />
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

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
  header: {
    padding: 20,
    paddingTop: 30,
    backgroundColor: '#10b981',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
    marginTop: 5,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6', // gray-100
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827', // gray-900
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280', // gray-500
    marginTop: 4,
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  chip: {
    backgroundColor: '#f3f4f6', // gray-100
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 5,
  },
  chipSelected: {
    backgroundColor: '#d1fae5', // green-100
  },
  chipText: {
    color: '#4b5563', // gray-600
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#10b981', // primary green
  },
  ratingContainer: {
    marginTop: 10,
  },
  ratingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb', // gray-50
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6', // gray-100
  },
  ratingSelected: {
    borderColor: '#10b981', // primary green
    backgroundColor: '#ecfdf5', // green-50
  },
  ratingIcon: {
    marginRight: 16,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827', // gray-900
  },
  ratingDescription: {
    fontSize: 14,
    color: '#6b7280', // gray-500
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  volumeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280', // gray-500
    width: 40,
    textAlign: 'right',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827', // gray-900
  },
  switchDescription: {
    fontSize: 14,
    color: '#6b7280', // gray-500
    maxWidth: '80%',
  },
  saveButton: {
    backgroundColor: '#10b981', // primary green
    borderRadius: 8,
    padding: 16,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AudioPreferencesScreen;