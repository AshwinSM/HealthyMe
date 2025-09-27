# Phase 3: Food Tracking User Stories
## Epic 1: Food Tracking System

---

## Story 1.1: Meal Category Selection
**As a user, I want to track food for different meal types so that I can organize my daily nutrition intake.**

**Acceptance Criteria:**
- User can select from 5 meal categories: Breakfast, Lunch, Dinner, Morning Snack, Evening Snack
- Each meal category shows current calorie count vs. allocated calories
- Visual design matches provided UI screenshots
- Tapping a meal category opens the food entry interface

**UI Reference:** Breakfast and Morning Snack.jpeg, Lunch and Evening Snack.jpeg, Dinner.jpeg

---

## Story 1.2: Food Entry Form
**As a user, I want to enter food items with quantities so that I can track what I've consumed.**

**Acceptance Criteria:**
- Food name input field (text input)
- Quantity input field (numeric)
- Unit selection dropdown with options:
  - Weight: grams, kg, oz
  - Volume: cup, bowl, ltr, ml, teacup, tablespoon, teaspoon
  - Count: serving, piece
- Optional photo attachment capability
- Save/Add button to confirm entry
- Cancel option to discard entry

**Technical Notes:**
- Form validation for required fields
- Input sanitization for food names
- Numeric validation for quantity (positive numbers only)
- Photo compression and optimization before upload

---

## Story 1.3: Nutrition Calculation
**As a user, I want to see calorie and macro information for my food entries so that I can track my nutritional intake.**

**Acceptance Criteria:**
- **Phase 3 Implementation**: Random calorie generation (150-800 cal range)
- **Phase 3 Implementation**: Random macro distribution:
  - Protein: 10-30% of calories
  - Carbs: 40-65% of calories  
  - Fats: 20-35% of calories
  - Fiber: 5-15g random
- Display individual food item calories
- Show aggregated meal calories
- **Future Enhancement**: Integration with nutrition API for accurate calculations

**Calculation Logic:**
```javascript
// Phase 3 Random Generation Logic
calories = random(150, 800);
protein = (calories * random(0.10, 0.30)) / 4; // 4 cal/g
carbs = (calories * random(0.40, 0.65)) / 4;   // 4 cal/g  
fats = (calories * random(0.20, 0.35)) / 9;    // 9 cal/g
fiber = random(5, 15);
```

---

## Story 1.4: Meal Summary View
**As a user, I want to see all foods I've logged for each meal so that I can review my daily intake.**

**Acceptance Criteria:**
- List all food items per meal with:
  - Food name
  - Quantity and unit
  - Individual calorie count
  - Optional food photo thumbnail
- Show meal total calories
- Edit/delete individual food items
- "Save as Meal" functionality for future quick-add

**Interaction Design:**
- Swipe-to-delete gesture for food items
- Tap to edit functionality
- Long-press context menu for additional actions
- Pull-to-refresh for meal data sync

---

## Epic 2: Nutrition Dashboard

## Story 2.1: Daily Nutrition Overview
**As a user, I want to see my total daily nutrition intake so that I can monitor my health goals.**

**Acceptance Criteria:**
- Total calories consumed display
- Macro breakdown with visual indicators:
  - Protein (grams and %)
  - Carbs (grams and %)
  - Fats (grams and %)  
  - Fiber (grams)
- Progress bars showing goal vs. actual
- Color-coded indicators (green=goal met, orange=close, red=over/under)

**UI Reference:** homepagewithtrackerstats.jpeg

**Visual Design Requirements:**
- Circular progress indicators for main calorie goal
- Horizontal progress bars for macro breakdowns
- Percentage and absolute value displays
- Responsive layout for different screen sizes

---

**Dependencies:**
- Firebase Firestore for data persistence
- React Hook Form for form management
- React Native Image Picker for photo functionality
- Date picker component for meal timestamps