/**
 * Soundtrack service for the BookMyWhip mobile app
 * Handles audio preferences and ride soundtrack generation/playback
 */

import axios from 'axios';
import { API_CONFIG } from '../utils/config';

// Types
export interface AudioPreferences {
  userId: number;
  favoriteGenres: string[];
  contentRating: 'clean' | 'explicit';
  volume: number; // 0-100
  preferredMoods: string[];
  allowPersonalization: boolean;
}

export interface Track {
  id: number;
  title: string;
  artist: string;
  duration: string; // Format: "3:45"
  audioUrl?: string;
}

export interface Soundtrack {
  id: number;
  rideId: number;
  name: string;
  description: string;
  genre: string;
  mood: string;
  duration: number; // minutes
  trackCount: number;
  coverImage: string | null;
  tracks: Track[];
  createdAt: string;
}

export interface SoundtrackGenerationOptions {
  genre?: string;
  mood?: string;
  maxDuration?: number; // minutes
  contentRating?: 'clean' | 'explicit';
}

class SoundtrackService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_CONFIG.BASE_URL}/api`;
  }

  /**
   * Get audio preferences for a user
   * @param userId User ID
   * @returns User's audio preferences
   */
  async getAudioPreferences(userId: number): Promise<AudioPreferences> {
    try {
      const response = await axios.get(`${this.baseUrl}/users/${userId}/audio-preferences`);
      return response.data;
    } catch (error) {
      console.error('Error getting audio preferences:', error);
      throw error;
    }
  }

  /**
   * Update audio preferences for a user
   * @param userId User ID
   * @param preferences Updated audio preferences
   * @returns Updated audio preferences
   */
  async updateAudioPreferences(
    userId: number,
    preferences: Partial<AudioPreferences>
  ): Promise<AudioPreferences> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/users/${userId}/audio-preferences`,
        preferences
      );
      return response.data;
    } catch (error) {
      console.error('Error updating audio preferences:', error);
      throw error;
    }
  }

  /**
   * Get soundtrack for a ride
   * @param rideId Ride ID
   * @returns Ride soundtrack details
   */
  async getRideSoundtrack(rideId: number): Promise<Soundtrack> {
    try {
      const response = await axios.get(`${this.baseUrl}/rides/${rideId}/soundtrack`);
      return response.data;
    } catch (error) {
      console.error('Error getting ride soundtrack:', error);
      throw error;
    }
  }

  /**
   * Generate a new soundtrack for a ride
   * @param rideId Ride ID
   * @param options Optional generation parameters
   * @returns Generated soundtrack
   */
  async generateSoundtrack(
    rideId: number,
    options?: SoundtrackGenerationOptions
  ): Promise<Soundtrack> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/rides/${rideId}/generate-soundtrack`,
        options
      );
      return response.data;
    } catch (error) {
      console.error('Error generating soundtrack:', error);
      throw error;
    }
  }

  /**
   * Get soundtrack by ID
   * @param soundtrackId Soundtrack ID
   * @returns Soundtrack details
   */
  async getSoundtrackById(soundtrackId: number): Promise<Soundtrack> {
    try {
      const response = await axios.get(`${this.baseUrl}/soundtrack-playlists/${soundtrackId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting soundtrack:', error);
      throw error;
    }
  }

  /**
   * Rate a soundtrack
   * @param soundtrackId Soundtrack ID
   * @param rating Rating (1-5)
   * @returns Success status
   */
  async rateSoundtrack(
    soundtrackId: number,
    rating: number
  ): Promise<{ success: boolean }> {
    try {
      const response = await axios.post(`${this.baseUrl}/soundtrack-playlists/${soundtrackId}/rate`, {
        rating,
      });
      return response.data;
    } catch (error) {
      console.error('Error rating soundtrack:', error);
      throw error;
    }
  }

  /**
   * Get available genres
   * @returns List of available music genres
   */
  async getAvailableGenres(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/soundtrack/genres`);
      return response.data;
    } catch (error) {
      console.error('Error getting available genres:', error);
      throw error;
    }
  }

  /**
   * Get available moods
   * @returns List of available music moods
   */
  async getAvailableMoods(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/soundtrack/moods`);
      return response.data;
    } catch (error) {
      console.error('Error getting available moods:', error);
      throw error;
    }
  }
}

export default new SoundtrackService();