# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Mobile Health Dashboard** application - a React Native mobile app built with Expo that provides users with a clean, modern interface for tracking health metrics. The current phase focuses on establishing strong UI/UX foundations with a login flow and dashboard displaying health metrics.

**Key Characteristics:**
- Client-side only application (no backend integration in current phase)
- Built with React Native + Expo managed workflow
- TypeScript for type safety
- Modern mobile health and wellness aesthetic
- Focus on accessibility and responsive design

## Architecture

### Tech Stack (Planned)
- **Framework**: React Native 0.73.2 with Expo SDK 50+
- **Language**: TypeScript
- **Navigation**: React Navigation 6
- **State Management**: Zustand
- **Styling**: NativeWind (Tailwind for React Native)
- **Component Library**: Tamagui with shadcn-compatible components
- **Icons**: Lucide React Native
- **Animations**: React Native Reanimated
- **Forms**: React Hook Form
- **Testing**: Jest + React Native Testing Library

### Project Structure (Planned)
```
src/
├── components/
│   ├── ui/           # Base UI components (Button, Input, Card)
│   ├── forms/        # Form-specific components (LoginForm)
│   ├── cards/        # Dashboard cards (MetricCard, CaloriesCard, etc.)
│   └── layout/       # Layout components
├── screens/          # Screen components (LoginScreen, DashboardScreen)
├── navigation/       # Navigation configuration and types
├── stores/           # Zustand state management
├── hooks/            # Custom React hooks
├── utils/            # Utility functions and theme configuration
├── types/            # TypeScript type definitions
└── assets/           # Static assets
```

## Development Commands

**Note**: This project is currently in planning/documentation phase. No package.json or development setup exists yet. When implemented, the following commands are expected:

```bash
# Development
npm start              # Start Expo development server
npm run ios           # Run on iOS simulator  
npm run android       # Run on Android emulator
npm run web           # Run on web (testing only)

# Testing
npm test              # Run Jest tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report

# Code Quality  
npm run lint          # Run ESLint
npm run type-check    # Run TypeScript checking

# Building
eas build --profile development    # Development build
eas build --profile production     # Production build
```

## Key Features & Screens

### Current Scope
1. **Login Screen**: Clean, centered form with email/username and password inputs, login button that navigates to dashboard without validation
2. **Dashboard Screen**: Grid-based layout with health metric cards showing static data:
   - Calories consumed card (e.g., "1,200 kcal")
   - Workout duration card (e.g., "45 mins") 
   - Water intake card (e.g., "2.5 L")

### Design System
- **Colors**: Primary (#10B981), Secondary (#6366F1), Accent (#F59E0B)
- **Typography**: Inter font family with consistent scale
- **Spacing**: 8px base unit grid system
- **Components**: shadcn-compatible components with mobile optimizations
- **Icons**: Lucide icon system with health-focused additions

## Development Guidelines

### Component Standards
- Use TypeScript interfaces for all props
- Follow PascalCase naming for components
- Include testID props for testing
- Use NativeWind classes exclusively (no inline styles)
- Implement React.memo for performance where appropriate

### State Management
- Use Zustand stores for global state
- React state for component-local state
- Store structure: authStore, metricsStore, themeStore

### Testing Requirements
- Every component must have corresponding test file
- Minimum 70% code coverage
- Use React Native Testing Library
- Include accessibility testing

### Performance Goals
- Dashboard loads within 100ms of navigation
- Maintain 60fps during animations and interactions
- Touch feedback within 16ms (1 frame)

## Accessibility Requirements
- WCAG 2.1 AA compliance
- Color contrast ratios: 4.5:1 minimum for normal text
- Touch targets: Minimum 44px x 44px
- Screen reader support with proper ARIA labels
- Keyboard navigation support

## Important Files & Documentation

### Key Documentation Files
- `docs/mobile_health_prd.md`: Complete product requirements and user stories
- `docs/mobile_health_architecture.md`: Detailed technical architecture and implementation specifications
- `docs/mobile_health_ux_spec.md`: Comprehensive UI/UX specifications with design system details

### Project Status
**Current Phase**: Planning and documentation complete
**Next Phase**: Project initialization and component implementation
**Implementation Approach**: Start with Expo managed workflow using `npx create-expo-app@latest HealthDashboard --template blank-typescript`

## Implementation Notes

When beginning development:
1. Initialize project with Expo CLI and TypeScript template
2. Set up recommended dependencies (React Navigation, Zustand, NativeWind, etc.)
3. Implement component structure following architecture document specifications
4. Start with Login screen implementation, then Dashboard
5. Ensure responsive design works across mobile screen sizes (320px - 1024px+)
6. Implement proper TypeScript types throughout
7. Add comprehensive testing for components and user flows

The application should feel premium and trustworthy, suitable for daily health tracking habits, with smooth animations and contemporary mobile design patterns.

## BMAD Agent System

This project uses the **BMAD™ Core** agent system. You can switch between specialized agents using these commands:

### Agent Switch Commands
| Command | Agent ID | Name | Role | Icon |
|---------|----------|------|------|------|
| `/dev` | dev | James | Full Stack Developer | 💻 |
| `/po` | po | Sarah | Product Owner | 📝 |
| `/pm` | pm | John | Product Manager | 📋 |
| `/qa` | qa | Quinn | Test Architect & Quality Advisor | 🧪 |
| `/architect` | architect | Winston | System Architect | 🏗️ |
| `/ux` | ux-expert | Sally | UX Expert | 🎨 |
| `/sm` | sm | Bob | Scrum Master | 🏃 |

### Agent Activation Process
**CRITICAL**: Claude Code must automatically recognize and respond to agent switch commands. When user types any of the agent commands (e.g., `/dev`, `/po`, `/pm`, `/qa`, `/architect`, `/ux`, `/sm`):

1. **Immediately recognize** the command as an agent switch request
2. Read the corresponding agent file from `.bmad-core/agents/{agent-id}.md`
3. Follow the activation-instructions in the YAML block
4. Adopt the specified persona and capabilities
5. Load `.bmad-core/core-config.yaml` before greeting
6. Greet user with agent name/role and run `*help` command
7. Stay in character until told to exit

**Important**: These are NOT Claude Code slash commands but BMAD agent activation triggers that Claude must respond to automatically without requiring explanation.

### Agent Capabilities
- **James (Dev)**: Code implementation, debugging, refactoring (`*develop-story`, `*run-tests`, `*explain`)
- **Sarah (PO)**: Backlog management, story refinement (`*create-story`, `*validate-story-draft`)
- **John (PM)**: PRDs, product strategy (`*create-prd`, `*create-brownfield-prd`)
- **Quinn (QA)**: Test architecture, quality gates (`*review`, `*gate`, `*test-design`)
- **Winston (Architect)**: System design, architecture docs (`*create-backend-architecture`, `*research`)
- **Sally (UX)**: UI/UX design, wireframes (`*create-front-end-spec`, `*generate-ui-prompt`)
- **Bob (SM)**: Story creation, agile process (`*draft`, `*story-checklist`)

All agent commands use `*` prefix (e.g., `*help`, `*create-prd`). Each agent has specialized templates and workflows in `.bmad-core/` directory.