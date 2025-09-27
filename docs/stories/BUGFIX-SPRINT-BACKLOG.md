# Bug Fix Sprint Backlog - Issues from 27 Sep 2025

## Overview

This backlog contains 6 user stories created from the bug reports identified during testing on September 27, 2025. All stories are focused on Dashboard home screen issues and are ready for development pickup.

## Stories Summary

| Story ID | Title | Priority | Complexity | Dependencies |
|----------|-------|----------|------------|--------------|
| BF-1 | Fix Macronutrient Display to Show Real Data | HIGH | Medium | Food tracking data, Nutrition calculation engine |
| BF-2 | Remove Auto-Track Calories Feature | MEDIUM | Low | Dashboard UI components |
| BF-3 | Fix Dashboard + Icon Navigation | HIGH | Low | React Navigation, Food tracking screen |
| BF-4 | Display Real Health Data Instead of Random Numbers | HIGH | High | HealthService, Firebase integration |
| BF-5 | Remove Action Icons from Health Metrics | LOW | Low | Dashboard UI components |
| BF-6 | Display User Profile Picture from Google Account | MEDIUM | Medium | Authentication service, Google API |

## Recommended Development Order

### Sprint 1 (High Priority - Core Functionality)
1. **BF-3**: Fix Dashboard + Icon Navigation *(Quick win, unblocks primary user flow)*
2. **BF-1**: Fix Macronutrient Display to Show Real Data *(Core nutrition tracking)*
3. **BF-4**: Display Real Health Data Instead of Random Numbers *(Core health tracking)*

### Sprint 2 (Medium Priority - UX Improvements)
4. **BF-2**: Remove Auto-Track Calories Feature *(Scope cleanup)*
5. **BF-6**: Display User Profile Picture from Google Account *(User experience)*

### Sprint 3 (Low Priority - Polish)
6. **BF-5**: Remove Action Icons from Health Metrics *(UI polish)*

## Technical Notes

### Cross-Story Dependencies
- **BF-1** and **BF-4** both involve dashboard data fetching optimization opportunities
- **BF-2** and **BF-5** both involve UI element removal and should be coordinated for consistent design
- All stories touch the Dashboard screen - coordinate UI changes to avoid conflicts

### Testing Strategy
- Each story includes specific acceptance criteria and testing requirements
- Integration testing should verify no regressions in existing health tracking workflows
- Performance testing recommended for data fetching stories (BF-1, BF-4)

### Risk Mitigation
- All stories are low-risk brownfield changes with clear rollback paths
- Existing functionality preservation is prioritized in all acceptance criteria
- Proper caching strategies recommended for performance-sensitive changes

## Story Locations

All stories are located in `docs/stories/` with the naming pattern:
- `bugfix-story-bf{N}-{short-description}.md`

## Ready for Development

✅ All stories include:
- Clear user value proposition
- Detailed acceptance criteria
- Technical implementation notes
- Risk assessment and rollback plan
- Definition of done checklist

The dev agent can pick up any story and have sufficient detail to implement successfully.