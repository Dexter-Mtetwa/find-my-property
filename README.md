# find-my-property
mobile app for people looking for properties to rent / buy (buyers) and those looking to rent out their properties / sell them (property owners)

# 🏠 FindMyProperty

A modern, full-featured property marketplace mobile application built with React Native and Expo. FindMyProperty allows users to browse, like, and request properties while providing property ownders with tools to manage their listings.

## ✨ Features

### 🏡 Property Management
- **Property Listings**: Browse properties with high-quality images
- **Advanced Search**: Filter by price, location, amenities, and property type
- **Real-time Updates**: Instant updates across all screens
- **Property Details**: Comprehensive property information with specifications
- **Image Carousel**: Multiple property images with smooth navigation

### ❤️ User Experience
- **Like System**: Save favorite properties with instant feedback
- **Request System**: Send requests to property owners
- **Profile Management**: Upload profile pictures and manage user information
- **Dual Mode**: Switch between buyer and seller modes seamlessly
- **Real-time Notifications**: Instant updates for likes and requests

### 🎨 Modern UI/UX
- **Glassy Effects**: Modern glassmorphism design elements
- **Gradient Backgrounds**: Beautiful gradient overlays
- **Custom Alerts**: Personalized modal system replacing native alerts
- **Responsive Design**: Optimized for both mobile and tablet
- **Smooth Animations**: Fluid transitions and micro-interactions

### 🔐 Authentication & Security
- **Supabase Auth**: Secure user authentication
- **Profile Management**: Complete user profiles with contact information
- **Data Validation**: Comprehensive input validation
- **Secure Storage**: Encrypted data storage

## 🛠️ Tech Stack

- **Frontend**: React Native, Expo
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Navigation**: Expo Router
- **UI Components**: Custom components with Lucide React Native icons
- **State Management**: React Context API
- **Styling**: StyleSheet with custom design system
- **Real-time**: Supabase Realtime subscriptions

## 📱 Screenshots

The app features a clean, modern interface with:
- Property browsing with glassy card effects
- Detailed property views with image carousels
- User profiles with photo uploads
- Real-time likes and requests
- Seller dashboard for property management

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Expo CLI
- Supabase account
- iOS Simulator or Android Emulator (for testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/findmyproperty.git
   cd findmyproperty
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the migration files in `supabase/migrations/`
   - Update `lib/supabase.ts` with your project credentials

4. **Configure environment variables**
   ```bash
   # Create .env file with your Supabase credentials
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Run on device/simulator**
   - Scan QR code with Expo Go app (mobile)
   - Press `i` for iOS simulator
   - Press `a` for Android emulator

## 📁 Project Structure
