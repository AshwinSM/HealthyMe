import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import { ChevronDown, Crown, User, LogOut } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import { DateSelectionModal, LogoutConfirmationModal } from '../modals';
import { useDateContext } from '../../contexts/DateContext';
import { useAuthStore } from '../../stores';

interface ProfileHeaderProps {
  userName?: string;
  avatarUri?: string;
  onUpgradePress?: () => void;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userName = 'User',
  avatarUri,
  onUpgradePress,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const { selectedDate, setSelectedDate, formatDisplayDate } = useDateContext();
  const { initiateLogout, confirmLogout, cancelLogout, confirmationRequired } = useAuthStore();

  const handleDatePress = () => {
    setIsDateModalVisible(true);
  };

  const handleDateModalClose = () => {
    setIsDateModalVisible(false);
  };

  const handleDateSelect = (date: Date) => {
    // This is called during selection but not confirmed yet
  };

  const handleDateConfirm = (date: Date) => {
    setSelectedDate(date);
    setIsDateModalVisible(false);
  };

  const handleAvatarPress = () => {
    setIsProfileMenuVisible(true);
  };

  const handleProfileMenuClose = () => {
    setIsProfileMenuVisible(false);
  };

  const handleProfilePress = () => {
    setIsProfileMenuVisible(false);
    navigation.navigate('Profile');
  };

  const handleDirectLogout = () => {
    setIsProfileMenuVisible(false);
    initiateLogout();
  };

  const handleConfirmLogout = () => {
    confirmLogout();
  };

  const handleCancelLogout = () => {
    cancelLogout();
  };
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {/* Profile Avatar */}
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={handleAvatarPress}
          activeOpacity={0.7}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.defaultAvatar}>
              <Text style={styles.avatarText}>
                {(userName && userName.length > 0 ? userName.charAt(0) : 'U').toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        {/* Upgrade Button */}
        <TouchableOpacity 
          style={styles.upgradeButton} 
          onPress={onUpgradePress}
          activeOpacity={0.8}
        >
          <Crown size={16} color="#FFFFFF" style={styles.crownIcon} />
          <Text style={styles.upgradeText}>Upgrade Now</Text>
        </TouchableOpacity>
      </View>

      {/* Date Selector */}
      <TouchableOpacity 
        style={styles.dateSelector} 
        onPress={handleDatePress}
        activeOpacity={0.7}
      >
        <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
        <ChevronDown size={20} color="#374151" />
      </TouchableOpacity>

      {/* Date Selection Modal */}
      <DateSelectionModal
        visible={isDateModalVisible}
        selectedDate={selectedDate}
        onClose={handleDateModalClose}
        onDateSelect={handleDateSelect}
        onConfirm={handleDateConfirm}
      />

      {/* Profile Menu Modal */}
      <Modal
        visible={isProfileMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleProfileMenuClose}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleProfileMenuClose}
        >
          <View style={styles.profileMenuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleProfilePress}
              activeOpacity={0.7}
            >
              <User size={20} color="#374151" />
              <Text style={styles.menuItemText}>Profile</Text>
            </TouchableOpacity>
            
            <View style={styles.menuSeparator} />
            
            <TouchableOpacity
              style={[styles.menuItem, styles.logoutMenuItem]}
              onPress={handleDirectLogout}
              activeOpacity={0.7}
            >
              <LogOut size={20} color="#EF4444" />
              <Text style={styles.logoutMenuItemText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        visible={confirmationRequired}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
  },
  defaultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6B7280',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2DD4BF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 48,
    borderRadius: 25,
    shadowColor: '#2DD4BF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  crownIcon: {
    marginRight: 6,
  },
  upgradeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    minHeight: 48,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  profileMenuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 80, // Position below header
    marginLeft: 24, // Align with avatar position
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 12,
  },
  logoutMenuItem: {
    // No additional styling needed, inherits from menuItem
  },
  logoutMenuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
    marginLeft: 12,
  },
  menuSeparator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
});