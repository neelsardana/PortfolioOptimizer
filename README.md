# Portfolio Optimization Platform

A modern full-stack application for optimizing investment portfolios using market data and AI-powered analysis.

## Core Functionality

### Portfolio Optimization
- Analyze and optimize investment portfolios based on various market metrics
- Access real-time market data through dedicated API endpoints
- Generate optimized portfolio recommendations based on risk tolerance and investment goals

### Data Processing
- **Market Data Integration**: 
  - Fetch and process market data through `/api/market-data`
  - Real-time asset information via `/api/asset-data`
- **Portfolio Analysis**:
  - Portfolio optimization calculations via `/api/optimize-portfolio`
  - Risk assessment and rebalancing recommendations

### Project Structure
```
src/
├── app/
│   ├── api/                    # API endpoints
│   │   ├── market-data/        # Market data fetching
│   │   ├── asset-data/         # Asset information
│   │   └── optimize-portfolio/ # Portfolio optimization
│   ├── components/             # React components
│   └── lib/                    # Utility functions
```

## Technical Architecture

### Frontend
- Built with Next.js 14 App Router for optimal performance
- React components for interactive portfolio management
- TailwindCSS for responsive design
- TypeScript for type safety

### Backend
- API Routes for data processing and portfolio optimization
- Firebase integration for:
  - User authentication
  - Portfolio data storage
  - Real-time updates

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Firebase configuration:
     ```env
     NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
     ```
4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Security Notes

1. **Environment Variables**: 
   - Never commit `.env.local` or any other files containing actual API keys
   - Use `.env.example` as a template for required environment variables
   - Keep all API keys and secrets secure

2. **Firebase Security**:
   - Set up proper Firebase Security Rules for your database and storage
   - Configure authentication providers in Firebase Console
   - Restrict API key usage in Firebase Console

3. **API Security**:
   - All API routes are protected and require authentication
   - Rate limiting is implemented on API routes
   - Data validation is performed on all inputs

## Key Features

### Portfolio Management
- Create and manage multiple investment portfolios
- Track portfolio performance in real-time
- Visualize asset allocation and performance metrics

### Optimization Engine
- Risk-adjusted return optimization
- Portfolio rebalancing recommendations
- Custom optimization constraints

### User Authentication
- Secure user authentication via Firebase
- Personalized portfolio tracking
- Data persistence across sessions

## Technologies

- Next.js 14 (App Router)
- React
- TypeScript
- TailwindCSS
- Firebase (Auth, Storage, Database)