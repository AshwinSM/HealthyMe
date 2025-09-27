# Component Standards

## Component Template

```typescript
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';
import { MetricCardProps } from '../types';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

interface Props extends MetricCardProps {
  onPress?: () => void;
  testID?: string;
}

export const MetricCard: React.FC<Props> = ({ 
  title, 
  value, 
  unit, 
  icon, 
  onPress,
  testID 
}) => {
  return (
    <StyledTouchableOpacity
      testID={testID}
      onPress={onPress}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 min-h-[120px] flex-1"
      activeOpacity={0.7}
    >
      <StyledView className="flex-row justify-between items-start mb-2">
        {icon}
        <StyledView className="flex-1 ml-3">
          <StyledText className="text-2xl font-semibold text-gray-900">
            {value}
          </StyledText>
          <StyledText className="text-sm text-gray-500 mt-1">
            {unit}
          </StyledText>
        </StyledView>
      </StyledView>
      <StyledText className="text-xs font-medium text-gray-600 uppercase tracking-wide">
        {title}
      </StyledText>
    </StyledTouchableOpacity>
  );
};

export default MetricCard;
```

## Naming Conventions
- **Components**: PascalCase (e.g., `LoginScreen`, `MetricCard`)
- **Files**: PascalCase for components, camelCase for utilities
- **Props interfaces**: `ComponentNameProps` pattern
- **Test files**: `ComponentName.test.tsx`
- **Style classes**: Tailwind utility classes with NativeWind
