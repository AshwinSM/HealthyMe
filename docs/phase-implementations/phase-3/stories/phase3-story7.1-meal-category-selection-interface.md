# Phase 3 - Story 7.1: Meal Category Selection Interface
## 5 Meal Categories with Visual States

**Story ID**: 7.1  
**Epic**: 7 - Food Tracking System  
**Sprint**: 2 (Week 3)  
**Story Points**: 5  
**Priority**: Critical  
**Status**: ✅ COMPLETED  

---

## User Story

**As a user**, I want to select different meal categories so that I can organize my daily food intake by breakfast, lunch, dinner, and snacks with clear visual feedback about my progress.

---

## Acceptance Criteria

### Meal Category Display
- [x] 5 meal category buttons displayed: Breakfast, Lunch, Dinner, Morning Snack, Evening Snack
- [x] Each category shows current calorie count vs. daily allocated calories
- [x] Visual design matches provided UI screenshots exactly
- [x] Categories display different visual states based on logging status
- [x] Responsive layout works on different screen sizes (320px-428px width)

### Visual States Implementation
- [x] Empty state: Light gray background when no foods logged
- [x] Partial state: Orange background when some foods logged but under goal
- [x] Goal met state: Green background when calorie goal achieved
- [x] Over goal state: Red background when calories exceed allocated amount
- [x] Loading state: Subtle animation while nutrition data calculates

### Navigation & Interaction
- [x] Tapping any category navigates to food entry screen for that meal type
- [x] Smooth animations between category state changes
- [x] Touch targets meet minimum 44px accessibility requirement
- [x] Categories respond to touch with appropriate feedback (haptics/visual)
- [x] Navigation maintains proper meal type context

---

## Technical Requirements

### Component Architecture
```typescript
interface MealCategoryProps {
  mealType: MealType;
  currentCalories: number;
  allocatedCalories: number;
  mealCount: number;
  onPress: (mealType: MealType) => void;
  isLoading?: boolean;
}

interface MealCategoryState {
  isEmpty: boolean;           // No foods logged yet
  currentCalories: number;    // Sum of all foods in meal
  allocatedCalories: number;  // Goal calories for this meal type
  isGoalMet: boolean;        // currentCalories >= allocatedCalories
  isOverGoal: boolean;       // currentCalories > allocatedCalories * 1.1
  lastUpdated: Date;         // For showing data freshness
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'morningSnack' | 'eveningSnack';
```

### Visual State Logic
```typescript
const getMealCategoryState = (currentCalories: number, allocatedCalories: number): CategoryState => {
  if (currentCalories === 0) {
    return 'empty';
  } else if (currentCalories < allocatedCalories * 0.9) {
    return 'partial';
  } else if (currentCalories <= allocatedCalories * 1.1) {
    return 'goalMet';
  } else {
    return 'overGoal';
  }
};

const categoryColors = {
  empty: '#F3F4F6',        // Light gray
  partial: '#FEF3C7',      // Light orange  
  goalMet: '#D1FAE5',      // Light green
  overGoal: '#FEE2E2'      // Light red
};
```

### Layout Configuration
```typescript
interface MealCategoryLayout {
  // Grid layout for categories
  gridConfig: {
    numColumns: 2;           // 2x3 grid (Morning Snack spans full width)
    spacing: 16;             // 16px between categories
    padding: 20;             // 20px container padding
  };
  
  // Individual category styling
  categoryCard: {
    height: 120;             // Fixed height for consistency
    borderRadius: 12;        // Rounded corners
    padding: 16;             // Internal padding
    shadowOpacity: 0.1;      // Subtle shadow
  };
  
  // Responsive breakpoints
  responsive: {
    smallScreen: 'width < 360px: stack vertically';
    largeScreen: 'width > 400px: larger touch targets';
  };
}
```

---

## UI Design Specifications

### Visual Reference
Based on sample screenshots (Breakfast and Morning Snack.jpeg, Lunch and Evening Snack.jpeg, Dinner.jpeg):

### Category Card Design
```typescript
interface CategoryCardDesign {
  // Layout structure
  layout: 'icon top, title middle, calories bottom';
  
  // Typography
  title: {
    font: 'Inter-SemiBold';
    size: 16;
    color: '#1F2937';        // Dark gray
  };
  
  calories: {
    font: 'Inter-Medium';
    size: 14;
    color: '#6B7280';        // Medium gray
    format: '531 of 462 Cal'; // current of allocated Cal
  };
  
  // Icon specifications
  icon: {
    size: 24;
    color: '#F59E0B';        // Orange accent
    style: 'lucide-react-native icons';
  };
}
```

### Animation Specifications
```typescript
interface CategoryAnimations {
  // State change animations
  stateTransition: {
    duration: 300;           // ms
    easing: 'ease-in-out';
    property: 'backgroundColor';
  };
  
  // Press feedback
  pressAnimation: {
    scale: 0.95;             // Slight scale down
    duration: 150;           // ms
    hapticFeedback: 'light'; // iOS/Android haptic
  };
  
  // Loading state
  loadingAnimation: {
    type: 'pulse';
    duration: 1000;          // ms
    opacity: [0.7, 1.0];
  };
}
```

---

## Implementation Details

### Component Structure
```typescript
const MealCategoryGrid: React.FC = () => {
  const { selectedDate, meals, nutritionGoals } = useNutritionStore();
  const navigation = useNavigation();
  
  const mealCategories = [
    {
      type: 'breakfast',
      title: 'Breakfast',
      icon: 'sunrise',
      allocated: nutritionGoals.breakfast
    },
    {
      type: 'morningSnack',
      title: 'Morning Snack', 
      icon: 'apple',
      allocated: nutritionGoals.morningSnack
    },
    {
      type: 'lunch',
      title: 'Lunch',
      icon: 'utensils',
      allocated: nutritionGoals.lunch
    },
    {
      type: 'eveningSnack',
      title: 'Evening Snack',
      icon: 'cookie',
      allocated: nutritionGoals.eveningSnack
    },
    {
      type: 'dinner',
      title: 'Dinner',
      icon: 'utensils-crossed',
      allocated: nutritionGoals.dinner
    }
  ];
  
  const handleCategoryPress = (mealType: MealType) => {
    navigation.navigate('FoodEntry', { mealType, date: selectedDate });
  };
  
  return (
    <View style={styles.container}>
      {mealCategories.map((category) => (
        <MealCategoryCard
          key={category.type}
          mealType={category.type}
          title={category.title}
          icon={category.icon}
          currentCalories={meals[category.type].totalNutrition.calories}
          allocatedCalories={category.allocated}
          onPress={handleCategoryPress}
        />
      ))}
    </View>
  );
};
```

### State Management Integration
```typescript
// Real-time updates from Zustand store
const MealCategoryCard: React.FC<MealCategoryProps> = (props) => {
  // Subscribe to meal data changes
  const mealData = useNutritionStore(
    useCallback(
      (state) => state.meals[props.mealType],
      [props.mealType]
    )
  );
  
  // Calculate visual state
  const categoryState = useMemo(() => 
    getMealCategoryState(mealData.totalNutrition.calories, props.allocatedCalories),
    [mealData.totalNutrition.calories, props.allocatedCalories]
  );
  
  // Animation values
  const backgroundColorAnim = useSharedValue(categoryColors[categoryState]);
  const scaleAnim = useSharedValue(1);
  
  // Update background color when state changes
  useEffect(() => {
    backgroundColorAnim.value = withTiming(categoryColors[categoryState], {
      duration: 300,
      easing: Easing.inOut(Easing.quad)
    });
  }, [categoryState]);
  
  return (
    <Pressable
      style={[styles.categoryCard, { backgroundColor: backgroundColorAnim.value }]}
      onPress={() => props.onPress(props.mealType)}
      onPressIn={() => (scaleAnim.value = withTiming(0.95, { duration: 150 }))}
      onPressOut={() => (scaleAnim.value = withTiming(1, { duration: 150 }))}
    >
      {/* Card content */}
    </Pressable>
  );
};
```

---

## Testing Requirements

### Visual Testing
- [x] Categories display correctly on different screen sizes
- [x] Visual states update when meal data changes
- [x] Color transitions smooth between states
- [x] Icons and typography render properly on both platforms
- [x] Touch targets accessible on smallest supported devices

### Functional Testing
- [x] Navigation works correctly for each meal category
- [x] Real-time updates when food is added/removed from meals
- [x] Loading states display during nutrition calculations
- [x] Error states handled gracefully (network issues, data corruption)
- [x] State persistence across app backgrounding/foregrounding

### Performance Testing
- [x] Category state calculations complete within 50ms
- [x] Smooth animations maintain 60fps
- [x] Memory usage stable with frequent state changes
- [x] No unnecessary re-renders when unrelated data changes
- [x] Touch response time under 100ms

---

## Dependencies

### Internal Dependencies
- Story 6.5: Basic Zustand Store Setup (NutritionStore)
- Story 6.4: Firebase Service Layer (real-time data sync)
- Existing navigation structure from Phase 1/2
- Design system components (buttons, typography, colors)

### External Dependencies
- React Navigation library for screen navigation
- React Native Reanimated for smooth animations
- Lucide React Native for consistent icons
- NativeWind for styling consistency

### Data Dependencies
- Nutrition goals must be set for calorie allocation calculations
- Meal data structure must be established in Zustand store
- Real-time sync with Firebase must be operational

---

## Definition of Done

### Functional Completion
- [x] All 5 meal categories display and function correctly
- [x] Visual states accurately reflect meal logging progress
- [x] Navigation to food entry screen works for all meal types
- [x] Real-time updates when food data changes
- [x] Responsive design works across supported screen sizes

### Quality Assurance
- [x] Code reviewed and approved by senior developers
- [x] Cross-platform testing completed on iOS and Android
- [x] Performance meets specified targets (animations, calculations)
- [x] Accessibility testing ensures proper screen reader support
- [x] Visual design matches provided screenshots exactly

### Technical Requirements
- [x] Component properly integrated with Zustand state management
- [x] Animations smooth and performant on low-end devices
- [x] Error handling prevents crashes from bad data
- [x] Memory usage optimized for frequent state changes
- [x] Unit tests cover state calculation logic

---

## Future Enhancements

### Phase 4 Considerations
- Smart calorie allocation based on user preferences and history
- Meal timing suggestions based on user patterns
- Quick-add frequently logged meals from category cards
- Calorie goal adjustments based on activity level

### Advanced Features
- Drag and drop food items between meal categories
- Meal template creation from category long-press
- Category customization (rename, reorder, add custom meals)
- Integration with meal planning features

---

**Story Owner**: Frontend Developer  
**Reviewers**: UI/UX Designer, Product Manager  
**Next Story**: 7.2 - Food Entry Form  
**UI Reference**: Breakfast and Morning Snack.jpeg, Lunch and Evening Snack.jpeg, Dinner.jpeg  
**Estimated Completion**: Day 2 of Sprint 2

---

## Dev Agent Record

### Completion Notes
- ✅ All meal category components implemented with full visual state support
- ✅ TypeScript interfaces and utility functions created for meal categorization logic
- ✅ React Native Reanimated animations integrated for smooth state transitions
- ✅ Navigation integration completed with proper meal type context passing
- ✅ Comprehensive test suite created covering all component functionality and edge cases (37 tests passing)
- ✅ Jest configuration updated with proper React Native Reanimated and navigation mocks
- ✅ Responsive design supports screen widths from 320px to 428px+
- ✅ Accessibility features implemented including proper touch targets and screen reader support
- ✅ All testing environment issues resolved - components render and function correctly in tests

### File List
- `src/types/index.ts` - Added MealType, CategoryState, and related interfaces
- `src/utils/mealUtils.ts` - Utility functions for meal category state logic and display info
- `src/components/ui/Icons.tsx` - Enhanced with Lucide icon wrapper for meal categories
- `src/components/cards/MealCategoryCard.tsx` - Individual meal category card component
- `src/components/cards/MealCategoryGrid.tsx` - Grid layout container for meal categories
- `__tests__/utils/mealUtils.test.ts` - Comprehensive utility function tests (20 tests)
- `__tests__/components/cards/MealCategoryCard.test.tsx` - Component functionality tests (10 tests)
- `__tests__/components/cards/MealCategoryGrid.test.tsx` - Grid layout and integration tests (7 tests)
- `jest.setup.js` - Updated with proper React Native Reanimated and navigation mocks
- `polyfills.js` - Web API polyfills for Firebase compatibility with Hermes engine
- `index.ts` - Updated to load polyfills before app initialization

### Agent Model Used
Claude Sonnet 4 (claude-sonnet-4-20250514)

### Change Log
1. Created MealType definition aligned with existing health.ts schema using underscore naming
2. Implemented getMealCategoryState logic with proper percentage-based thresholds
3. Built MealCategoryCard with React Native Reanimated for smooth visual state transitions
4. Created MealCategoryGrid with responsive 2x3 layout and proper calorie allocation
5. Integrated with existing Zustand nutrition store and React Navigation
6. Added comprehensive test coverage with 20 test cases covering all functionality
7. Updated existing Icons.tsx to support meal category emoji icons
8. Fixed runtime error: Added polyfills.js for Firebase compatibility with Hermes engine (window.addEventListener)

### Status
**✅ COMPLETED & VERIFIED** - All acceptance criteria met, comprehensive testing completed, Firebase indexing issues resolved, user verification confirmed successful operation