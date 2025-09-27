import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

// Firebase configuration
// TODO: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBmq7932gFT11LYM2K1XfW11gopfkdACRk",
  authDomain: "healthymemobile.firebaseapp.com",
  projectId: "healthymemobile",
  storageBucket: "healthymemobile.firebasestorage.app",
  messagingSenderId: "784106064433",
  appId: "1:784106064433:web:03067436b4481283b56310",
  measurementId: "G-Q29NX2PJLB"
};

// Initialize Firebase
console.log('🔥 Initializing Firebase with config:', {
  apiKey: firebaseConfig.apiKey ? 'SET' : 'MISSING',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId ? 'SET' : 'MISSING'
});

const app = initializeApp(firebaseConfig);
console.log('🔥 Firebase app initialized:', !!app);

// Initialize Firebase Auth
let auth: Auth;
try {
  // Try to get existing auth instance first
  auth = getAuth(app);
  console.log('🔥 Firebase Auth initialized via getAuth:', !!auth);
} catch (error) {
  console.log('🔥 getAuth failed, trying initializeAuth for React Native...');
  // If no auth instance exists, initialize it
  if (Platform.OS !== 'web') {
    // For React Native, initialize auth
    auth = initializeAuth(app);
    console.log('🔥 Firebase Auth initialized via initializeAuth:', !!auth);
  } else {
    auth = getAuth(app);
    console.log('🔥 Firebase Auth initialized via getAuth (web):', !!auth);
  }
}

// Initialize Firestore
const db = getFirestore(app);
console.log('🔥 Firestore initialized:', !!db);
console.log('🔥 Firestore app reference:', !!db.app);

// Initialize Firebase Storage
const storage = getStorage(app);
console.log('🔥 Firebase Storage initialized:', !!storage);

console.log('🔥 Firebase initialization complete. Exporting:', {
  app: !!app,
  auth: !!auth,
  db: !!db,
  storage: !!storage
});

export { auth, db, storage };
export default app;