import React from 'react';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface TabBarIconProps {
  route: {
    name: string;
  };
  focused: boolean;
  color: string;
  size: number;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({ route, focused, color, size }) => {
  let iconName: string;

  switch (route.name) {
    case 'Home':
      iconName = 'home';
      break;
    case 'Products':
      iconName = 'inventory';
      break;
    case 'Market':
      iconName = 'storefront';
      break;
    case 'Chat':
      iconName = 'chat';
      break;
    case 'Profile':
      iconName = 'person';
      break;
    default:
      iconName = 'circle';
  }

  return (
    <View>
      <Icon name={iconName} size={size} color={color} />
    </View>
  );
};

export default TabBarIcon;
