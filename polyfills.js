// Polyfills for React Native with Hermes
// This file provides missing web APIs that libraries like Firebase expect

// Polyfill for window object
if (typeof window === 'undefined') {
  global.window = global;
}

// Polyfill for addEventListener/removeEventListener
if (!global.window.addEventListener) {
  global.window.addEventListener = () => {};
}

if (!global.window.removeEventListener) {
  global.window.removeEventListener = () => {};
}

// Additional polyfills for Firebase compatibility
if (!global.window.location) {
  global.window.location = {
    protocol: 'https:',
    host: 'localhost',
    hostname: 'localhost',
    port: '',
    pathname: '/',
    search: '',
    hash: '',
    href: 'https://localhost/',
  };
}

if (!global.window.navigator) {
  global.window.navigator = {
    userAgent: 'ReactNative',
    platform: 'ReactNative',
  };
}

// Polyfill for document
if (!global.document) {
  global.document = {
    addEventListener: () => {},
    removeEventListener: () => {},
    createElement: () => ({}),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
  };
}

// Performance API polyfill
if (!global.performance) {
  global.performance = {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
  };
}

console.log('Polyfills loaded successfully');