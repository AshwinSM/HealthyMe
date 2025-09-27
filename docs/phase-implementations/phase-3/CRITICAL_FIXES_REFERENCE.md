# 🚨 Critical Fixes Reference - Quick Lookup

**Use this for immediate problem-solving without reading full documentation**

---

## **Firebase + React Native Issues**

### **1. AsyncStorage Version Error**
```bash
# Problem: expo version compatibility
# Fix:
npm install @react-native-async-storage/async-storage@2.1.2
```

### **2. getReactNativePersistence Not Found**
```typescript
// ❌ DON'T DO THIS:
import { getReactNativePersistence } from 'firebase/auth';

// ✅ DO THIS:
let auth: Auth;
try {
  auth = getAuth(app);
} catch (error) {
  auth = initializeAuth(app);
}
```

### **3. Firestore Undefined Values**
```typescript
// ❌ WRONG: Firestore rejects undefined
const data = {
  displayName: undefined,  // FAILS
  photoURL: undefined      // FAILS
};

// ✅ CORRECT: Conditional inclusion
const data: any = { id: userId };
if (displayName) data.displayName = displayName;
if (photoURL) data.photoURL = photoURL;
```

### **4. Navigation Race Condition**
```typescript
// ❌ WRONG: Manual navigation after auth
if (success) {
  navigation.navigate('Main');  // Race condition
}

// ✅ CORRECT: Let auth state drive navigation
if (success) {
  // RootNavigator will handle navigation automatically
}
```

---

## **Error Pattern Templates**

### **Service Error Handling**
```typescript
} catch (error: any) {
  console.error('Operation:', error);
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
  
  return {
    success: false,
    error: `${error.code}: ${error.message}`,
    message: 'User-friendly message'
  };
}
```

### **Auth State Pattern**
```typescript
const { isAuthenticated, isLoading } = useAuthStore();

if (isLoading) {
  return <LoadingScreen />;
}

return (
  <NavigationContainer>
    {isAuthenticated ? <AuthedScreens /> : <LoginScreen />}
  </NavigationContainer>
);
```

---

## **Quick Debugging Commands**

```bash
# TypeScript check
npx tsc --noEmit

# Start with specific port
npx expo start --port 8083

# Check Firebase CLI
firebase --version

# Kill all node processes (if needed)
taskkill /f /im node.exe
```

---

**🔥 Remember: These are the most common pitfalls - check here first!**