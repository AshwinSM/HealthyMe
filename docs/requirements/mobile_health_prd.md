# Mobile Health Dashboard Product Requirements Document (PRD)

## Goals and Background Context

### Goals
- Create a modern, intuitive mobile application that establishes the foundation for a comprehensive health tracking platform
- Deliver a seamless user experience with contemporary UI patterns and smooth navigation
- Build a scalable frontend architecture that can accommodate future backend integration and feature expansion
- Provide users with an immediate visual representation of key health metrics through an engaging dashboard

### Background Context
The mobile health and fitness app market is highly competitive, with users expecting polished, responsive interfaces that feel native to their devices. This initial version focuses on establishing strong UI/UX foundations with a login flow and dashboard that showcases health metrics. The static implementation allows for rapid iteration on design and user experience before backend complexity is introduced.

### Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-01-24 | 1.0 | Initial PRD for mobile health dashboard | PM Agent |
| 2025-08-30 | 2.0 | Added comprehensive health tracking requirements | PM Agent |

## Requirements

### Phase 1 Functional Requirements (COMPLETED)
- **FR1**: The application displays a login screen as the initial entry point with email/username and password input fields
- **FR2**: The login screen includes a prominent login button that navigates to the dashboard without validation
- **FR3**: The dashboard displays health metric cards including calories consumed, workout duration, and water intake
- **FR4**: All health metrics show static placeholder data for UI demonstration purposes
- **FR5**: The application supports navigation between login and dashboard screens
- **FR6**: The interface adapts responsively to different mobile screen sizes and orientations

### Phase 2 Functional Requirements (NEW - UI/UX TRACKING INTERFACES)
- **FR7**: Dashboard displays enhanced tracker cards with **Food, Weight, Workout, Steps, Sleep, Water** sections
- **FR8**: **Food tracker card** shows calorie intake with detailed nutrition breakdown (Protein, Fats, Carbs, Fibre) as progress bars
- **FR9**: **"Auto Track Calories from gallery with Snap"** feature card with food image display
- **FR10**: Each tracker card displays current values with **"+" add button** and **camera/edit icons**
- **FR11**: **Bottom sheet modal** appears when adding new tracking data with category selection
- **FR12**: **"Today" dropdown** allows date selection with clean calendar interface
- **FR13**: **User profile section** displays avatar image and upgrade button
- **FR14**: **Bottom tab navigation** with Home, Plans, Add (+), AI Riq, and Store sections
- **FR15**: All UI components use **consistent teal/green branding** (#2DD4BF color scheme)
- **FR16**: **Progress tracking** shows goal completion with visual indicators (e.g., "1 kg lost", "Goal: 346 cal")
- **FR17**: Interface supports **modal overlays** for detailed tracking input and calendar selection

### Non Functional
- **NFR1**: The application loads instantly with smooth UI transitions and animations
- **NFR2**: UI animations and transitions complete within 300ms for smooth user experience
- **NFR3**: The application works consistently across iOS and Android platforms using React Native
- **NFR4**: The codebase structure supports component reusability and maintainable UI architecture
- **NFR5**: The application maintains 60fps performance during navigation and interactions
- **NFR6**: **Modal overlays and bottom sheets** animate smoothly without performance degradation
- **NFR7**: **Touch interactions** provide immediate visual feedback with proper touch targets (44px minimum)
- **NFR8**: **UI components** are accessible with proper contrast ratios and screen reader support
- **NFR9**: **Progressive bars and visual indicators** render smoothly across different screen sizes

## User Interface Design Goals

### Overall UX Vision
A clean, modern mobile interface that emphasizes clarity and ease of use while incorporating contemporary design trends. The app should feel premium and trustworthy, suitable for daily health tracking habits.

### Key Interaction Paradigms
- **Touch-first design** optimized for thumb navigation
- **Card-based information architecture** for scannable content
- **Gesture-friendly interactions** with appropriate touch targets
- **Progressive disclosure** showing relevant information at the right time

### Core Screens and Views
- **Login Screen**: Clean, centered form with branding and clear call-to-action
- **Dashboard Screen**: Grid-based layout showcasing health metrics in digestible cards

### Accessibility
**WCAG AA compliance** with proper contrast ratios, touch target sizes, and screen reader support

### Branding
Modern health and wellness aesthetic incorporating:
- **Clean typography** with strong hierarchy
- **Vibrant accent colors** for positive reinforcement
- **Subtle shadows and depth** for contemporary feel
- **Consistent spacing** using 8px grid system

### Target Device and Platforms
**Cross-platform mobile** supporting iOS and Android through React Native with Expo

## Technical Assumptions

### Repository Structure
**Monorepo** using Expo managed workflow for simplified development and testing

### Service Architecture
**Client-side only** application with no backend dependencies in this phase

### Testing Requirements
**Manual testing** using emulator and Expo Go app with focus on UI responsiveness and navigation flow

### Additional Technical Assumptions
- **React Native with Expo SDK 50+** for cross-platform development
- **TypeScript** for type safety and developer experience
- **React Navigation 6** for screen navigation and deep linking to tracking screens
- **NativeWind or Styled Components** for styling approach
- **Expo Go** for rapid testing on physical devices
- **AsyncStorage or Expo SQLite** for local data persistence of tracking metrics
- **React Hook Form** for complex tracking form management and validation
- **Date-fns or Moment.js** for date/time handling in tracking features
- **React Native Chart Kit** for historical data visualization

## Epic List

### Epic 1: Foundation Setup and Login Interface (COMPLETED)
Establish project infrastructure and create the initial login screen with navigation capabilities

### Epic 2: Dashboard Implementation and Health Metrics Display (COMPLETED) 
Build the main dashboard with health metric cards and responsive layout

### Epic 3: Enhanced Dashboard UI with Tracking Cards
Transform dashboard to match sample design with detailed tracker cards and nutrition breakdown

### Epic 4: Navigation and User Profile Interface  
Implement bottom tab navigation, user profile section, and "Today" date selector

### Epic 5: Tracking Selection and Modal Interfaces
Create bottom sheet modals for tracker selection and calendar date picker

### Epic 6: Progress Visualization and Interactive Elements
Add progress bars, goal indicators, and interactive tracking buttons

### Epic 7: Advanced UI Polish and Micro-interactions
Implement smooth animations, transitions, and professional visual feedback

## Epic 1: Foundation Setup and Login Interface

**Epic Goal**: Establish a working React Native application with professional login interface that demonstrates modern mobile UI patterns and smooth navigation to dashboard screen.

### Story 1.1: Project Setup and Navigation Infrastructure
**As a** developer,
**I want** a properly configured React Native Expo project with navigation,
**so that** I can build and test the mobile application efficiently.

#### Acceptance Criteria
1. React Native Expo project initialized with TypeScript support
2. React Navigation library configured for screen transitions
3. Development environment runs successfully on iOS simulator and Android emulator
4. Expo Go testing capability verified on physical device
5. Basic project structure established with screens folder organization

### Story 1.2: Login Screen UI Implementation
**As a** user,
**I want** a visually appealing login screen with proper form inputs,
**so that** I can access the application with a professional first impression.

#### Acceptance Criteria
1. Login screen displays centered form layout with proper spacing
2. Email/username input field with appropriate keyboard type and placeholder
3. Password input field with secure text entry and visibility toggle option
4. Login button styled with primary brand color and appropriate touch feedback
5. Logo or branding element positioned prominently above the form
6. Screen adapts properly to different mobile screen sizes and orientations

### Story 1.3: Login Navigation and Screen Transition
**As a** user,
**I want** smooth navigation from login to dashboard when tapping the login button,
**so that** I can access the main application features seamlessly.

#### Acceptance Criteria
1. Login button triggers navigation to dashboard screen without validation
2. Screen transition animation completes smoothly within 300ms
3. Navigation maintains proper stack history for potential future back navigation
4. Dashboard screen loads immediately after transition
5. No authentication logic blocks the navigation flow

## Epic 2: Dashboard Implementation and Health Metrics Display

**Epic Goal**: Create an engaging dashboard screen that displays health metrics in an organized, visually appealing card-based layout that demonstrates the application's core value proposition.

### Story 2.1: Dashboard Screen Structure and Layout
**As a** user,
**I want** a well-organized dashboard layout,
**so that** I can easily scan my health information at a glance.

#### Acceptance Criteria
1. Dashboard screen displays header with greeting or title
2. Main content area uses scrollable layout to accommodate metric cards
3. Consistent spacing and margins throughout the screen using 8px grid
4. Background and container styling matches overall app theme
5. Layout adapts responsively to different screen sizes maintaining visual hierarchy

### Story 2.2: Health Metric Cards Implementation
**As a** user,
**I want** to see my key health metrics displayed in distinct cards,
**so that** I can quickly understand my daily health status.

#### Acceptance Criteria
1. Calories consumed card displays static value (e.g., "1,200 kcal") with appropriate icon
2. Workout duration card shows static time value (e.g., "45 mins") with exercise icon  
3. Water intake card displays static volume (e.g., "2.5 L") with water drop icon
4. Each card includes metric label, value, and relevant icon for quick recognition
5. Cards use consistent styling with subtle shadows and rounded corners
6. Card content is properly aligned and uses appropriate typography hierarchy

### Story 2.3: Dashboard Polish and Interactions
**As a** user,
**I want** interactive feedback and polished animations on the dashboard,
**so that** the app feels responsive and professionally built.

#### Acceptance Criteria
1. Cards respond to touch with subtle press animations or highlight effects
2. Smooth scroll behavior implemented for dashboard content
3. Loading states or transitions appear polished and intentional
4. Color scheme uses contemporary health/wellness palette with good contrast
5. All touch targets meet minimum accessibility size requirements (44px minimum)

## Epic 3: Enhanced Dashboard UI with Tracking Cards

**Epic Goal**: Transform the existing dashboard to match the sample design with comprehensive tracking cards, nutrition breakdown, and professional visual hierarchy.

### Story 3.1: User Profile and Header Section
**As a** user,
**I want** a personalized header section with my profile and date selection,
**so that** I can easily identify my account and navigate different dates.

#### Acceptance Criteria
1. **Profile avatar** displayed in top-left corner (circular, 48px diameter)
2. **"Upgrade Now" button** styled with teal background (#2DD4BF) and crown icon
3. **"Today" dropdown selector** with arrow icon on the right side
4. Header maintains **consistent spacing** and aligns with sample design
5. **Responsive layout** adapts to different screen sizes while preserving hierarchy

### Story 3.2: Enhanced Food Tracking Card
**As a** user,
**I want** a detailed food tracking card that shows my calorie intake and nutrition breakdown,
**so that** I can monitor my dietary progress comprehensively.

#### Acceptance Criteria
1. **"Track Food"** card with fork/knife icon and calorie display ("Eat 1,700 Cal")
2. **Camera and "+" icons** positioned on the right side for quick actions
3. **"Auto Track Calories from gallery with Snap"** secondary card with food image
4. **Nutrition breakdown section** with 4 progress bars: Protein, Fats, Carbs, Fibre
5. **Progress bars** show percentage completion with subtle gray backgrounds

### Story 3.3: Comprehensive Health Tracker Cards
**As a** user,  
**I want** individual tracker cards for Weight, Workout, Steps, and Sleep,
**so that** I can view and manage all my health metrics in one place.

#### Acceptance Criteria
1. **Weight card** displays "1 kg lost" with scale icon and "+" button
2. **Workout card** shows "Goal: 346 cal" with timer icon and "+" button  
3. **Steps card** displays "Goal: 10,000 steps" with footprint icon and special teal "+" button
4. **Sleep card** shows "Goal: 7hr 30min" with moon icon and refresh icon
5. Each card uses **consistent styling** with proper spacing and icon placement

## Epic 4: Navigation and User Profile Interface

**Epic Goal**: Implement the bottom tab navigation system, user profile management, and date selection interface that matches the sample design.

### Story 4.1: Bottom Tab Navigation Implementation
**As a** user,
**I want** easy navigation between different app sections using bottom tabs,
**so that** I can quickly access all app features.

#### Acceptance Criteria
1. **5-tab navigation** with Home, Plans, Add (+), AI Riq, Store icons
2. **Center "+" button** styled with teal background and prominent positioning
3. **Active tab highlighting** with proper visual feedback
4. **Tab icons** match the sample design with appropriate spacing
5. **Smooth transitions** between tab screens without performance lag

### Story 4.2: Date Selection and Calendar Interface
**As a** user,
**I want** to select different dates to view my tracking data,
**so that** I can review my historical health information.

#### Acceptance Criteria
1. **"Today" dropdown** triggers calendar modal when tapped
2. **Calendar modal** displays full month view with navigation arrows
3. **Date highlighting** shows selected date with teal background
4. **Cancel/Done buttons** provide clear modal dismissal actions
5. **Smooth modal animation** slides up from bottom with proper backdrop

### Story 4.3: User Profile and Account Management
**As a** user,
**I want** to see my profile information and account options,
**so that** I can manage my account and access premium features.

#### Acceptance Criteria
1. **Profile avatar** displays user image or placeholder in circular frame
2. **"Upgrade Now" button** with crown icon and teal styling
3. **Profile section** maintains proper spacing and visual hierarchy
4. **Responsive design** adapts profile section across different screen sizes
5. **Touch interactions** provide appropriate feedback for profile elements

## Epic 5: Tracking Selection and Modal Interfaces

**Epic Goal**: Create intuitive bottom sheet modals and selection interfaces that allow users to choose tracking categories and input methods.

### Story 5.1: Tracking Category Selection Modal
**As a** user,
**I want** a clean modal to select which health metric I want to track,
**so that** I can quickly navigate to the appropriate tracking interface.

#### Acceptance Criteria
1. **Bottom sheet modal** with "What Would You Like to Track?" header
2. **6 tracking options**: Food, Workout, Weight, Water, Steps, Sleep
3. **Colored icons** for each category (orange food, pink workout, blue weight, etc.)
4. **Right arrow indicators** showing each option is tappable
5. **Smooth slide-up animation** with backdrop dimming

### Story 5.2: Modal Navigation and State Management
**As a** user,
**I want** seamless transitions between different modal states,
**so that** I can efficiently navigate through tracking options.

#### Acceptance Criteria
1. **Modal dismissal** via backdrop tap or swipe down gesture
2. **Proper z-index layering** for multiple modal states
3. **Navigation preservation** maintains app state during modal interactions
4. **Accessibility support** for modal focus management and screen readers
5. **Consistent modal styling** across all bottom sheet implementations

### Story 5.3: Interactive UI Elements and Feedback
**As a** user,
**I want** clear visual feedback when interacting with tracking elements,
**so that** I understand which actions are available and responsive.

#### Acceptance Criteria
1. **Hover/press states** for all interactive buttons and cards
2. **Loading states** for any UI operations or transitions  
3. **Success feedback** when actions are completed
4. **Error handling** with appropriate user messaging
5. **Consistent interaction patterns** across all tracking interfaces

## Next Steps

### Development Priority
**Phase 2 Implementation should begin with Epic 3** as it transforms the current dashboard to match the sample design. The recommended implementation order is:

1. **Epic 3** - Enhanced Dashboard UI (Foundation)
2. **Epic 4** - Navigation and Profile Interface 
3. **Epic 5** - Modal Interfaces and Selection
4. **Epic 6** - Progress Visualization (Future)
5. **Epic 7** - Advanced Polish (Future)

### Implementation Notes
- Focus purely on **UI/UX frontend** - no backend data persistence in current scope
- Use **static/mock data** to demonstrate interface functionality
- Follow **sample image designs** as exact reference for visual implementation
- Maintain **#2DD4BF teal color scheme** throughout all new components

### UX Expert Prompt
Please review this PRD and create a comprehensive UI/UX specification focusing on modern mobile design patterns. Pay special attention to contemporary health app trends, card-based layouts, and mobile-first interaction patterns. Include detailed component specifications that can guide implementation.

### Architect Prompt  
Using this PRD as input, create a frontend architecture document that defines the React Native + Expo technical stack, component organization, and project structure. Focus on scalability for future backend integration and maintainability for ongoing development.