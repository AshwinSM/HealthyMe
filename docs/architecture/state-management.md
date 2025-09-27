# State Management

## Store Structure

```plaintext
src/stores/
├── index.ts              # Store configuration and exports
├── authStore.ts          # Authentication state (future)
├── metricsStore.ts       # Health metrics state
└── themeStore.ts         # Theme and UI preferences
```

## State Management Template

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
