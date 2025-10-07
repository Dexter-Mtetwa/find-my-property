# 🚀 Quick Start - Get RentHub Running in 5 Minutes

## Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works!)

## 1️⃣ Clone & Install (1 minute)
```bash
npm install
```

## 2️⃣ Set Up Supabase (2 minutes)

### Create Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Name it "RentHub", choose region, wait for creation

### Database is Already Set Up!
✅ The database schema has been automatically applied
✅ All tables, RLS policies, and functions are ready

### Get Your Keys
1. Go to Project Settings → API
2. Copy `Project URL` and `anon public` key
3. Your `.env` file is already configured!

## 3️⃣ Start the App (1 minute)
```bash
npm run dev
```

Press `w` for web browser!

## 4️⃣ Create Account & Test (1 minute)
1. Click "Sign Up"
2. Enter any email/password
3. Browse the app!

---

## Adding Sample Properties

### Quick Method (Copy-Paste SQL)

1. Sign up in the app first to create your user
2. Go to Supabase Dashboard → Authentication → Users
3. Copy your User ID (looks like: `550e8400-e29b-41d4-a716-446655440000`)
4. Go to SQL Editor
5. Paste and run (replace YOUR_USER_ID):

```sql
INSERT INTO properties (
  seller_id, title, description, price, location,
  rooms, bathrooms, square_meters, property_type, amenities, status
) VALUES
('YOUR_USER_ID', 'Modern Studio Downtown', 'Beautiful city views', 1200, 'Manhattan, NY', 1, 1, 45, 'studio', '["WiFi", "Furnished"]'::jsonb, 'available'),
('YOUR_USER_ID', 'Spacious 2BR Apartment', 'Perfect for families', 2100, 'Brooklyn, NY', 2, 1, 85, 'apartment', '["WiFi", "Balcony"]'::jsonb, 'available'),
('YOUR_USER_ID', 'Luxury Penthouse', 'Exclusive with terrace', 4500, 'Upper East Side', 3, 2, 150, 'apartment', '["Terrace", "Gym", "Parking"]'::jsonb, 'available');
```

6. Refresh the app → You'll see 3 properties! 🎉

---

## What You Can Do Now

✅ **Browse Properties** - Scroll through listings on Home tab
✅ **Search** - Type location or property name
✅ **Like Properties** - Tap the heart icon, view in Likes tab
✅ **View Requests** - Check the Requests tab
✅ **Profile** - See your info in Profile tab
✅ **Sign Out** - From Profile → Sign Out

---

## Testing the Full Flow

### Test as a Buyer:
1. Browse properties on Home
2. Like a few properties (heart icon)
3. Check Likes tab
4. Database is ready for sending requests!

### Test as a Seller (via SQL):
Properties you added appear for other users to browse and request.

---

## Common Commands

```bash
# Start development server
npm run dev

# Build for web
npm run build:web

# Type check
npm run typecheck

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Next Steps

### 1. Customize Your Brand
Edit `constants/Colors.ts`:
```typescript
export const Colors = {
  gradientStart: '#YOUR_COLOR',  // Change this
  gradientEnd: '#YOUR_COLOR',    // And this
  // ...
};
```

### 2. Update App Info
Edit `app.json`:
```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug"
  }
}
```

### 3. Add More Features
Check `FEATURES.md` for the complete roadmap!

---

## Troubleshooting

### No properties showing?
→ Make sure you added sample data and refreshed the app

### Auth errors?
→ Check `.env` file has correct Supabase URL and key

### Build fails?
```bash
rm -rf node_modules .expo
npm install
npm run dev
```

### Can't see Likes?
→ Make sure you're signed in and tapped the heart icon

---

## 🎉 You're Ready!

The app is fully functional with:
- Complete authentication
- Property browsing
- Search functionality
- Like/save properties
- Request system (database ready)
- User profiles
- Beautiful UI with animations

**Build time**: ~5 minutes
**Your time to customize**: Unlimited! 🚀

---

## Resources

- 📖 Full docs: See `README.md`
- 🎨 Features: See `FEATURES.md`
- 🔧 Setup: See `SETUP_GUIDE.md`
- 🗄️ Sample data: See `scripts/seed-data.sql`

**Happy building! 🏠**
