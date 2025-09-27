# Phase 3: Health Metrics User Stories
## Epic 3: Date Navigation & Epic 4: Additional Health Metrics

---

## Epic 3: Date Navigation

### Story 3.1: Calendar Date Picker
**As a user, I want to view my food tracking data for different dates so that I can see my historical nutrition patterns.**

**Acceptance Criteria:**
- Calendar picker accessible from top-right date display
- Month/year navigation arrows
- Current date highlighted
- Selected date updates all dashboard data
- Seamless data loading from Firebase
- Empty states for dates with no data

**UI Reference:** calender.jpeg

**Technical Requirements:**
- Date range validation (prevent future dates beyond today)
- Efficient data caching for recently viewed dates
- Loading states during date transitions
- Error handling for failed data fetches

---

## Epic 4: Additional Health Metrics

### Story 4.1: Weight Tracking
**As a user, I want to log my daily weight so that I can monitor my weight trends.**

**Acceptance Criteria:**
- Weight input field (numeric with decimal support)
- Unit selection (kg/lbs)
- Date association
- Weight change indicator from previous entry
- Historical weight trend view

**Technical Specifications:**
- Input validation: 20-300 kg / 44-660 lbs range
- Automatic unit conversion and storage in metric
- Trend calculation (gain/loss from previous entry)
- Data visualization for weight history

**UI Components:**
- Numeric keypad for weight entry
- Toggle for kg/lbs unit selection
- Trend indicators with arrows and colors
- Mini chart for weight progression

---

### Story 4.2: Water Intake Tracking
**As a user, I want to track my daily water consumption so that I can stay hydrated.**

**Acceptance Criteria:**
- Water intake input (ml/oz/cups/glasses)
- Quick-add buttons (250ml, 500ml, 1L)
- Daily goal progress indicator
- Visual water fill animation
- Intake history per day

**Interaction Design:**
- Quick-add buttons for common serving sizes
- Custom amount input option
- Visual water bottle/glass fill animation
- Progress ring showing daily goal completion

**Technical Implementation:**
- Unit conversion to ml for storage
- Animated progress updates
- Goal tracking with notifications (future)
- Daily reset at midnight

---

### Story 4.3: Steps Tracking
**As a user, I want to record my daily steps so that I can monitor my activity level.**

**Acceptance Criteria:**
- Manual steps input field
- Daily steps goal comparison
- Progress circular indicator
- Step count history
- **Future**: Integration with device pedometer

**UI Components:**
- Large circular progress indicator
- Steps input with numeric keypad
- Goal vs. actual comparison
- Historical steps data view

**Future Enhancements:**
- HealthKit (iOS) / Google Fit (Android) integration
- Automatic step counting
- Step challenges and achievements

---

### Story 4.4: Workout Tracking
**As a user, I want to log my workouts and calories burned so that I can track my exercise.**

**Acceptance Criteria:**
- Workout type selection (cardio, strength, sports, etc.)
- Duration input (minutes)
- Calories burned input/calculation
- Exercise name/description field
- Workout session summary
- Total daily calories burned calculation

**Workout Types:**
- Cardio (running, cycling, swimming)
- Strength (weightlifting, resistance)
- Sports (tennis, basketball, football)
- Flexibility (yoga, stretching)
- Other (custom activity)

**Calorie Estimation (Phase 3):**
```javascript
// Rough estimation formulas for Phase 3
const calorieRates = {
  cardio: { low: 8, high: 15 }, // per minute
  strength: { low: 5, high: 10 },
  sports: { low: 6, high: 12 },
  flexibility: { low: 2, high: 4 },
  other: { low: 4, high: 8 }
};
```

**Data Fields:**
- Exercise type (dropdown)
- Exercise name (text input)
- Duration (minutes, numeric)
- Intensity level (low, medium, high)
- Calories burned (calculated or manual input)
- Notes (optional text field)

---

## Cross-Epic Requirements

### Data Synchronization
- All health metrics sync to Firebase in real-time
- Offline mode support with queued updates
- Conflict resolution for simultaneous edits
- Data backup and restoration capabilities

### Performance Requirements
- Health metric entry response time: <100ms
- Date switching with full data load: <200ms
- Smooth animations for progress indicators
- Efficient memory usage for historical data

### Accessibility Requirements
- Screen reader support for all input fields
- High contrast mode for progress indicators
- Keyboard navigation support
- Voice input for workout descriptions

---

**Integration Points:**
- Calendar component integration
- Firebase Firestore collections for each metric type
- Zustand state management for real-time updates
- React Native Reanimated for smooth animations