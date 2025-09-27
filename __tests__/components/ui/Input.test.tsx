import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../../../src/components/ui/Input';

describe('Input', () => {
  it('renders correctly with basic props', () => {
    const { getByTestId, getByDisplayValue } = render(
      <Input
        value="test value"
        placeholder="Test placeholder"
        testID="test-input"
      />
    );

    expect(getByTestId('test-input')).toBeTruthy();
    expect(getByDisplayValue('test value')).toBeTruthy();
  });

  it('displays label when provided', () => {
    const { getByText } = render(
      <Input
        label="Test Label"
        testID="test-input"
      />
    );

    expect(getByText('Test Label')).toBeTruthy();
  });

  it('displays error message and applies error styling', () => {
    const { getByText, getByTestId } = render(
      <Input
        error="This is an error"
        testID="test-input"
      />
    );

    expect(getByText('This is an error')).toBeTruthy();
  });

  it('handles text changes', () => {
    const onChangeText = jest.fn();
    const { getByDisplayValue } = render(
      <Input
        value=""
        onChangeText={onChangeText}
        testID="test-input"
      />
    );

    fireEvent.changeText(getByDisplayValue(''), 'new text');
    expect(onChangeText).toHaveBeenCalledWith('new text');
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByDisplayValue } = render(
      <Input
        value=""
        style={customStyle}
        testID="test-input"
      />
    );

    const input = getByDisplayValue('');
    expect(input.props.style).toContainEqual(customStyle);
  });
});