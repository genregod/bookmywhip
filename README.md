# BookMyWhip

A cutting-edge ride-hailing platform built on Azure cloud infrastructure, providing intelligent and scalable transportation solutions with advanced real-time communication capabilities.

## Key Features

- 🗺️ Real-time map visualization with animated routes
- 🚗 Advanced driver-rider matching algorithms
- 💬 Websocket-based real-time communication
- 💰 Secure payment processing with Stripe
- 🔐 Comprehensive authentication and verification
- ☁️ Fully cloud-deployed on Azure infrastructure

## Recent Updates

### Route Animation Enhancements (April 28, 2025)
- Refactored animation component with forwardRef pattern
- Fixed route generation algorithm for realistic paths
- Enhanced car marker visibility with branding colors
- Added dedicated testing interface for route animations

### Azure Integration Updates
- Set up API Management for securing API endpoints
- Implemented Azure Functions for driver matching algorithm
- Created mobile-optimized WebSocket handler for cross-platform communication

## Technology Stack

### Frontend
- React + TypeScript
- Tailwind CSS + shadcn/ui components
- OpenStreetMap + Leaflet for mapping
- WebSocket for real-time communication

### Backend
- Node.js + Express
- PostgreSQL with Drizzle ORM
- WebSocket for real-time updates

### Cloud Services
- Azure API Management
- Azure Functions
- Azure Storage
- Azure Cosmos DB

## Installation and Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Set up PostgreSQL database
5. Run the application: `npm run dev`

## Documentation

- See `/docs` folder for API documentation
- Check CHANGELOG.md for recent updates
- Refer to ChangesMadeThusFor.md for detailed implementation notes