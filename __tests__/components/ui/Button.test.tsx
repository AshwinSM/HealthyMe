import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../../src/components/ui/Button';

describe('Button', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(
      <Button title="Test Button" testID="test-button" />
    );

    expect(getByText('Test Button')).toBeTruthy();
  });

  it('handles press events', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button title="Press Me" onPress={onPress} testID="test-button" />
    );

    fireEvent.press(getByTestId('test-button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('applies primary variant styling by default', () => {
    const { getByTestId } = render(
      <Button title="Primary Button" testID="test-button" />
    );

    const button = getByTestId('test-button');
    expect(button.props.style).toContainEqual(
      expect.objectContaining({
        backgroundColor: '#10B981',
      })
    );
  });

  it('applies secondary variant styling', () => {
    const { getByTestId } = render(
      <Button title="Secondary Button" variant="secondary" testID="test-button" />
    );

    const button = getByTestId('test-button');
    expect(button.props.style).toContainEqual(
      expect.objectContaining({
        backgroundColor: '#6366F1',
      })
    );
  });

  it('shows loading state', () => {
    const { getByText } = render(
      <Button title="Submit" loading={true} testID="test-button" />
    );

    expect(getByText('Loading...')).toBeTruthy();
  });

  it('disables button when loading', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button title="Submit" loading={true} onPress={onPress} testID="test-button" />
    );

    fireEvent.press(getByTestId('test-button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('disables button when disabled prop is true', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button title="Submit" disabled={true} onPress={onPress} testID="test-button" />
    );

    fireEvent.press(getByTestId('test-button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('applies different sizes correctly', () => {
    const { getByTestId: getSmall } = render(
      <Button title="Small" size="small" testID="small-button" />
    );
    const { getByTestId: getLarge } = render(
      <Button title="Large" size="large" testID="large-button" />
    );

    const smallButton = getSmall('small-button');
    const largeButton = getLarge('large-button');

    expect(smallButton.props.style).toContainEqual(
      expect.objectContaining({
        minHeight: 36,
      })
    );
    expect(largeButton.props.style).toContainEqual(
      expect.objectContaining({
        minHeight: 52,
      })
    );
  });
});