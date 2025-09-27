# Story 4.2: Tracking Selection Modal (Bottom Sheet) ✅

**Epic**: Navigation and Modal Interfaces
**Story Points**: 8
**Priority**: High
**Status**: ✅ COMPLETED

## User Story
**As a** user wanting to log health data  
**I want** a clean selection modal for tracking categories  
**so that** I can quickly choose what metric to track

## Acceptance Criteria
- [x] Bottom sheet modal with "What Would You Like to Track?" header
- [x] 6 tracking options: Food, Workout, Weight, Water, Steps, Sleep
- [x] Category-specific colored icons (orange food, pink workout, etc.)
- [x] Right arrow indicators showing tappable options
- [x] Smooth slide-up animation with backdrop dimming
- [x] Dismiss via backdrop tap or swipe down gesture
- [x] Modal z-index layering prevents UI conflicts

## Technical Requirements
**Modal Library**: React Native Modal or React Native Bottom Sheet
**Component**: `src/components/modals/TrackingSelectionModal.tsx`
**Trigger**: Bottom tab "+" button press

### Tracking Categories:
1. **Food** - Orange (#F97316) - Utensils icon
2. **Workout** - Pink (#EC4899) - Dumbbell icon
3. **Weight** - Indigo (#6366F1) - Scale icon
4. **Water** - Cyan (#06B6D4) - Droplet icon
5. **Steps** - Green (#10B981) - Footprints icon
6. **Sleep** - Purple (#8B5CF6) - Moon icon

## Design Specifications
**Modal Container:**
- Background: #FFFFFF
- Border radius: 24px (top corners only)
- Max height: 60% of screen
- Backdrop: rgba(0,0,0,0.4)

**Header:**
- Title: "What Would You Like to Track?"
- Font: 20px, Semi-bold (#111827)
- Padding: 24px horizontal, 20px vertical
- Optional drag handle (gray pill)

**Option Items:**
- Height: 64px each
- Padding: 16px horizontal
- Divider lines between options
- Touch feedback: Light gray background on press

**Icon Styling:**
- Size: 32px
- Background circle: 48px diameter
- Background colors match category branding
- White icons on colored backgrounds

## Component Interface
```typescript
interface TrackingSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCategory: (category: TrackingCategory) => void;
}

type TrackingCategory = 'food' | 'workout' | 'weight' | 'water' | 'steps' | 'sleep';
```

## Animation Specifications
**Show Animation:**
- Slide up from bottom (300ms)
- Backdrop fade in (200ms)
- Ease-out timing function

**Hide Animation:**
- Slide down to bottom (250ms)
- Backdrop fade out (200ms)
- Ease-in timing function

**Gesture Support:**
- Swipe down to dismiss
- Backdrop tap to dismiss
- Smooth gesture following

## Interaction Flow
1. User taps "+" in bottom navigation
2. Modal slides up from bottom
3. Backdrop dims current screen
4. User sees 6 tracking options
5. User taps desired category OR dismisses modal
6. Modal slides down and closes
7. If category selected → navigate to tracking screen (future)

## Accessibility Requirements
- Modal announces when opened/closed
- Each option has proper accessibility label
- Keyboard navigation support (future)
- Focus management when modal opens
- Escape key closes modal (web/desktop)

## Testing Scenarios
- Modal opens when "+" button pressed
- All 6 categories display with correct icons/colors
- Backdrop tap dismisses modal
- Swipe down gesture dismisses modal
- No memory leaks on repeated open/close
- Smooth animations at 60fps
- Works across different screen sizes

## Implementation Notes
- Use React Native Modal with animated backdrop
- Implement gesture responder for swipe down
- Consider using Reanimated for smooth animations
- Handle safe area insets properly
- Prevent scroll behind modal when open

## Definition of Done
- [x] Bottom sheet modal component created
- [x] All 6 tracking categories implemented
- [x] Category-specific colors and icons applied
- [x] Smooth slide animations working
- [x] Backdrop dimming implemented
- [x] Gesture dismissal (swipe down) working
- [x] Backdrop tap dismissal working
- [x] Accessibility labels implemented
- [x] Z-index layering correct
- [x] No UI conflicts or layout issues
- [x] TypeScript interfaces defined
- [x] Integration with "+" button complete

**Priority**: High - Key interaction pattern
**Dependencies**: Story 4.1 (Bottom Tab Navigation)
**Estimated Time**: 2-3 days