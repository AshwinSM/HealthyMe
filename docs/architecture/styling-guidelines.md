# Styling Guidelines

## Global Theme Variables

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

## NativeWind Configuration

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
