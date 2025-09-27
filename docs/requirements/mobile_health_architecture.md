# Mobile Health Dashboard Frontend Architecture Document

## Introduction

This document outlines the frontend architecture for the Mobile Health Dashboard mobile application, focusing on React Native implementation with modern component patterns and development best practices. It serves as the technical blueprint for building a scalable, maintainable mobile application.

### Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-01-24 | 1.0 | Initial frontend architecture for React Native mobile app | Architect |

## Template and Framework Selection

### Starter Template Decision
**Selected Approach:** Expo managed workflow with Create Expo App
- **Template:** `npx create-expo-app@latest HealthDashboard --template blank-typescript`
- **Rationale:** Provides TypeScript setup, optimal build configuration, and simplified development workflow
- **Constraints:** Expo SDK limitations (acceptable for UI-focused initial phase)

## Frontend Tech Stack

### Technology Stack Table
| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Framework | React Native | 0.73.2 | Cross-platform mobile development | Industry standard for cross-platform with native performance |
| Development Platform | Expo | SDK 50+ | Development tooling and build system | Simplified development, OTA updates, managed workflow |
| UI Library | NativeWind | 4.0.1 | Utility-first styling system | Tailwind-like syntax optimized for React Native |
| State Management | Zustand | 4.4.7 | Lightweight state management | Simple API, TypeScript-first, perfect for small apps |
| Navigation | React Navigation | 6.1.9 | Screen navigation and routing | De facto standard for React Native navigation |
| Component Library | Tamagui | 1.91.2 | Styled system with animations | Performance-focused with shadcn-compatible components |
| Icons | Lucide React Native | 0.294.0 | Icon system | Consistent with shadcn ecosystem |
| Animations | React Native Reanimated | 3.6.1 | High-performance animations | 60fps animations with native performance |
| Forms | React Hook Form | 7.48.2 | Form state management | Minimal re-renders, excellent TypeScript support |
| Theme System | TweakCN | Custom | shadcn-compatible theme tokens | Consistent with your existing shadcn setup |
| Testing | Jest + React Native Testing Library | Latest | Component and integration testing | Standard React Native testing stack |
| Dev Tools | Expo Dev Tools | Latest | Development and debugging | Integrated debugging and hot reload |

## Project Structure

```plaintext
HealthDashboard/
├── App.tsx                     # Root application component
├── app.json                   # Expo configuration
├── babel.config.js            # Babel configuration
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.js         # NativeWind configuration
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Base UI components (shadcn-style)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── index.ts
│   │   ├── forms/            # Form-specific components
│   │   │   ├── LoginForm.tsx
│   │   │   └── index.ts
│   │   ├── cards/            # Dashboard card components
│   │   │   ├── MetricCard.tsx
│   │   │   ├── CaloriesCard.tsx
│   │   │   ├── WorkoutCard.tsx
│   │   │   ├── WaterCard.tsx
│   │   │   └── index.ts
│   │   └── layout/           # Layout components
│   │       ├── SafeAreaContainer.tsx
│   │       ├── ScreenContainer.tsx
│   │       └── index.ts
│   ├── screens/              # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   └── index.ts
│   ├── navigation/           # Navigation configuration
│   │   ├── types.ts          # Navigation type definitions
│   │   ├── RootNavigator.tsx
│   │   └── index.ts
│   ├── stores/               # State management
│   │   ├── authStore.ts      # Future authentication state
│   │   ├── metricsStore.ts   # Health metrics state
│   │   └── index.ts
│   ├── hooks/                # Custom React hooks
│   │   ├── useMetrics.ts     # Health metrics data hook
│   │   ├── useTheme.ts       # Theme management hook
│   │   └── index.ts
│   ├── utils/                # Utility functions
│   │   ├── theme.ts          # Theme configuration
│   │   ├── constants.ts      # App constants
│   │   ├── metrics.ts        # Dimension utilities
│   │   └── index.ts
│   ├── types/                # TypeScript type definitions
│   │   ├── navigation.ts     # Navigation types
│   │   ├── metrics.ts        # Health metrics types
│   │   └── index.ts
│   └── assets/               # Static assets
│       ├── images/
│       ├── icons/
│       └── fonts/
├── __tests__/                # Test files
│   ├── components/
│   ├── screens/
│   └── utils/
└── docs/                     # Documentation
    ├── prd.md
    ├── front-end-spec.md
    └── architecture.md
```

## Component Standards

### Component Template

```typescript
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';
import { MetricCardProps } from '../types';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

interface Props extends MetricCardProps {
  onPress?: () => void;
  testID?: string;
}

export const MetricCard: React.FC<Props> = ({ 
  title, 
  value, 
  unit, 
  icon, 
  onPress,
  testID 
}) => {
  return (
    <StyledTouchableOpacity
      testID={testID}
      onPress={onPress}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 min-h-[120px] flex-1"
      activeOpacity={0.7}
    >
      <StyledView className="flex-row justify-between items-start mb-2">
        {icon}
        <StyledView className="flex-1 ml-3">
          <StyledText className="text-2xl font-semibold text-gray-900">
            {value}
          </StyledText>
          <StyledText className="text-sm text-gray-500 mt-1">
            {unit}
          </StyledText>
        </StyledView>
      </StyledView>
      <StyledText className="text-xs font-medium text-gray-600 uppercase tracking-wide">
        {title}
      </StyledText>
    </StyledTouchableOpacity>
  );
};

export default MetricCard;
```

### Naming Conventions
- **Components**: PascalCase (e.g., `LoginScreen`, `MetricCard`)
- **Files**: PascalCase for components, camelCase for utilities
- **Props interfaces**: `ComponentNameProps` pattern
- **Test files**: `ComponentName.test.tsx`
- **Style classes**: Tailwind utility classes with NativeWind

## State Management

### Store Structure

```plaintext
src/stores/
├── index.ts              # Store configuration and exports
├── authStore.ts          # Authentication state (future)
├── metricsStore.ts       # Health metrics state
└── themeStore.ts         # Theme and UI preferences
```

### State Management Template

```typescript
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface MetricsState {
  calories: {
    value: number;
    unit: string;
    target: number;
  };
  workout: {
    duration: number;
    unit: string;
    type: string;
  };
  water: {
    amount: number;
    unit: string;
    target: number;
  };
  updateCalories: (value: number) => void;
  updateWorkout: (duration: number, type: string) => void;
  updateWater: (amount: number) => void;
  resetMetrics: () => void;
}

export const useMetricsStore = create<MetricsState>()(
  subscribeWithSelector((set) => ({
    calories: {
      value: 1200,
      unit: 'kcal',
      target: 2000,
    },
    workout: {
      duration: 45,
      unit: 'mins',
      type: 'Cardio',
    },
    water: {
      amount: 2.5,
      unit: 'L',
      target: 3.0,
    },
    updateCalories: (value) => 
      set((state) => ({
        calories: { ...state.calories, value }
      })),
    updateWorkout: (duration, type) => 
      set((state) => ({
        workout: { ...state.workout, duration, type }
      })),
    updateWater: (amount) => 
      set((state) => ({
        water: { ...state.water, amount }
      })),
    resetMetrics: () => 
      set(() => ({
        calories: { value: 0, unit: 'kcal', target: 2000 },
        workout: { duration: 0, unit: 'mins', type: '' },
        water: { amount: 0, unit: 'L', target: 3.0 },
      })),
  }))
);
```

## Routing

### Route Configuration

```typescript
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { LoginScreen, DashboardScreen } from '../screens';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 320,
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
        />
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

## Styling Guidelines

### Global Theme Variables

```typescript
// src/utils/theme.ts
export const theme = {
  colors: {
    primary: '#10B981',
    secondary: '#6366F1', 
    accent: '#F59E0B',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      500: '#6B7280',
      900: '#111827',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
  },
  typography: {
    fontFamily: 'Inter',
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
};
```

### NativeWind Configuration

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#10B981',
        secondary: '#6366F1',
        accent: '#F59E0B',
      },
      fontFamily: {
        'inter': ['Inter'],
      },
    },
  },
  plugins: [],
}
```

## Testing Requirements

### Component Test Template

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MetricCard } from '../MetricCard';

describe('MetricCard', () => {
  const mockProps = {
    title: 'Calories',
    value: '1200',
    unit: 'kcal',
    icon: <MockIcon />,
  };

  it('renders metric information correctly', () => {
    const { getByText } = render(<MetricCard {...mockProps} />);
    
    expect(getByText('1200')).toBeTruthy();
    expect(getByText('kcal')).toBeTruthy();
    expect(getByText('Calories')).toBeTruthy();
  });

  it('handles press events', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <MetricCard {...mockProps} onPress={onPressMock} testID="metric-card" />
    );
    
    fireEvent.press(getByTestId('metric-card'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('applies correct styling classes', () => {
    const { getByTestId } = render(
      <MetricCard {...mockProps} testID="metric-card" />
    );
    
    const card = getByTestId('metric-card');
    expect(card.props.className).toContain('bg-white');
    expect(card.props.className).toContain('rounded-xl');
  });
});
```

### Testing Best Practices
1. **Unit Tests**: Test individual components in isolation with mocked dependencies
2. **Integration Tests**: Test screen components with navigation and state management
3. **E2E Tests**: Use Detox for critical user flows (login → dashboard navigation)
4. **Coverage Goals**: Aim for 80% code coverage on components and utilities
5. **Test Structure**: Arrange-Act-Assert pattern with descriptive test names
6. **Mock External Dependencies**: Mock navigation, state stores, and future API calls

## Environment Configuration

### Required Environment Variables

```bash
# .env.local (development)
EXPO_PUBLIC_API_URL=http://localhost:3001/api
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_VERSION=1.0.0

# .env.production
EXPO_PUBLIC_API_URL=https://api.healthapp.com
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_VERSION=1.0.0
```

## Performance Optimization

### React Native Optimization Strategies

1. **Component Optimization**:
   - Use React.memo for metric cards to prevent unnecessary re-renders
   - Implement useMemo for expensive calculations
   - Use useCallback for event handlers passed to child components

2. **Image Optimization**:
   - Use Expo Image for optimized image loading and caching
   - Implement proper image sizing and format selection
   - Lazy load images that are not immediately visible

3. **Bundle Optimization**:
   - Enable Hermes JavaScript engine for faster startup
   - Use Expo Updates for over-the-air updates
   - Implement code splitting for future feature modules

4. **Animation Optimization**:
   - Use React Native Reanimated for 60fps animations
   - Implement shouldRasterizeIOS for complex animated views
   - Avoid animating layout properties when possible

## Security Considerations

### Mobile App Security

1. **Code Obfuscation**:
   - Enable code obfuscation in Expo production builds
   - Remove console.log statements from production builds
   - Implement certificate pinning for future API calls

2. **Secure Storage**:
   - Use Expo SecureStore for sensitive data (future auth tokens)
   - Never store passwords or sensitive data in AsyncStorage
   - Implement proper keychain/keystore integration

3. **App Transport Security**:
   - Enforce HTTPS for all network requests
   - Implement certificate validation
   - Use proper Content Security Policy headers

## Development Workflow

### Local Development Setup

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

### Development Commands

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

## Deployment Architecture

### Build Configuration

**Development Build:**
```bash
# Local development
expo start --clear

# Development build for testing
eas build --profile development --platform all
```

**Production Build:**
```bash
# Production build
eas build --profile production --platform all

# Submit to app stores
eas submit --platform all
```

### App Store Configuration

**iOS Configuration (app.json):**
```json
{
  "expo": {
    "name": "Health Dashboard",
    "slug": "health-dashboard",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "ios": {
      "bundleIdentifier": "com.yourcompany.healthdashboard",
      "buildNumber": "1",
      "requireFullScreen": true,
      "userInterfaceStyle": "automatic"
    },
    "android": {
      "package": "com.yourcompany.healthdashboard",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#10B981"
      }
    }
  }
}
```

## Critical Frontend Rules

1. **Component Structure**: Always use TypeScript interfaces for props and follow PascalCase naming
2. **State Management**: Use Zustand stores for global state, React state for component-local state
3. **Styling**: Use NativeWind classes exclusively, no inline styles or StyleSheet.create
4. **Navigation**: Always type navigation props and use proper TypeScript navigation types
5. **Testing**: Every component must have corresponding test file with minimum 70% coverage
6. **Performance**: Use React.memo, useMemo, and useCallback appropriately for optimization
7. **Accessibility**: Include testID props and proper accessibility labels for all interactive elements

## Quick Reference

### Common Commands
```bash
# Development
npm start                    # Start Expo dev server
expo start --clear          # Clear cache and start
expo install <package>      # Install Expo-compatible package

# Testing  
npm test                    # Run all tests
npm run test:watch         # Watch mode testing
npm run test:coverage      # Coverage report

# Building
eas build --profile preview --platform all    # Preview build
eas build --profile production --platform all # Production build
```

### Key Import Patterns
```typescript
// Components
import { MetricCard } from '@/components/cards';
import { Button, Input } from '@/components/ui';

// Navigation
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '@/navigation/types';

// State Management
import { useMetricsStore } from '@/stores/metricsStore';

// Utilities
import { theme } from '@/utils/theme';
```

### File Naming Conventions
- **Components**: `MetricCard.tsx`, `LoginScreen.tsx`
- **Stores**: `metricsStore.ts`, `authStore.ts`
- **Types**: `navigation.ts`, `metrics.ts`
- **Tests**: `MetricCard.test.tsx`
- **Utils**: `theme.ts`, `constants.ts`