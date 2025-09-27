# Development Workflow

## Local Development Setup

```bash
# Prerequisites
node --version  # Requires Node.js 18+
npm --version   # Or yarn/pnpm

# Initial setup
npx create-expo-app@latest HealthDashboard --template blank-typescript
cd HealthDashboard
npm install

# Install additional dependencies
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
npm install zustand react-hook-form
npm install nativewind tailwindcss
npm install lucide-react-native react-native-reanimated

# Development commands
npm start           # Start Expo development server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run on web (for quick testing)
npm test           # Run test suite
```

## Development Commands

```bash
# Start all services
npm start

# Platform-specific development
npm run ios         # iOS development
npm run android     # Android development
npm run web         # Web development (testing only)

# Testing and quality
npm test           # Run Jest tests
npm run test:watch # Run tests in watch mode
npm run lint       # ESLint checking
npm run type-check # TypeScript checking
```
