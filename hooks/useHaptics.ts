import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const useHaptics = () => {
  const impactAsync = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    if (Platform.OS === 'ios') {
      setTimeout(() => Haptics.impactAsync(style), 0);
    } else {
      Haptics.impactAsync(style);
    }
  };

  const selectionAsync = () => {
    if (Platform.OS === 'ios') {
      setTimeout(() => Haptics.selectionAsync(), 0);
    } else {
      Haptics.selectionAsync();
    }
  };

  const notificationAsync = (type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) => {
    if (Platform.OS === 'ios') {
      setTimeout(() => Haptics.notificationAsync(type), 0);
    } else {
      Haptics.notificationAsync(type);
    }
  };

  return {
    impactAsync,
    selectionAsync,
    notificationAsync,
  };
}; 