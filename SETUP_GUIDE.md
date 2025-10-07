# RentHub Setup Guide

Quick guide to get RentHub running locally or deployed.

## Step 1: Supabase Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Name it "RentHub" or similar
   - Choose a region and strong password
   - Wait for project to be created

2. **Run Database Migration**
   - Go to SQL Editor in your Supabase dashboard
   - The database schema has already been applied via the migration tool
   - Your database is ready to use!

3. **Get API Keys**
   - Go to Project Settings → API
   - Copy your `Project URL` and `anon/public` key
   - These are already in your `.env` file

4. **(Optional) Set Up Storage for Images**
   - Go to Storage in Supabase dashboard
   - Create a new bucket called "property-images"
   - Set it to public for easy image access
   - Upload sample property images

## Step 2: Environment Variables

Your `.env` file should already be configured. If not, create it:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 3: Install & Run

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

The app will open in:
- Web browser (press `w`)
- iOS simulator (press `i` on Mac)
- Android emulator (press `a`)
- Physical device via Expo Go app (scan QR code)

## Step 4: Create Test Users & Data

### Create Your First User
1. Run the app
2. Click "Sign Up" on the auth screen
3. Enter:
   - Full Name: "John Doe"
   - Email: test@example.com
   - Password: password123
4. You'll be logged in automatically

### Add Sample Properties

1. Get your user ID:
   - Go to Supabase Dashboard → Authentication → Users
   - Copy your user's ID

2. Open the SQL Editor in Supabase

3. Run this query (replace USER_ID):

```sql
INSERT INTO properties (
  seller_id,
  title,
  description,
  price,
  location,
  rooms,
  bathrooms,
  square_meters,
  property_type,
  amenities,
  status
) VALUES
(
  'YOUR_USER_ID_HERE',
  'Modern Studio in Downtown',
  'Beautiful studio with city views',
  1200,
  'Manhattan, NY',
  1,
  1,
  45,
  'studio',
  '["WiFi", "Air Conditioning", "Furnished"]'::jsonb,
  'available'
),
(
  'YOUR_USER_ID_HERE',
  'Spacious 2BR Apartment',
  'Perfect for small families',
  2100,
  'Brooklyn, NY',
  2,
  1,
  85,
  'apartment',
  '["WiFi", "Balcony", "Parking"]'::jsonb,
  'available'
);
```

4. Refresh the app to see your properties!

## Step 5: Test the Flow

### As a Buyer:
1. Browse properties on the Home tab
2. Tap the heart icon to like a property
3. Check your Likes tab
4. Tap a property to view details (coming soon)
5. Send a rental request
6. View your request in the Requests tab

### As a Seller:
Coming in future updates! For now, you can:
- Add properties via SQL (as shown above)
- View requests in Supabase dashboard

## Troubleshooting

### "No properties found"
- Make sure you've added sample properties
- Check that properties have `status = 'available'`
- Verify your Supabase connection

### Authentication errors
- Verify your `.env` file has correct values
- Check Supabase project is running
- Try signing out and back in

### Build errors
```bash
# Clear cache and rebuild
rm -rf node_modules
npm install
npm run build:web
```

### Database errors
- Verify all migrations ran successfully
- Check Row Level Security policies are enabled
- Ensure your user is authenticated

## Using with Physical Devices

### iOS (requires Mac)
1. Install Expo Go from App Store
2. Run `npm run dev`
3. Scan QR code with Camera app
4. Opens in Expo Go

### Android
1. Install Expo Go from Play Store
2. Run `npm run dev`
3. Scan QR code with Expo Go app

## Deployment

### Deploy to Expo (Recommended)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for production
eas build --platform all
```

### Deploy Web Version
The web build is in the `dist` folder after running:
```bash
npm run build:web
```

You can deploy this folder to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

## Next Steps

1. **Customize the Design**
   - Edit `constants/Colors.ts` for your brand
   - Modify components in `components/` folder
   - Update app name in `app.json`

2. **Add More Features**
   - Property details screen
   - Image upload functionality
   - Seller dashboard
   - Push notifications
   - In-app messaging

3. **Production Checklist**
   - [ ] Update app.json with your info
   - [ ] Add real app icons
   - [ ] Configure authentication settings
   - [ ] Set up proper error tracking
   - [ ] Enable Supabase RLS everywhere
   - [ ] Test on multiple devices
   - [ ] Set up analytics

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [React Native Documentation](https://reactnative.dev)
- [Expo Router Guide](https://expo.github.io/router)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Expo and Supabase docs
3. Check the code comments for implementation details

Happy building! 🏠
