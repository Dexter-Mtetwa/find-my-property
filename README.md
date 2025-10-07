# RentHub - Rental Marketplace App

A modern, mobile-first rental marketplace connecting tenants with property owners. Built with React Native (Expo) and Supabase.

## Features

### For Tenants (Buyers)
- Browse available properties with beautiful card-based UI
- Search and filter properties by location, price, and amenities
- Save favorite properties with one-tap like
- Send rental requests (one active request at a time)
- Track request status in real-time
- View request history

### For Property Owners (Sellers)
- List properties with multiple photos
- Manage property details and availability
- Receive and respond to rental requests
- View property analytics (views, likes, requests)
- Mark properties as rented or remove from market

## Tech Stack

- **Framework**: React Native with Expo SDK
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **UI Components**: Custom components with React Native
- **Styling**: StyleSheet with custom design system
- **Fonts**: Inter & Poppins (Google Fonts)
- **Icons**: Lucide React Native
- **Animations**: React Native Reanimated & Animated API

## Design System

### Colors
- Primary Gradient: Purple to Deep Purple (#667eea → #764ba2)
- Primary Action: #5E72E4
- Secondary/Heart: #F5365C
- Success: #2DCE89
- Warning: #FB6340

### Typography
- Display: Poppins Bold
- Headings: Poppins SemiBold
- Body: Inter Regular
- Emphasis: Inter SemiBold/Bold

## Database Schema

### Core Tables
- `profiles` - User profiles with buyer/seller information
- `properties` - Property listings with details and status
- `property_images` - Multiple images per property
- `requests` - Rental requests with status tracking
- `likes` - Saved properties per user
- `property_views` - View tracking for analytics
- `rental_history` - Completed rental records

### Key Features
- Row Level Security (RLS) enabled on all tables
- Atomic request creation via RPC function
- Single active request constraint enforced
- Automatic property status updates

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Expo CLI
- Supabase account and project

### Environment Setup

1. Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Set up Supabase:
   - Create a new Supabase project
   - Run the migration SQL (from database schema)
   - Configure authentication settings
   - Set up storage bucket for property images (optional)

3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev
```

### Building for Web

```bash
npm run build:web
```

## Project Structure

```
├── app/
│   ├── (tabs)/              # Tab-based navigation
│   │   ├── index.tsx        # Home/Browse screen
│   │   ├── likes.tsx        # Saved properties
│   │   ├── requests.tsx     # Rental requests
│   │   └── profile.tsx      # User profile
│   ├── _layout.tsx          # Root layout with providers
│   ├── index.tsx            # Splash screen
│   └── auth.tsx             # Login/Signup screen
├── components/
│   └── PropertyCard.tsx     # Reusable property card
├── contexts/
│   └── AuthContext.tsx      # Authentication state
├── lib/
│   └── supabase.ts          # Supabase client
├── types/
│   └── database.ts          # TypeScript types
├── constants/
│   └── Colors.ts            # Design system colors
└── scripts/
    └── seed-data.sql        # Sample data
```

## Key Features Implementation

### Single Active Request
- Buyers can only have one pending request at a time
- Enforced at database level via RPC function
- Properties automatically locked when requested
- Released when request is resolved or cancelled

### Property Status Management
- `available` - Open for requests
- `requested` - Has pending request
- `rented` - Successfully rented
- `removed` - Removed from market

### Real-time Updates
- Instant like/unlike feedback
- Request status updates
- Property availability changes

## Security

- All tables protected by Row Level Security (RLS)
- Users can only modify their own data
- Property owners control their listings
- Request creation uses secure RPC function
- Input validation on all forms

## Future Enhancements

- [ ] Property details screen with image carousel
- [ ] Seller interface for managing properties
- [ ] Push notifications for request updates
- [ ] Advanced filtering (price range, amenities)
- [ ] Map view for property locations
- [ ] In-app messaging between users
- [ ] Property comparison feature
- [ ] Reviews and ratings system
- [ ] Payment integration
- [ ] Calendar for property availability

## Contributing

This is a demo project. Feel free to fork and customize for your needs.

## License

MIT License
