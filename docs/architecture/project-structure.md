# Project Structure

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
