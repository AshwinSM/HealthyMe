import React from 'react';
import { render } from '@testing-library/react-native';
import { RootNavigator } from '../../src/navigation/RootNavigator';

describe('RootNavigator', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<RootNavigator />);
    
    // Should render the initial Login screen
    expect(getByTestId('login-screen')).toBeTruthy();
  });

  it('starts with Login screen as initial route', () => {
    const { getByText } = render(<RootNavigator />);
    
    // Should show Login screen content
    expect(getByText('Login Screen')).toBeTruthy();
  });
});