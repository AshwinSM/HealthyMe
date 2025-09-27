# Testing Requirements

## Component Test Template

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MetricCard } from '../MetricCard';

describe('MetricCard', () => {
  const mockProps = {
    title: 'Calories',
    value: '1200',
    unit: 'kcal',
    icon: <MockIcon />,
  };

  it('renders metric information correctly', () => {
    const { getByText } = render(<MetricCard {...mockProps} />);
    
    expect(getByText('1200')).toBeTruthy();
    expect(getByText('kcal')).toBeTruthy();
    expect(getByText('Calories')).toBeTruthy();
  });

  it('handles press events', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <MetricCard {...mockProps} onPress={onPressMock} testID="metric-card" />
    );
    
    fireEvent.press(getByTestId('metric-card'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('applies correct styling classes', () => {
    const { getByTestId } = render(
      <MetricCard {...mockProps} testID="metric-card" />
    );
    
    const card = getByTestId('metric-card');
    expect(card.props.className).toContain('bg-white');
    expect(card.props.className).toContain('rounded-xl');
  });
});
```

## Testing Best Practices
1. **Unit Tests**: Test individual components in isolation with mocked dependencies
2. **Integration Tests**: Test screen components with navigation and state management
3. **E2E Tests**: Use Detox for critical user flows (login → dashboard navigation)
4. **Coverage Goals**: Aim for 80% code coverage on components and utilities
5. **Test Structure**: Arrange-Act-Assert pattern with descriptive test names
6. **Mock External Dependencies**: Mock navigation, state stores, and future API calls
