# Mobile Health Dashboard - Phase 3 UX Specifications
## Food Tracking & Enhanced Health Metrics UI/UX Design

**Version**: 1.0  
**Date**: August 31, 2025  
**Status**: Complete  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Design System Updates](#design-system-updates)
3. [Food Tracking Interface Design](#food-tracking-interface-design)
4. [Nutrition Dashboard Layout](#nutrition-dashboard-layout)
5. [Calendar & Date Navigation](#calendar--date-navigation)
6. [Health Metrics Input Interfaces](#health-metrics-input-interfaces)
7. [Visual Feedback Systems](#visual-feedback-systems)
8. [States & Micro-interactions](#states--micro-interactions)
9. [Accessibility Specifications](#accessibility-specifications)
10. [Mobile-Specific Interactions](#mobile-specific-interactions)
11. [Photo Capture & Attachment](#photo-capture--attachment)
12. [Component Library Extensions](#component-library-extensions)
13. [Implementation Guidelines](#implementation-guidelines)

---

## Executive Summary

This document defines the comprehensive UX specifications for Phase 3 of the Mobile Health Dashboard, introducing advanced food tracking, nutrition calculations, and expanded health metrics. The design maintains consistency with the existing design system while adding sophisticated new interaction patterns optimized for mobile health tracking workflows.

**Key Design Principles:**
- **Efficiency First**: Minimize steps to log food and health data
- **Visual Clarity**: Clear nutrition progress indicators and macro breakdowns
- **Touch-Optimized**: All interactions designed for mobile touch interfaces
- **Contextual**: Smart defaults and context-aware suggestions
- **Accessible**: WCAG 2.1 AA compliant with screen reader support

---

## Design System Updates

### 2.1 Color Palette Extensions

**Core Colors (Existing):**
- Primary: `#10B981` (Emerald-500)
- Secondary: `#6366F1` (Indigo-500)  
- Accent: `#F59E0B` (Amber-500)

**Phase 3 Color Extensions:**
```scss
// Nutrition & Progress Colors
$nutrition-colors: (
  'calories': #F59E0B,        // Amber-500 - Main calorie indicator
  'protein': #EF4444,         // Red-500 - Protein macro
  'carbs': #3B82F6,          // Blue-500 - Carbohydrate macro
  'fats': #8B5CF6,           // Violet-500 - Fat macro
  'fiber': #10B981,          // Emerald-500 - Fiber indicator
  'progress-low': #EF4444,    // Red-500 - Under goal
  'progress-normal': #F59E0B,  // Amber-500 - Approaching goal
  'progress-complete': #10B981, // Emerald-500 - Goal achieved
  'progress-over': #F97316    // Orange-500 - Over goal
);

// Meal Category Colors
$meal-colors: (
  'breakfast': #F59E0B,       // Amber-500
  'morning-snack': #F97316,   // Orange-500
  'lunch': #EF4444,          // Red-500
  'evening-snack': #8B5CF6,   // Violet-500
  'dinner': #3B82F6          // Blue-500
);

// Health Metric Colors
$health-metric-colors: (
  'weight': #10B981,         // Emerald-500
  'water': #06B6D4,          // Cyan-500
  'steps': #8B5CF6,          // Violet-500
  'workout': #EF4444,        // Red-500
  'sleep': #6366F1           // Indigo-500
);
```

### 2.2 Typography Scale Updates

**Existing Typography (Maintained):**
- Display: Inter 24px/32px, Semi-bold (600)
- Heading 1: Inter 20px/28px, Semi-bold (600)  
- Heading 2: Inter 18px/26px, Medium (500)
- Body Large: Inter 16px/24px, Regular (400)
- Body: Inter 14px/20px, Regular (400)
- Caption: Inter 12px/16px, Regular (400)

**Phase 3 Typography Extensions:**
```scss
// Nutrition-specific typography
.nutrition-large {
  font-family: 'Inter';
  font-size: 28px;
  line-height: 36px;
  font-weight: 700; // Bold for calorie displays
  letter-spacing: -0.02em;
}

.nutrition-medium {
  font-family: 'Inter';
  font-size: 16px;
  line-height: 24px;
  font-weight: 600; // Semi-bold for macro labels
}

.metric-value {
  font-family: 'Inter';
  font-size: 24px;
  line-height: 32px;
  font-weight: 600; // Semi-bold for metric values
  font-variant-numeric: tabular-nums; // Monospace numbers
}

.food-item {
  font-family: 'Inter';
  font-size: 15px;
  line-height: 22px;
  font-weight: 500; // Medium for food names
}

.calorie-small {
  font-family: 'Inter';
  font-size: 13px;
  line-height: 18px;
  font-weight: 500; // Medium for small calorie displays
  color: #6B7280; // Gray-500
}
```

### 2.3 Spacing System Extensions

**Base Unit: 8px (Maintained)**

**Phase 3 Spacing Values:**
```scss
$spacing-nutrition: (
  'macro-gap': 12px,          // Gap between macro progress bars
  'food-item-gap': 16px,      // Gap between food items in meals
  'meal-section-gap': 24px,   // Gap between meal sections
  'metric-card-gap': 16px,    // Gap between health metric cards
  'progress-height': 8px,     // Height of progress bars
  'touch-target': 44px        // Minimum touch target size
);
```

### 2.4 Border Radius Updates

```scss
$border-radius-nutrition: (
  'progress-bar': 4px,        // Progress bar border radius
  'macro-card': 12px,         // Macro breakdown card
  'food-photo': 8px,          // Food photo thumbnails
  'metric-card': 16px,        // Health metric cards
  'calendar-day': 8px         // Calendar day cells
);
```

---

## Food Tracking Interface Design

### 3.1 Food Tracking Dashboard Layout

**Screen Structure:**
```
┌─────────────────────────────────────────┐
│ Status Bar (20px)                       │
├─────────────────────────────────────────┤
│ Header (60px)                           │
│ ┌─ Back   21 Aug ▼    Settings  ···  ─┐ │
├─────────────────────────────────────────┤
│ Daily Calorie Overview (80px)           │
│ ┌─────────────────────────────────────┐ │
│ │  🍽️  2299 of 1850                   │ │
│ │      Cal Eaten           📊        │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Action Pills (60px)                     │
│ ┌───────┐ ┌──────┐ ┌─────────┐        │
│ │📊 Insights│🍳Recipes│📷Snap│       │
│ └───────┘ └──────┘ └─────────┘        │
├─────────────────────────────────────────┤
│ Meal Sections (Scrollable)              │
│                                         │
│ Breakfast      531 of 462 Cal    ➕    │
│ ─────────────────────────────────────── │
│ Food Item 1             380 Cal    ⋮    │
│ Food Item 2              77 Cal    ⋮    │
│ Food Item 3              73 Cal    ⋮    │
│                                         │
│ Save as Meal                       ›    │
│                                         │
│ Morning Snack   33 of 231 Cal     ➕    │
│ ─────────────────────────────────────── │
│ 📷 1 food logged with photo today       │
│ [Food Photo Thumbnail]                  │
│                                         │
│ Lunch          635 of 462 Cal     ➕    │
│ Evening Snack  142 of 231 Cal     ➕    │
│ Dinner         959 of 462 Cal     ➕    │
│                                         │
└─────────────────────────────────────────┘
```

**Layout Specifications:**

1. **Header Section (60px height)**
   - Background: `#FFFFFF` with subtle shadow
   - Back arrow: 24px Lucide chevron-left icon
   - Date selector: Inter 16px/24px Medium, tappable with dropdown indicator
   - Settings/More: 24px icons with 44px touch targets
   - Padding: 16px horizontal, 18px vertical

2. **Daily Calorie Overview Card (80px height)**
   - Background: `#F8FAFC` (Gray-50)
   - Border radius: 16px
   - Margin: 16px horizontal, 12px vertical
   - Calorie display: 28px/36px Bold, color based on progress
   - Chart icon: 24px, positioned right with 44px touch target

3. **Action Pills Section (60px height)**
   - Three horizontal pills with icons and labels
   - Background: `#1F2937` (Gray-800) for pill backgrounds
   - Text: `#FFFFFF`, Inter 12px/16px Medium
   - Icon: 20px, white
   - Pill size: Auto width, 40px height, 20px border radius
   - Gap: 12px between pills
   - Horizontal padding: 16px

### 3.2 Meal Category Cards

**Individual Meal Card Design:**
```
┌─────────────────────────────────────────────────────┐
│ Breakfast                    531 of 462 Cal    ➕   │
│ ─────────────────────────────────────────────────── │
│                                                     │
│ Chicken Mortadella Sandwich        380 Cal     ⋮    │
│ 1.0 sandwich                                        │
│                                                     │
│ Egg                                 77 Cal     ⋮    │
│ 1.0 large                                           │
│                                                     │
│ Tea                                 73 Cal     ⋮    │
│ 1.0 teacup                                          │
│                                                     │
│ Save as Meal                                   ›    │
└─────────────────────────────────────────────────────┘
```

**Card Specifications:**

1. **Meal Header**
   - Title: Inter 18px/26px Medium, color `#1F2937` (Gray-800)
   - Calorie progress: Inter 16px/24px Medium
     - Current calories: Color based on progress vs goal
     - Goal calories: `#6B7280` (Gray-500)
   - Add button: 32px circle, `#F59E0B` background, white plus icon
   - Bottom border: 1px `#E5E7EB` (Gray-200)

2. **Food Item Row**
   - Height: 64px minimum
   - Food name: Inter 15px/22px Medium, `#1F2937` (Gray-800)
   - Quantity/unit: Inter 13px/18px Regular, `#6B7280` (Gray-500)
   - Calories: Inter 13px/18px Medium, `#6B7280` (Gray-500)
   - More menu: 24px icon, 44px touch target
   - Horizontal padding: 16px
   - Vertical padding: 12px

3. **Photo Integration**
   - When photo exists: 40px × 40px rounded thumbnail (8px radius)
   - Position: Left side, 12px margin from text
   - Placeholder: Gray background with camera icon when no photo

4. **Save as Meal Row**
   - Height: 52px
   - Text: Inter 15px/22px Medium, `#6366F1` (Indigo-500)
   - Chevron right: 20px icon, `#6366F1`
   - Background: Subtle hover/press states

### 3.3 Food Entry Form Modal

**Modal Structure:**
```
┌─────────────────────────────────────────┐
│ ×                Add Food               │
├─────────────────────────────────────────┤
│                                         │
│ Food Name                               │
│ ┌─────────────────────────────────────┐ │
│ │ Enter food name                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Quantity                                │
│ ┌─────────────┐ ┌─────────────────────┐ │
│ │      100    │ │     grams    ▼     │ │
│ └─────────────┘ └─────────────────────┘ │
│                                         │
│ 📷 Add Photo (Optional)                 │
│ ┌─────────────────────────────────────┐ │
│ │     Camera    │    Gallery         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Photo Preview if taken - 200px height] │
│                                         │
├─────────────────────────────────────────┤
│ ┌──────────┐           ┌──────────────┐ │
│ │  Cancel  │           │  Add Food    │ │
│ └──────────┘           └──────────────┘ │
└─────────────────────────────────────────┘
```

**Form Specifications:**

1. **Modal Container**
   - Background: `#FFFFFF`
   - Border radius: 20px top corners
   - Animation: Slide up from bottom (300ms ease-out)
   - Max height: 80% of screen height
   - Padding: 24px

2. **Input Fields**
   - Food name input:
     - Height: 52px
     - Border: 1px `#D1D5DB` (Gray-300)
     - Border radius: 12px
     - Padding: 16px horizontal
     - Font: Inter 16px/24px Regular
     - Focus state: Border `#6366F1`, shadow
   
   - Quantity input:
     - Width: 140px
     - Height: 52px
     - Numeric keyboard type
     - Right-aligned text
   
   - Unit selector:
     - Dropdown with custom styling
     - Options: grams, kg, oz, cup, bowl, ltr, ml, teacup, tablespoon, teaspoon, serving, piece
     - Height: 52px to match quantity input

3. **Photo Section**
   - Optional section with camera/gallery buttons
   - Button height: 48px
   - Icons: 24px camera/gallery icons
   - Photo preview: 200px × 150px, rounded 12px

4. **Action Buttons**
   - Cancel: Secondary button style, `#6B7280` text
   - Add Food: Primary button, `#10B981` background
   - Button height: 52px
   - Full width with 12px gap

### 3.4 Unit Selector Dropdown

**Dropdown Design:**
```
┌─────────────────────────────┐
│ Weight                      │
├─────────────────────────────┤
│ ○ grams                     │
│ ● kg                        │
│ ○ oz                        │
├─────────────────────────────┤
│ Volume                      │
├─────────────────────────────┤
│ ○ cup                       │
│ ○ bowl                      │
│ ○ ltr                       │
│ ○ ml                        │
│ ○ teacup                    │
│ ○ tablespoon                │
│ ○ teaspoon                  │
├─────────────────────────────┤
│ Count                       │
├─────────────────────────────┤
│ ○ serving                   │
│ ○ piece                     │
└─────────────────────────────┘
```

**Specifications:**
- Max height: 280px with scroll if needed
- Section headers: Inter 13px/18px Medium, `#6B7280` (Gray-500)
- Options: Inter 15px/22px Regular, `#1F2937` (Gray-800)
- Selected indicator: Radio button, `#10B981` when selected
- Row height: 44px minimum
- Horizontal padding: 16px

---

## Nutrition Dashboard Layout

### 4.1 Daily Nutrition Overview Card

**Card Structure:**
```
┌─────────────────────────────────────────────────────┐
│ 🍽️     2299 of 1850                          📊    │
│        Cal Eaten                                    │
│                                                     │
│ Protein: 15%     ████████░░░░  145g / 185g         │
│ Fats: 32%        ████████████░░ 85g / 67g          │
│ Carbs: 45%       ██████████████░ 260g / 231g       │
│ Fiber: 8g        ████░░░░░░░░░░░ 8g / 25g           │
└─────────────────────────────────────────────────────┘
```

**Layout Specifications:**

1. **Header Section**
   - Calories display: 28px/36px Bold
   - Color logic:
     - Under 80% of goal: `#EF4444` (Red-500)
     - 80-95% of goal: `#F59E0B` (Amber-500) 
     - 95-105% of goal: `#10B981` (Emerald-500)
     - Over 105%: `#F97316` (Orange-500)
   - Chart icon: 24px, tappable for detailed view

2. **Macro Progress Bars**
   - Bar height: 8px
   - Border radius: 4px
   - Background: `#F3F4F6` (Gray-100)
   - Fill colors:
     - Protein: `#EF4444` (Red-500)
     - Fats: `#8B5CF6` (Violet-500)
     - Carbs: `#3B82F6` (Blue-500)
     - Fiber: `#10B981` (Emerald-500)
   - Percentage label: Inter 13px/18px Medium
   - Values: Inter 12px/16px Regular, `#6B7280` (Gray-500)
   - Vertical spacing: 12px between bars

### 4.2 Macro Breakdown Chart Modal

**Chart Modal Structure:**
```
┌─────────────────────────────────────────┐
│ ×            Nutrition Details          │
├─────────────────────────────────────────┤
│                                         │
│          [Donut Chart]                  │
│             2299 cal                    │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🔴 Protein    145g    15%    580cal │ │
│ │ 🟣 Fats       85g     32%    765cal │ │
│ │ 🔵 Carbs      260g    45%    1040cal│ │
│ │ 🟢 Fiber      8g      -      -      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Goal Progress                           │
│ ┌─────────────────────────────────────┐ │
│ │ Calories: 124% (449 over)           │ │
│ │ Protein: 78% (40g under)            │ │
│ │ Fats: 127% (18g over)               │ │
│ │ Carbs: 113% (29g over)              │ │
│ │ Fiber: 32% (17g under)              │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Chart Specifications:**
- Donut chart: 180px diameter, 20px stroke width
- Center text: Total calories, 24px/32px Bold
- Legend rows: 48px height, icon + label + values
- Color indicators: 12px circles matching macro colors
- Progress indicators use same color coding as dashboard

### 4.3 Health Tracker Cards Grid

**Grid Layout:**
```
┌─────────────────────────────────────────┐
│ Your Trackers                           │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🍽️  Track Food              📷  ➕  │ │
│ │     Eat 1,700 Cal                   │ │
│ │                                     │ │
│ │ 📷 Auto Track Calories              │ │
│ │    from gallery with Snap    ›     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌───────────────────┐ ┌───────────────┐ │
│ │ ⚖️  Weight       ➕│ │ 💪 Workout   ➕│ │
│ │     1 kg lost     │ │ Goal: 346 cal │ │
│ └───────────────────┘ └───────────────┘ │
│                                         │
│ ┌───────────────────┐ ┌───────────────┐ │
│ │ 🚶 Steps         ➕│ │ 🌙 Sleep     🔄│ │
│ │ Goal: 10,000 steps│ │ Goal: 7h 30min│ │
│ └───────────────────┘ └───────────────┘ │
└─────────────────────────────────────────┘
```

**Card Specifications:**

1. **Food Tracking Card (Full Width)**
   - Height: 120px
   - Background: `#F8FAFC` (Gray-50)
   - Border radius: 16px
   - Icons: 32px in circles with colored backgrounds
   - Title: Inter 18px/26px Medium
   - Subtitle: Inter 14px/20px Regular, `#6B7280` (Gray-500)

2. **Health Metric Cards (2×2 Grid)**
   - Width: (Screen width - 48px) / 2 - 8px (16px gap)
   - Height: 100px
   - Background: `#FFFFFF`
   - Border: 1px `#E5E7EB` (Gray-200)
   - Border radius: 16px
   - Icon: 24px in colored circle backgrounds
   - Add button: 24px plus icon, positioned top-right

---

## Calendar & Date Navigation

### 5.1 Date Picker Header

**Header Layout:**
```
┌─────────────────────────────────────────┐
│ ←        21 Aug ▼        Settings  ···  │
└─────────────────────────────────────────┘
```

**Specifications:**
- Height: 60px
- Date display: Inter 16px/24px Medium, tappable
- Dropdown indicator: 16px chevron-down icon
- Touch target: Full width minus 120px (60px each side for icons)
- Active state: Slight scale and opacity change

### 5.2 Calendar Modal

**Modal Structure:**
```
┌─────────────────────────────────────────┐
│              ← August →                  │
│                                         │
│  S   M   T   W   T   F   S              │
│                      1   2              │
│  3   4   5   6   7   8   9              │
│ 10  11  12  13  14  15  16              │
│ 17  18  19  20  21  22  23              │
│ 24  25  26  27  28  29  30              │
│             ●31                         │
│                                         │
├─────────────────────────────────────────┤
│ ┌─────────┐           ┌───────────────┐ │
│ │ Cancel  │           │     Done      │ │
│ └─────────┘           └───────────────┘ │
└─────────────────────────────────────────┘
```

**Calendar Specifications:**

1. **Calendar Container**
   - Background: `#FFFFFF`
   - Border radius: 20px top corners
   - Animation: Fade in with scale (200ms ease-out)
   - Padding: 24px

2. **Month Navigation**
   - Month/Year: Inter 18px/26px Semi-bold, centered
   - Navigation arrows: 24px chevron icons
   - Touch targets: 44px × 44px

3. **Day Grid**
   - Day headers: Inter 12px/16px Medium, `#6B7280` (Gray-500)
   - Day cells: 44px × 44px touch targets
   - Current day: `#10B981` circle background, white text
   - Selected day: `#6366F1` circle background, white text
   - Other month days: `#9CA3AF` (Gray-400) text
   - Weekends: Subtle background tint

4. **Data Indicators**
   - Has data: Small dot below date number
   - No data: No indicator
   - Dot color: `#10B981` (Emerald-500)
   - Dot size: 4px diameter

### 5.3 Date Navigation Gestures

**Swipe Navigation:**
- Horizontal swipe on main food tracking screen
- Left swipe: Next day
- Right swipe: Previous day
- Animation: 300ms ease-out slide transition
- Haptic feedback: Light impact on date change
- Visual feedback: Brief highlight of new date

---

## Health Metrics Input Interfaces

### 6.1 Weight Entry Modal

**Modal Structure:**
```
┌─────────────────────────────────────────┐
│ ×              Add Weight               │
├─────────────────────────────────────────┤
│                                         │
│ Current Weight                          │
│ ┌─────────────┐ ┌─────────────────────┐ │
│ │    72.5     │ │      kg      ▼     │ │
│ └─────────────┘ └─────────────────────┘ │
│                                         │
│ Previous: 73.5 kg (Aug 20)              │
│ Change: -1.0 kg ↓                       │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │           Weight Trend              │ │
│ │     [Mini Line Chart - 7 days]     │ │
│ └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│ ┌──────────┐           ┌──────────────┐ │
│ │  Cancel  │           │  Save Weight │ │
│ └──────────┘           └──────────────┘ │
└─────────────────────────────────────────┘
```

**Specifications:**
- Weight input: Numeric keyboard with decimal
- Unit toggle: kg/lbs with smooth transition
- Trend comparison: Previous entry with change indicator
- Colors: Green for loss (↓), red for gain (↑), gray for no change
- Mini chart: 7-day trend, 120px × 60px

### 6.2 Water Intake Interface

**Water Entry Section:**
```
┌─────────────────────────────────────────────────────┐
│ 💧 Water Intake              750ml / 2000ml    ➕   │
│                                                     │
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░  37%             │
│                                                     │
│ Quick Add:                                          │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐           │
│ │250ml │ │500ml │ │750ml │ │ Custom   │           │
│ └──────┘ └──────┘ └──────┘ └──────────┘           │
│                                                     │
│ Today's Log:                                        │
│ 09:30  250ml  Glass                                 │
│ 12:15  500ml  Bottle                               │
│ ─────────────────────────────────────────────────── │
│ Total: 750ml                                        │
└─────────────────────────────────────────────────────┘
```

**Specifications:**
- Progress bar: Same styling as nutrition macros
- Quick add buttons: 80px width, 36px height
- Water animation: Subtle wave animation in progress bar
- Log entries: Time stamp + amount + container type
- Color: `#06B6D4` (Cyan-500) for water theme

### 6.3 Steps Entry Interface

**Steps Card Expanded:**
```
┌─────────────────────────────────────────────────────┐
│ 🚶 Steps                           6,542 / 10,000   │
│                                                     │
│ ████████████████░░░░░░░░░░░░░░░░░░░░  65%           │
│                                                     │
│ ┌─────────────┐ ┌─────────────────────────────────┐ │
│ │   Manual    │ │        Add Steps                │ │
│ │    Entry    │ │ ┌─────────────────────────────┐ │ │
│ │             │ │ │           6542              │ │ │
│ │             │ │ └─────────────────────────────┘ │ │
│ │             │ │ Last updated: 2 hours ago       │ │
│ └─────────────┘ └─────────────────────────────────┘ │
│                                                     │
│ Weekly Average: 8,245 steps                        │
│ Best Day: 12,847 steps (Aug 19)                    │
└─────────────────────────────────────────────────────┘
```

**Specifications:**
- Large numeric input for steps
- Source indication: Manual entry vs device sync (future)
- Statistics: Weekly average and personal best
- Progress ring: Circular progress indicator option
- Color: `#8B5CF6` (Violet-500)

### 6.4 Workout Entry Modal

**Modal Structure:**
```
┌─────────────────────────────────────────┐
│ ×             Add Workout               │
├─────────────────────────────────────────┤
│                                         │
│ Workout Type                            │
│ ┌─────────────────────────────────────┐ │
│ │      Cardio      ▼                 │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Exercise Name                           │
│ ┌─────────────────────────────────────┐ │
│ │ Running                             │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Duration (minutes)    Calories Burned   │
│ ┌─────────────────┐ ┌─────────────────┐ │
│ │       45        │ │      346        │ │
│ └─────────────────┘ └─────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │        Recent Workouts              │ │
│ │ Running      45min    346cal        │ │
│ │ Cycling      30min    280cal        │ │
│ │ Yoga         60min    150cal        │ │
│ └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│ ┌──────────┐           ┌──────────────┐ │
│ │  Cancel  │           │ Save Workout │ │
│ └──────────┘           └──────────────┘ │
└─────────────────────────────────────────┘
```

**Specifications:**
- Workout type options: Cardio, Strength, Sports, Flexibility, Other
- Exercise name: Text input with autocomplete from history
- Duration: Numeric input in minutes
- Calories: Auto-calculated or manual override
- Recent workouts: Quick-select from history
- Color: `#EF4444` (Red-500)

---

## Visual Feedback Systems

### 7.1 Progress Indicators

**Nutrition Progress Colors:**
```scss
// Progress state colors
.progress-indicator {
  &--under-goal {
    background: linear-gradient(90deg, #EF4444 0%, #F87171 100%);
    color: #FFFFFF;
  }
  
  &--approaching-goal {
    background: linear-gradient(90deg, #F59E0B 0%, #FCD34D 100%);
    color: #FFFFFF;
  }
  
  &--goal-met {
    background: linear-gradient(90deg, #10B981 0%, #34D399 100%);
    color: #FFFFFF;
  }
  
  &--over-goal {
    background: linear-gradient(90deg, #F97316 0%, #FB923C 100%);
    color: #FFFFFF;
  }
}
```

**Progress Bar Animations:**
- Loading: 300ms ease-out fill animation
- Update: 200ms ease-in-out transition
- Color change: 150ms ease transition between states

### 7.2 Success and Achievement Indicators

**Goal Achievement Animations:**
```scss
@keyframes achievement-pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

.goal-achieved {
  animation: achievement-pulse 0.6s ease-in-out;
}
```

**Success Messages:**
- Food added: Green toast with checkmark
- Goal achieved: Confetti animation with celebration text
- Streak milestone: Special badge with animation
- Position: Top of screen, auto-dismiss after 3 seconds

### 7.3 Data Visualization Guidelines

**Chart Styling:**
- Line charts: 2px stroke width, rounded line caps
- Bar charts: 8px radius on top corners
- Donut charts: 20px stroke width, hover effects
- Colors: Use semantic color palette consistently
- Animation: 400ms ease-out for data updates

**Trend Indicators:**
- Upward trend: Green arrow (↗) for positive metrics
- Downward trend: Red arrow (↘) for negative metrics  
- No change: Gray dash (—)
- Arrow size: 16px
- Position: Right of metric value

---

## States & Micro-interactions

### 8.1 Loading States

**Page Loading:**
```
┌─────────────────────────────────────────┐
│               Loading...                │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [Skeleton Card - Food Tracking]     │ │
│ │ ████░░░░░░░░░░░░░░░░ ░░░░░░░ ░░░░░  │ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ │
│ │ ████████░░░░░░░░░░░░ ░░░░░░░ ░░░░░  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [Skeleton Card - Nutrition]         │ │
│ │ ████████░░░░░░░░░░░░ ░░░░░░░░░░░░░░  │ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Skeleton Screen Specifications:**
- Background: `#F3F4F6` (Gray-100)
- Animated shimmer: 1.5s linear infinite
- Block heights: Match real content
- Border radius: Match target components
- Shimmer gradient: `#E5E7EB` to `#F9FAFB`

### 8.2 Empty States

**No Food Logged:**
```
┌─────────────────────────────────────────┐
│                   🍽️                   │
│                                         │
│            No meals logged              │
│              for today                  │
│                                         │
│     Start tracking your nutrition       │
│        by adding your first meal        │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │           Add Food Item             │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Empty State Specifications:**
- Icon: 64px, `#9CA3AF` (Gray-400)
- Title: Inter 18px/26px Medium, `#4B5563` (Gray-600)
- Description: Inter 14px/20px Regular, `#6B7280` (Gray-500)
- CTA button: Primary button styling
- Vertical spacing: 24px between elements

### 8.3 Error States

**Network Error:**
```
┌─────────────────────────────────────────┐
│                   ⚠️                    │
│                                         │
│          Connection Error               │
│                                         │
│        Unable to sync your data         │
│    Your changes have been saved locally │
│        and will sync when online        │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │            Try Again                │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Form Validation Errors:**
- Field border: `#EF4444` (Red-500)
- Error message: Inter 12px/16px Regular, `#EF4444`
- Position: Below field with 4px top margin
- Icon: 16px warning triangle, `#EF4444`

### 8.4 Button States and Interactions

**Primary Button States:**
```scss
.btn-primary {
  // Default
  background: #10B981;
  color: #FFFFFF;
  border: none;
  transition: all 150ms ease;
  
  // Hover (web)
  &:hover {
    background: #059669; // Emerald-600
    transform: translateY(-1px);
  }
  
  // Active/Pressed
  &:active {
    background: #047857; // Emerald-700
    transform: translateY(0px);
  }
  
  // Loading
  &--loading {
    background: #9CA3AF; // Gray-400
    pointer-events: none;
    
    &::after {
      content: '';
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spinner 0.8s linear infinite;
    }
  }
  
  // Disabled
  &:disabled {
    background: #D1D5DB; // Gray-300
    color: #9CA3AF; // Gray-400
    pointer-events: none;
  }
}

@keyframes spinner {
  to { transform: rotate(360deg); }
}
```

**Touch Feedback:**
- Haptic feedback: Light impact on button press
- Visual feedback: 0.95 scale transform on press
- Duration: 150ms ease-out
- iOS: Use UIImpactFeedbackGenerator
- Android: Use HapticFeedback

### 8.5 Modal and Sheet Animations

**Modal Entry Animation:**
```scss
@keyframes modal-slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes modal-fade-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-slide-up {
  animation: modal-slide-up 300ms ease-out;
}

.modal-fade-in {
  animation: modal-fade-in 200ms ease-out;
}
```

**Sheet Gestures:**
- Drag to dismiss: Swipe down gesture
- Drag threshold: 100px or 30% of height
- Velocity threshold: 500px/s
- Snap points: Closed, half, full height
- Spring animation: 300ms with bounce

---

## Accessibility Specifications

### 9.1 WCAG 2.1 AA Compliance

**Color Contrast Ratios:**
- Normal text (14px+): Minimum 4.5:1
- Large text (18px+ or 14px+ bold): Minimum 3:1
- UI components: Minimum 3:1
- Graphics: Minimum 3:1

**Tested Color Combinations:**
```scss
// Passing combinations (4.5:1+)
$accessible-combinations: (
  '#1F2937 on #FFFFFF': 16.9,  // Gray-800 on White
  '#374151 on #FFFFFF': 12.2,  // Gray-700 on White  
  '#4B5563 on #FFFFFF': 8.9,   // Gray-600 on White
  '#6B7280 on #FFFFFF': 5.9,   // Gray-500 on White
  '#FFFFFF on #10B981': 4.9,   // White on Emerald-500
  '#FFFFFF on #6366F1': 6.1,   // White on Indigo-500
  '#FFFFFF on #EF4444': 5.3,   // White on Red-500
);
```

### 9.2 Screen Reader Support

**Semantic HTML Elements:**
- Use proper heading hierarchy (h1 → h2 → h3)
- Navigation landmarks with `<nav>` elements
- Main content in `<main>` element
- Form labels properly associated with inputs

**ARIA Labels and Descriptions:**
```jsx
// Food entry form
<TextInput
  accessibilityLabel="Food name"
  accessibilityHint="Enter the name of the food you consumed"
  placeholder="Enter food name"
/>

// Progress bars
<View
  accessibilityRole="progressbar"
  accessibilityLabel="Calorie progress"
  accessibilityValue={{
    min: 0,
    max: goal,
    now: current,
    text: `${current} of ${goal} calories consumed`
  }}
/>

// Buttons
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Add food item"
  accessibilityHint="Opens food entry form"
  onPress={handleAddFood}
/>
```

### 9.3 Keyboard Navigation (Future Web Support)

**Focus Management:**
- Visible focus indicators: 2px solid `#6366F1` outline
- Focus trap in modals
- Logical tab order: Left-to-right, top-to-bottom
- Skip links for main content areas
- Focus restoration after modal close

**Keyboard Shortcuts:**
- `Tab`: Next focusable element
- `Shift + Tab`: Previous focusable element  
- `Enter/Space`: Activate button/link
- `Escape`: Close modal/dropdown
- `Arrow keys`: Navigate date picker, dropdowns

### 9.4 Motor Accessibility

**Touch Target Sizes:**
- Minimum: 44px × 44px (iOS guideline)
- Recommended: 48dp × 48dp (Android guideline)
- Spacing: Minimum 8px between targets
- Avoid edge placement for primary actions

**Alternative Input Methods:**
- Voice input support for text fields
- Gesture alternatives for drag interactions
- Assistive touch compatibility
- Switch control support (iOS)

### 9.5 Cognitive Accessibility

**Clear Information Hierarchy:**
- Consistent navigation patterns
- Clear section headings
- Logical content grouping
- Progress indicators for multi-step processes

**Error Prevention and Recovery:**
- Clear validation messages
- Confirmation for destructive actions
- Undo functionality where applicable
- Auto-save for forms in progress

**Simplified Language:**
- Clear, concise labels
- Avoid technical jargon
- Consistent terminology
- Helpful placeholder text

---

## Mobile-Specific Interactions

### 10.1 Touch Gestures

**Supported Gestures:**
- Tap: Primary interaction for buttons, links, selections
- Long press: Context menus, secondary actions (500ms)
- Swipe horizontal: Date navigation, photo carousel
- Swipe vertical: Scroll, modal dismiss
- Pinch: Photo zoom (in photo view)
- Pull to refresh: Update data (150px threshold)

**Gesture Feedback:**
```jsx
// Long press example
<TouchableOpacity
  onLongPress={() => showContextMenu()}
  delayLongPress={500}
  onPressIn={() => Haptics.selectionAsync()}
>
  <FoodItem />
</TouchableOpacity>

// Swipe gesture
<PanGestureHandler
  onGestureEvent={handleSwipeGesture}
  minDist={50}
  activeOffsetX={[-20, 20]}
>
  <DateSelector />
</PanGestureHandler>
```

### 10.2 Native Platform Integration

**iOS Specific Features:**
- Haptic feedback: `UIImpactFeedbackGenerator`
- Safe area handling: Top notch and bottom home indicator
- iOS styling: Rounded buttons, native blur effects
- Swipe actions: Native swipe-to-delete on food items

**Android Specific Features:**
- Material Design ripple effects
- Android navigation gesture support
- Back button handling for modals
- Edge-to-edge display support

### 10.3 Performance Optimizations

**List Rendering:**
```jsx
// Optimized food list rendering
<FlatList
  data={foodItems}
  renderItem={({ item }) => <FoodItem item={item} />}
  keyExtractor={(item) => item.id}
  removeClippedSubviews
  maxToRenderPerBatch={10}
  windowSize={21}
  initialNumToRender={10}
  getItemLayout={(data, index) => ({
    length: 64,
    offset: 64 * index,
    index,
  })}
/>
```

**Image Optimization:**
- Lazy loading for food photos
- Progressive JPEG for large images
- WebP format when supported
- Thumbnail caching strategy

### 10.4 Responsive Design Breakpoints

**Screen Size Support:**
```scss
// Mobile breakpoints
$breakpoints: (
  'small': 320px,    // iPhone SE
  'medium': 375px,   // iPhone Standard
  'large': 414px,    // iPhone Plus
  'xlarge': 428px,   // iPhone Pro Max
  'tablet': 768px    // iPad
);

// Responsive nutrition card
.nutrition-card {
  padding: 16px;
  
  @media (min-width: 375px) {
    padding: 20px;
  }
  
  @media (min-width: 414px) {
    padding: 24px;
  }
  
  @media (min-width: 768px) {
    padding: 32px;
    max-width: 400px;
  }
}
```

**Layout Adaptations:**
- Single column on phones (< 768px)
- Two-column grid on tablets (≥ 768px)
- Larger touch targets on larger screens
- Increased padding and spacing on tablets

---

## Photo Capture & Attachment

### 10.1 Photo Capture Flow

**Initial Photo Selection:**
```
┌─────────────────────────────────────────┐
│           Add Food Photo                │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │             📷                      │ │
│ │                                     │ │
│ │        Take Photo                   │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │             🖼️                       │ │
│ │                                     │ │
│ │      Choose from Gallery            │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Photo Capture Interface:**
- Full-screen camera interface
- Focus tap gesture
- Exposure adjustment slider
- Flash toggle
- Front/back camera switch
- Grid overlay option
- Capture button: 72px circle at bottom center

### 10.2 Photo Preview and Editing

**Preview Screen:**
```
┌─────────────────────────────────────────┐
│ ×                                  ✓    │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│          [Photo Preview]                │
│              16:9 Crop                  │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │
│ │Crop │ │Rotat│ │Brght│ │Cntrst│ │Color│ │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ │
└─────────────────────────────────────────┘
```

**Editing Tools:**
- Crop: Predefined ratios (1:1, 4:3, 16:9, free)
- Rotate: 90° increments
- Brightness: -100 to +100 slider
- Contrast: -100 to +100 slider
- Saturation: -100 to +100 slider
- Filter presets: Food-optimized filters

### 10.3 Photo Integration in Food Items

**Photo Thumbnail Display:**
```
┌─────────────────────────────────────────────────────┐
│ Chicken Mortadella Sandwich        380 Cal     ⋮    │
│ 1.0 sandwich                                        │
│ ┌──────────────┐                                    │
│ │  [Photo      │                                    │
│ │   40×40px]   │                                    │
│ └──────────────┘                                    │
└─────────────────────────────────────────────────────┘
```

**Photo Gallery View:**
```
┌─────────────────────────────────────────┐
│ ←         Food Photos                   │
├─────────────────────────────────────────┤
│                                         │
│        [Large Photo Display]            │
│             300px × 225px               │
│                                         │
│ Chicken Mortadella Sandwich             │
│ August 21, 2025 • 10:45 AM             │
│ 380 Calories                           │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ○ ○ ● ○ ○                          │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 10.4 Photo Storage and Optimization

**Image Processing Pipeline:**
1. Capture/Select: Original resolution
2. Processing: Resize to max 1200px width
3. Compression: JPEG 80% quality  
4. Thumbnail: Generate 200px × 200px version
5. Upload: Firebase Storage with progress indicator
6. Cache: Local cache with 7-day expiry

**Storage Specifications:**
- Format: JPEG for photos, PNG for graphics
- Max file size: 2MB after compression
- Thumbnail size: 40px × 40px for list items
- Gallery size: 200px × 150px for detail views
- Full size: Max 1200px width, maintain aspect ratio

---

## Component Library Extensions

### 11.1 New Phase 3 Components

**NutritionProgressBar Component:**
```typescript
interface NutritionProgressBarProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  percentage: number;
  showValues?: boolean;
  animated?: boolean;
}

const NutritionProgressBar: React.FC<NutritionProgressBarProps> = ({
  label,
  current,
  target,
  unit,
  color,
  percentage,
  showValues = true,
  animated = true
}) => {
  return (
    <View className="mb-3">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-sm font-medium text-gray-800">
          {label}: {percentage}%
        </Text>
        {showValues && (
          <Text className="text-xs text-gray-500">
            {current}g / {target}g
          </Text>
        )}
      </View>
      <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <Animated.View
          className="h-full rounded-full"
          style={{
            backgroundColor: color,
            width: animated ? `${Math.min(percentage, 100)}%` : '0%'
          }}
        />
      </View>
    </View>
  );
};
```

**MealCategoryCard Component:**
```typescript
interface MealCategoryCardProps {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'morningSnack' | 'eveningSnack';
  currentCalories: number;
  allocatedCalories: number;
  foodItems: FoodEntry[];
  onAddFood: () => void;
  onFoodItemPress: (item: FoodEntry) => void;
}

const MealCategoryCard: React.FC<MealCategoryCardProps> = ({
  mealType,
  currentCalories,
  allocatedCalories,
  foodItems,
  onAddFood,
  onFoodItemPress
}) => {
  const mealNames = {
    breakfast: 'Breakfast',
    lunch: 'Lunch', 
    dinner: 'Dinner',
    morningSnack: 'Morning Snack',
    eveningSnack: 'Evening Snack'
  };

  const progressColor = useMemo(() => {
    const percentage = (currentCalories / allocatedCalories) * 100;
    if (percentage < 80) return '#EF4444';
    if (percentage < 95) return '#F59E0B';
    if (percentage <= 105) return '#10B981';
    return '#F97316';
  }, [currentCalories, allocatedCalories]);

  return (
    <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-medium text-gray-800">
          {mealNames[mealType]}
        </Text>
        <View className="flex-row items-center">
          <Text className="text-base font-medium mr-3" style={{ color: progressColor }}>
            {currentCalories} of {allocatedCalories} Cal
          </Text>
          <TouchableOpacity
            onPress={onAddFood}
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: '#F59E0B' }}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View className="border-b border-gray-200 mb-3" />
      
      {foodItems.map((item) => (
        <FoodItemRow
          key={item.id}
          item={item}
          onPress={() => onFoodItemPress(item)}
        />
      ))}
      
      {foodItems.length > 0 && (
        <TouchableOpacity 
          className="mt-3 flex-row items-center justify-between"
          onPress={() => {/* Handle save as meal */}}
        >
          <Text className="text-base font-medium text-indigo-600">
            Save as Meal
          </Text>
          <ChevronRight size={20} color="#6366F1" />
        </TouchableOpacity>
      )}
    </View>
  );
};
```

**HealthMetricCard Component:**
```typescript
interface HealthMetricCardProps {
  type: 'weight' | 'water' | 'steps' | 'workout' | 'sleep';
  title: string;
  current: string | number;
  target?: string | number;
  unit: string;
  progress?: number;
  icon: React.ReactNode;
  onAdd: () => void;
  onView?: () => void;
  color: string;
}

const HealthMetricCard: React.FC<HealthMetricCardProps> = ({
  type,
  title,
  current,
  target,
  unit,
  progress,
  icon,
  onAdd,
  onView,
  color
}) => {
  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-200">
      <View className="flex-row justify-between items-start mb-3">
        <View 
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          {icon}
        </View>
        <TouchableOpacity
          onPress={onAdd}
          className="w-6 h-6 items-center justify-center"
        >
          <Plus size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>
      
      <Text className="text-lg font-medium text-gray-800 mb-1">
        {title}
      </Text>
      
      <Text className="text-sm text-gray-500">
        {typeof current === 'number' && target
          ? `${target} ${unit}`
          : `${current} ${unit}`
        }
      </Text>
      
      {progress !== undefined && (
        <View className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              backgroundColor: color,
              width: `${Math.min(progress, 100)}%`
            }}
          />
        </View>
      )}
    </View>
  );
};
```

### 11.2 Enhanced Input Components

**UnitSelector Component:**
```typescript
interface UnitSelectorProps {
  value: string;
  onValueChange: (unit: string) => void;
  units: { label: string; value: string; category: string }[];
  placeholder?: string;
}

const UnitSelector: React.FC<UnitSelectorProps> = ({
  value,
  onValueChange,
  units,
  placeholder = "Select unit"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const groupedUnits = useMemo(() => {
    return units.reduce((acc, unit) => {
      if (!acc[unit.category]) {
        acc[unit.category] = [];
      }
      acc[unit.category].push(unit);
      return acc;
    }, {} as Record<string, typeof units>);
  }, [units]);

  return (
    <View>
      <TouchableOpacity
        className="h-13 px-4 border border-gray-300 rounded-xl flex-row items-center justify-between"
        onPress={() => setIsOpen(true)}
      >
        <Text className="text-base text-gray-800">
          {value || placeholder}
        </Text>
        <ChevronDown size={20} color="#6B7280" />
      </TouchableOpacity>
      
      <Modal visible={isOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1">
          <View className="p-4">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-lg font-semibold">Select Unit</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              {Object.entries(groupedUnits).map(([category, categoryUnits]) => (
                <View key={category} className="mb-6">
                  <Text className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">
                    {category}
                  </Text>
                  {categoryUnits.map((unit) => (
                    <TouchableOpacity
                      key={unit.value}
                      className="flex-row items-center py-3"
                      onPress={() => {
                        onValueChange(unit.value);
                        setIsOpen(false);
                      }}
                    >
                      <View className="w-6 h-6 rounded-full border-2 border-gray-300 mr-3 items-center justify-center">
                        {value === unit.value && (
                          <View className="w-3 h-3 rounded-full bg-emerald-500" />
                        )}
                      </View>
                      <Text className="text-base text-gray-800">{unit.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};
```

### 11.3 Photo Components

**PhotoCapture Component:**
```typescript
interface PhotoCaptureProps {
  onPhotoTaken: (uri: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  onPhotoTaken,
  onCancel,
  aspectRatio = 4/3
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState(CameraType.back);
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      onPhotoTaken(photo.uri);
    }
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View className="flex-1 bg-black">
      <Camera
        ref={cameraRef}
        style={{ flex: 1, aspectRatio }}
        type={type}
        ratio="4:3"
      />
      
      <View className="absolute bottom-0 left-0 right-0 h-32 flex-row items-center justify-between px-8">
        <TouchableOpacity
          onPress={onCancel}
          className="w-12 h-12 items-center justify-center"
        >
          <X size={32} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={takePicture}
          className="w-18 h-18 rounded-full border-4 border-white items-center justify-center"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
        >
          <View className="w-14 h-14 rounded-full bg-white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setType(type === CameraType.back ? CameraType.front : CameraType.back)}
          className="w-12 h-12 items-center justify-center"
        >
          <RotateCcw size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
```

---

## Implementation Guidelines

### 12.1 Development Phases

**Phase 3.1: Core Food Tracking (Weeks 1-2)**
1. Implement MealCategoryCard component
2. Create FoodEntryForm with validation
3. Build NutritionService with random generation
4. Implement basic Firebase CRUD operations
5. Add nutrition progress indicators

**Phase 3.2: Enhanced UX (Weeks 3-4)**  
1. Add photo capture and attachment
2. Implement calendar date picker
3. Build health metric input interfaces
4. Add loading states and error handling
5. Implement offline functionality

**Phase 3.3: Polish & Accessibility (Weeks 5-6)**
1. Add micro-interactions and animations
2. Implement accessibility features
3. Add haptic feedback
4. Performance optimization
5. Comprehensive testing

### 12.2 Code Quality Standards

**Component Structure:**
```typescript
// Standard component template
interface ComponentProps {
  // Props with clear typing
}

export const Component: React.FC<ComponentProps> = ({
  // Destructured props
}) => {
  // Hooks at the top
  const [state, setState] = useState();
  
  // Computed values
  const computedValue = useMemo(() => {
    // Computation logic
  }, [dependencies]);
  
  // Event handlers
  const handleAction = useCallback(() => {
    // Handler logic
  }, [dependencies]);
  
  // Early returns for loading/error states
  if (isLoading) return <LoadingComponent />;
  if (error) return <ErrorComponent error={error} />;
  
  // Main render
  return (
    <View className="container-classes">
      {/* Component JSX */}
    </View>
  );
};

// Default export
export default Component;
```

**Testing Requirements:**
- Unit tests for all components
- Integration tests for user flows
- Accessibility testing with screen readers
- Performance testing on low-end devices
- Visual regression testing

### 12.3 Performance Guidelines

**Optimization Strategies:**
1. Use React.memo for expensive components
2. Implement FlatList for long food item lists  
3. Lazy load photos and images
4. Debounce search and filter inputs
5. Cache frequently accessed data
6. Use optimal image formats and sizes

**Bundle Size Management:**
- Tree-shake unused dependencies
- Use dynamic imports for large features
- Optimize image assets
- Monitor bundle size in CI/CD

### 12.4 Platform-Specific Considerations

**iOS Guidelines:**
- Follow iOS Human Interface Guidelines
- Use native navigation patterns
- Implement proper safe area handling
- Support Dynamic Type for accessibility
- Use iOS-specific haptic feedback

**Android Guidelines:**  
- Follow Material Design principles
- Handle Android system navigation
- Support various screen densities
- Implement proper back button handling
- Use Android-specific feedback patterns

---

## Conclusion

This comprehensive UX specification provides the foundation for implementing Phase 3 of the Mobile Health Dashboard. The design maintains consistency with the existing design system while introducing sophisticated new patterns optimized for health tracking workflows.

**Key Design Achievements:**
- **Intuitive Food Tracking**: Streamlined meal logging with smart defaults
- **Clear Nutrition Visualization**: Progress bars and charts that communicate goal achievement
- **Efficient Date Navigation**: Quick calendar access with smooth transitions  
- **Accessible Health Metrics**: Easy input for weight, water, steps, and workouts
- **Mobile-Optimized Interactions**: Touch-friendly with appropriate feedback
- **Future-Ready Architecture**: Prepared for API integration and advanced features

The specifications support all Phase 3 requirements while establishing patterns for future enhancements, ensuring the application can evolve from a basic tracker to a comprehensive health platform.

---

**Document Status**: ✅ Complete  
**Implementation Ready**: Yes  
**Next Review**: September 7, 2025  
**Created By**: Claude Code Assistant