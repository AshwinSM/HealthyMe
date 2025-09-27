# Critical Frontend Rules

1. **Component Structure**: Always use TypeScript interfaces for props and follow PascalCase naming
2. **State Management**: Use Zustand stores for global state, React state for component-local state
3. **Styling**: Use NativeWind classes exclusively, no inline styles or StyleSheet.create
4. **Navigation**: Always type navigation props and use proper TypeScript navigation types
5. **Testing**: Every component must have corresponding test file with minimum 70% coverage
6. **Performance**: Use React.memo, useMemo, and useCallback appropriately for optimization
7. **Accessibility**: Include testID props and proper accessibility labels for all interactive elements
