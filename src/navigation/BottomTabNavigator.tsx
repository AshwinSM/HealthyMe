import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { 
  Home, 
  Calendar, 
  Plus, 
  Brain, 
  ShoppingBag 
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

// Import screens
import { DashboardScreen } from '../screens/DashboardScreen';

// Placeholder screens
import { PlansScreen } from '../screens/PlansScreen';
import { AIRiqScreen } from '../screens/AIRiqScreen';
import { StoreScreen } from '../screens/StoreScreen';

// Import modal
import { TrackingSelectionModal, TrackingCategory } from '../components/modals';

// Types
export type BottomTabParamList = {
  Home: undefined;
  Plans: undefined;
  Add: undefined;
  AIRiq: undefined;
  Store: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

// Custom Tab Bar Button for the center "+" button
interface CustomTabButtonProps {
  onPress: () => void;
}

const CustomAddButton: React.FC<CustomTabButtonProps> = ({ onPress }) => (
  <TouchableOpacity
    style={styles.addButton}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Plus size={24} color="#FFFFFF" />
  </TouchableOpacity>
);

type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const BottomTabNavigator: React.FC = () => {
  const navigation = useNavigation<RootNavigationProp>();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleAddPress = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleSelectCategory = (category: TrackingCategory) => {
    console.log(`Selected tracking category: ${category}`);
    setIsModalVisible(false);
    
    // Navigate to specific tracking screens
    switch (category) {
      case 'food':
        navigation.navigate('FoodTracking');
        break;
      case 'workout':
      case 'weight':
      case 'water':
      case 'steps':
      case 'sleep':
        // TODO: Implement other tracking screens in future stories
        console.log(`${category} tracking not yet implemented`);
        break;
      default:
        break;
    }
  };

  return (
    <>
      <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#2DD4BF',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;
          
          switch (route.name) {
            case 'Home':
              IconComponent = Home;
              break;
            case 'Plans':
              IconComponent = Calendar;
              break;
            case 'Add':
              // This will be replaced by custom button
              IconComponent = Plus;
              break;
            case 'AIRiq':
              IconComponent = Brain;
              break;
            case 'Store':
              IconComponent = ShoppingBag;
              break;
            default:
              IconComponent = Home;
          }

          return <IconComponent size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={DashboardScreen as any}
        options={{
          title: 'Home',
        }}
      />
      
      <Tab.Screen 
        name="Plans" 
        component={PlansScreen}
        options={{
          title: 'Plans',
        }}
      />
      
      <Tab.Screen
        name="Add"
        component={DashboardScreen as any} // Dummy component, won't be used
        options={{
          title: '',
          tabBarButton: () => (
            <CustomAddButton onPress={handleAddPress} />
          ),
        }}
      />
      
      <Tab.Screen 
        name="AIRiq" 
        component={AIRiqScreen}
        options={{
          title: 'AI Riq',
        }}
      />
      
      <Tab.Screen 
        name="Store" 
        component={StoreScreen}
        options={{
          title: 'Store',
        }}
      />
      </Tab.Navigator>

      {/* Tracking Selection Modal */}
      <TrackingSelectionModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        onSelectCategory={handleSelectCategory}
      />
    </>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 90,
    paddingBottom: 20,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2DD4BF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -8, // Slightly elevated above tab bar
    shadowColor: '#2DD4BF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});