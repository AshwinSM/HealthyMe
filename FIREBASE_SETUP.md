# Firebase Setup Guide for Mobile Health Dashboard

## Phase 3.1 - Week 1 Deliverables ✅

This guide will help you configure Firebase for the Mobile Health Dashboard app to enable:
- **Authentication** (email/password registration and login)
- **Firestore Database** for health data storage
- **Firebase Storage** for photo uploads
- **Security Rules** to protect user data

---

## Prerequisites

- Google/Firebase account
- Node.js and npm installed
- Firebase CLI (optional but recommended)

---

## Step 1: Create Firebase Project

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Create New Project**
   - Click "Create a project"
   - Project name: `health-dashboard-mobile` (or your preferred name)
   - Enable Google Analytics (optional but recommended)
   - Select your analytics account or create new one
   - Click "Create project"

3. **Wait for project setup** (usually takes 1-2 minutes)

---

## Step 2: Add Web App to Firebase Project

1. **Add Web App**
   - In your Firebase project dashboard
   - Click the `</>` (web) icon to add a web app
   - App nickname: `HealthDashboard`
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"

2. **Copy Configuration**
   - Copy the `firebaseConfig` object shown
   - You'll use this in Step 5

---

## Step 3: Enable Authentication

1. **Go to Authentication**
   - In left sidebar, click "Authentication"
   - Click "Get started"

2. **Set up Sign-in Method**
   - Click "Sign-in method" tab
   - Click "Email/Password" provider
   - Enable "Email/Password"
   - Enable "Email link (passwordless sign-in)" (optional)
   - Click "Save"

3. **Optional: Configure Settings**
   - Go to "Settings" tab
   - Configure project name and sender email (for password reset emails)
   - Set up authorized domains if deploying to custom domain

---

## Step 4: Set up Firestore Database

1. **Create Firestore Database**
   - In left sidebar, click "Firestore Database"
   - Click "Create database"

2. **Choose Security Rules**
   - Select "Start in test mode" (we'll update rules later)
   - Click "Next"

3. **Choose Location**
   - Select location closest to your users
   - **Important**: This cannot be changed later
   - Click "Done"

4. **Wait for Database Creation** (1-2 minutes)

---

## Step 5: Configure Your App

1. **Update Firebase Configuration**
   - Open `src/config/firebase.ts` in your project
   - Replace the placeholder config with your actual Firebase config:

   ```typescript
   const firebaseConfig = {
      apiKey: "AIzaSyBmq7932gFT11LYM2K1XfW11gopfkdACRk",
      authDomain: "healthymemobile.firebaseapp.com",
      projectId: "healthymemobile",
      storageBucket: "healthymemobile.firebasestorage.app",
      messagingSenderId: "784106064433",
      appId: "1:784106064433:web:03067436b4481283b56310",
      measurementId: "G-Q29NX2PJLB"
    };
   ```

2. **Verify Installation**
   - The Firebase dependencies are already installed
   - Your app structure includes all necessary Firebase services

---

## Step 6: Deploy Firestore Security Rules

1. **Install Firebase CLI** (if not already installed)
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase in Project** (in your app root directory)
   ```bash
   firebase init firestore
   ```
   - Select your Firebase project
   - Choose `firestore.rules` as your rules file (already created)
   - Choose default options for indexes file

4. **Deploy Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## Step 7: Set up Firebase Storage (for food photos)

1. **Enable Storage**
   - In Firebase console, go to "Storage"
   - Click "Get started"
   - Review security rules (start in test mode)
   - Select same location as Firestore
   - Click "Done"

2. **Configure Storage Rules** (optional - can be done later)
   - In Storage, go to "Rules" tab
   - Update rules to allow authenticated users to upload images

---

## Step 8: Test Your Setup

1. **Run Your App**
   ```bash
   npm start
   ```

2. **Test Registration**
   - Open your app
   - Try registering with a test email/password
   - Check Firebase Console > Authentication > Users to see if user was created

3. **Test Login**
   - Try logging in with the same credentials
   - Verify navigation to main dashboard works

4. **Check Firestore**
   - Go to Firestore Database in Firebase console
   - Look for `users` collection with your user profile data

---

## Verification Checklist ✅

After completing setup, verify these items:

- [x] Firebase project created and web app added
- [x] Email/password authentication enabled
- [x] Firestore database created in appropriate region
- [x] Firebase config added to `src/config/firebase.ts`
- [x] Security rules deployed via Firebase CLI
- [x] Storage enabled (for future photo uploads)
- [x] Test user can register successfully
- [x] Test user can login successfully  
- [x] User profile data appears in Firestore `users` collection
- [x] App navigation works correctly after authentication

---

## Database Collections Created

The app will automatically create these Firestore collections:

- **`users`** - User profiles and preferences
- **`food_entries`** - Daily food intake logs
- **`weight_entries`** - Weight tracking data
- **`water_entries`** - Daily water intake logs
- **`steps_entries`** - Daily step counts
- **`workout_entries`** - Exercise/workout logs

---

## Security Features Implemented ✅

- **Authentication Required** - All data operations require user authentication
- **User Data Isolation** - Users can only access their own data
- **Firestore Security Rules** - Server-side data validation and access control
- **Type Safety** - TypeScript interfaces for all data models
- **Error Handling** - Comprehensive error handling in all Firebase operations

---

## Next Steps (Phase 3.1 Week 2)

Once Firebase is configured and tested:

1. **Test food entry system** - Add food items and verify Firestore storage
2. **Test health metrics** - Add weight, water, steps, workout data
3. **Verify nutrition calculations** - Check random nutrition generation
4. **Test date-based data retrieval** - Ensure data loads correctly for different dates

---

## Troubleshooting

### Common Issues:

**"Firebase App not initialized"**
- Check that firebase config is properly set in `src/config/firebase.ts`
- Ensure all required fields are filled in

**"Permission denied" errors**
- Verify security rules are deployed: `firebase deploy --only firestore:rules`
- Check that user is authenticated before making Firestore calls

**Authentication not working**
- Verify Email/Password provider is enabled in Firebase Console
- Check network connection and Firebase project status

**App crashes on startup**
- Check Firebase configuration values
- Verify all Firebase dependencies are installed
- Check Metro bundler for error messages

---

**Support**: For issues specific to this implementation, check the Firebase console logs and ensure all configuration steps were completed correctly.