import '@testing-library/jest-native/extend-expect';

// Mock global window object for React Native environment
global.window = global.window || {};
global.window.addEventListener = global.window.addEventListener || jest.fn();
global.window.removeEventListener = global.window.removeEventListener || jest.fn();

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View, Text, Pressable } = require('react-native');
  
  const Animated = {
    View: React.forwardRef((props, ref) => React.createElement(View, { ...props, ref })),
    Text: React.forwardRef((props, ref) => React.createElement(Text, { ...props, ref })),
    createAnimatedComponent: (Component) => React.forwardRef((props, ref) => 
      React.createElement(Component, { ...props, ref })
    ),
  };
  
  return {
    default: Animated,
    ...Animated,
    useSharedValue: jest.fn(() => ({ value: 0 })),
    withTiming: jest.fn((value) => value),
    useAnimatedStyle: jest.fn(() => ({})),
    runOnJS: jest.fn((fn) => fn),
    Easing: {
      inOut: jest.fn((func) => func || jest.fn()),
      quad: jest.fn(),
    },
  };
});

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
  NavigationContainer: ({ children }) => children,
}));

// Mock Dimensions for responsive layout
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Dimensions = {
    get: jest.fn().mockReturnValue({ width: 375, height: 812 }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  return RN;
});

// Mock Expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Circle: 'Circle',
  Path: 'Path',
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  User: jest.fn(),
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn((date) => ({ toDate: () => date })),
  },
}));