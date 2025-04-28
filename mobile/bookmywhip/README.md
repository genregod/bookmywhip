# BookMyWhip Mobile App

This is the React Native mobile application for BookMyWhip, a ride-hailing service that provides seamless transportation with personalized features like ride soundtracks.

## Features

- **User Authentication**: Secure login and registration
- **Ride Booking**: Easy interface to book rides
- **Real-time Tracking**: Track your ride in real-time
- **Payment Integration**: Secure payment processing
- **Ride History**: View past rides and details
- **Audio Preferences**: Customize your ride soundtrack experience
- **Personalized Soundtracks**: Generate custom playlists for each ride

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- React Native CLI
- Android Studio for Android development
- Xcode for iOS development

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/bookmywhip.git
   cd bookmywhip/mobile/bookmywhip
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. For iOS, install CocoaPods dependencies:
   ```bash
   cd ios
   pod install
   cd ..
   ```

### Running the App

#### Android

```bash
npm run android
```

#### iOS

```bash
npm run ios
```

## Project Structure

```
mobile/bookmywhip/
├── src/
│   ├── assets/         # Images, fonts, and other static assets
│   ├── components/     # Reusable components
│   ├── hooks/          # Custom React hooks
│   ├── navigation/     # Navigation configuration
│   ├── screens/        # Screen components
│   │   ├── audio/      # Audio preference and soundtrack screens
│   │   ├── auth/       # Authentication screens
│   │   ├── home/       # Home and dashboard screens
│   │   ├── profile/    # User profile screens
│   │   └── rides/      # Ride booking and tracking screens
│   ├── services/       # API services and other external services
│   └── utils/          # Utility functions and helpers
├── App.tsx             # Root component
└── package.json        # Dependencies and scripts
```

## API Integration

The mobile app integrates with the BookMyWhip backend API for all functionality. The API service configuration can be found in `src/services/api.ts`. Make sure to update the `BASE_URL` with your actual API URL.

## Features Implementation

### Audio Preferences

Users can customize their audio preferences including:
- Favorite music genres
- Content rating (clean or explicit)
- Default volume
- Preferred moods
- Personalization settings

### Ride Soundtrack

For each ride, a personalized soundtrack is generated based on:
- User's audio preferences
- Ride duration and distance
- Time of day
- Location context

### Real-time Tracking

The app provides real-time tracking of rides with:
- Current location of the driver
- Estimated time of arrival
- Route visualization
- Ride status updates

### Payment Processing

Secure payment processing with:
- Multiple payment methods
- Saved payment information
- Fare estimates
- Receipt generation

## Building for Production

### Android

```bash
cd android
./gradlew bundleRelease
```

The release bundle will be generated at `android/app/build/outputs/bundle/release/app-release.aab`.

### iOS

Build the app using Xcode by opening the `.xcworkspace` file in the `ios` directory and using the Archive option.

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Your Name - your.email@example.com

Project Link: [https://github.com/yourusername/bookmywhip](https://github.com/yourusername/bookmywhip)