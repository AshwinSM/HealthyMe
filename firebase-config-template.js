// Firebase Configuration Template
// Copy this file to src/config/firebase-config.ts and fill in your actual values

export const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
};

/* 
To get your Firebase configuration:
1. Go to https://console.firebase.google.com/
2. Create a new project or select existing project
3. Go to Project Settings > General tab
4. Scroll down to "Your apps" section
5. Click "Add app" and select "Web"
6. Register your app with name "HealthDashboard"
7. Copy the configuration object
8. Replace the values above with your actual configuration
9. Rename this file to firebase-config.ts and move to src/config/
*/