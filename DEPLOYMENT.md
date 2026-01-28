# Deployment Guide

## Prerequisites

1. [Node.js 20+](https://nodejs.org/)
2. [Firebase CLI](https://firebase.google.com/docs/cli)
3. Firebase project with:
   - Authentication (Email/Password, Phone providers enabled)
   - Firestore Database
   - Storage
   - Functions (Blaze plan required)

## Step 1: Firebase Setup

### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use existing
3. Enable required services:
   - Authentication → Email/Password, Phone
   - Firestore Database → Create in production mode
   - Storage → Create default bucket

### Get Configuration
1. Project Settings → General → Your apps → Web app
2. Copy the Firebase config object

## Step 2: Local Configuration

```bash
# Clone and install
git clone <repository-url>
cd pyrolysis-ops
npm install

# Create .env file
cp .env.example .env
```

Edit `.env` with your Firebase config:
```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Step 3: Firebase Functions Setup

```bash
cd functions
npm install
cd ..
```

## Step 4: Deploy

### Initialize Firebase
```bash
firebase login
firebase use your-project-id
```

### Deploy All
```bash
npm run build
firebase deploy
```

### Deploy Individually
```bash
# Just Firestore rules
firebase deploy --only firestore:rules

# Just Storage rules
firebase deploy --only storage

# Just Cloud Functions
firebase deploy --only functions

# Just Hosting
firebase deploy --only hosting
```

## Step 5: Create Initial Admin User

1. Go to Firebase Console → Authentication
2. Add user with email/password
3. Go to Firestore → users collection
4. Create document with:
   - Document ID: same as Auth UID
   - Fields:
     ```json
     {
       "email": "admin@company.com",
       "name": "Admin User",
       "role": "SUPER_ADMIN",
       "status": "ACTIVE",
       "createdAt": <server timestamp>
     }
     ```

## Firestore Indexes

If you see index errors, create required composite indexes:

```bash
firebase firestore:indexes
```

Or create manually in Firebase Console → Firestore → Indexes.

## Troubleshooting

### Build Errors
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Functions Deploy Fails
```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### CORS Issues
Check that your domain is in Firebase Auth authorized domains.

## Post-Deployment

1. Verify app loads at your Firebase Hosting URL
2. Test login with admin user
3. Create test gate entry
4. Check audit logs in Firestore

## Monitoring

- Firebase Console → Functions → Logs
- Firebase Console → Performance
- Firebase Console → Crashlytics (if enabled)
