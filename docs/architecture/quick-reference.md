# Quick Reference

## Common Commands
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

## Key Import Patterns
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

## File Naming Conventions
- **Components**: `MetricCard.tsx`, `LoginScreen.tsx`
- **Stores**: `metricsStore.ts`, `authStore.ts`
- **Types**: `navigation.ts`, `metrics.ts`
- **Tests**: `MetricCard.test.tsx`
- **Utils**: `theme.ts`, `constants.ts`