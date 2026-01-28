# Pyrolysis Ops

A comprehensive operations management system for a tyre pyrolysis plant built with React, TypeScript, and Firebase.

## 🚀 Features

### Authentication & Access Control
- Email/password and phone OTP login
- Role-based access control (SUPER_ADMIN, PLANT_MANAGER, SHIFT_SUPERVISOR, GATE_OPERATOR, REACTOR_OPERATOR)
- Protected routes and session management

### User & Device Management
- CRUD operations for users with role assignment
- Device registration and status tracking
- Device revocation for security

### Gate Operations
- Gate entry/exit recording
- Vehicle photo capture from device camera
- Material category and weight tracking
- Supplier/driver information

### Reactor Operations
- Reactor dashboard with status monitoring
- 14-step batch workflow:
  1. Loading - Tyre Input
  2. Seal Reactor
  3. Pre-Heat Check
  4. Start Heating
  5. Temperature 150°C
  6. Temperature 250°C
  7. Temperature 350°C - Gas Start
  8. Temperature 450°C - Peak
  9. Maintain Temperature
  10. Cooling Start
  11. Temperature Below 70°C
  12. Open Reactor
  13. Extract Outputs
  14. Clean & Inspect
- Output recording (Carbon Black, Pyrolysis Oil, Steel Wire)

### Offline Support
- IndexedDB queue for offline operations
- Automatic sync on reconnect
- Conflict resolution (newer timestamp wins)
- Visual sync status indicator

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **State**: Zustand, TanStack Query
- **Testing**: Vitest
- **Build**: Vite

## 📦 Installation

```bash
# Clone repository
git clone <repository-url>
cd pyrolysis-ops

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Firebase config

# Start development server
npm run dev
```

## 🔧 Environment Variables

Create a `.env` file with:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## 📝 Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run lint         # Run ESLint
```

## 🚀 Deployment

### Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Build the app
npm run build

# Deploy everything
firebase deploy

# Deploy specific features
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only storage
firebase deploy --only functions
```

## 📁 Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── ProtectedRoute.tsx
│   └── SyncStatus.tsx
├── contexts/           # React contexts
│   ├── AuthContext.tsx
│   └── OfflineContext.tsx
├── pages/              # Page components
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── UsersPage.tsx
│   ├── DevicesPage.tsx
│   ├── GateEntriesPage.tsx
│   ├── ReactorDashboardPage.tsx
│   └── BatchWorkflowPage.tsx
├── services/           # Firebase services
│   ├── userService.ts
│   ├── deviceService.ts
│   ├── gateEntryService.ts
│   ├── reactorService.ts
│   ├── batchService.ts
│   ├── offlineQueue.ts
│   └── syncService.ts
├── types/              # TypeScript types
│   └── index.ts
└── lib/                # Firebase config
    └── firebase.ts
```

## 🔒 Security

- Firestore security rules enforce role-based access
- Storage rules limit file types and sizes
- Cloud Functions handle audit logging
- All operations are logged for compliance

## 📊 Testing

```bash
# Run all tests
npm run test

# Expected output:
# ✓ offlineQueue.test.ts (3 tests)
# ✓ reactorService.test.ts (6 tests)
# ✓ gateEntryService.test.ts (6 tests)
# ✓ batchService.test.ts (10 tests)
# Tests: 25 passed
```

## 📄 License

MIT
