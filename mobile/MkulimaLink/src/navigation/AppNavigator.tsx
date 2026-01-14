import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../stores/authStore';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main Screens
import HomeScreen from '../screens/main/HomeScreen';
import ProductsScreen from '../screens/main/ProductsScreen';
import MarketScreen from '../screens/main/MarketScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import ChatScreen from '../screens/main/ChatScreen';

// Product Screens
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import AddProductScreen from '../screens/products/AddProductScreen';

// Transaction Screens
import TransactionDetailScreen from '../screens/transactions/TransactionDetailScreen';

// Components
import TabBarIcon from '../components/TabBarIcon';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack
const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: '#ffffff' },
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

// Main Tab Navigator
const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => (
        <TabBarIcon route={route} focused={focused} color={color} size={size} />
      ),
      tabBarActiveTintColor: '#10b981',
      tabBarInactiveTintColor: '#6b7280',
      tabBarStyle: {
        backgroundColor: '#ffffff',
        borderTopColor: '#e5e7eb',
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
      headerStyle: {
        backgroundColor: '#ffffff',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
      },
      headerTintColor: '#1f2937',
      headerTitleStyle: {
        fontWeight: '600',
      },
    })}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{ title: 'Home' }}
    />
    <Tab.Screen
      name="Products"
      component={ProductsScreen}
      options={{ title: 'Products' }}
    />
    <Tab.Screen
      name="Market"
      component={MarketScreen}
      options={{ title: 'Market' }}
    />
    <Tab.Screen
      name="Chat"
      component={ChatScreen}
      options={{ title: 'Chat' }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
  </Tab.Navigator>
);

// Main Stack (includes tabs + detail screens)
const MainStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#ffffff',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
      },
      headerTintColor: '#1f2937',
      headerTitleStyle: {
        fontWeight: '600',
      },
      cardStyle: { backgroundColor: '#ffffff' },
    }}
  >
    <Stack.Screen
      name="MainTabs"
      component={MainTabNavigator}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ProductDetail"
      component={ProductDetailScreen}
      options={{ title: 'Product Details' }}
    />
    <Stack.Screen
      name="AddProduct"
      component={AddProductScreen}
      options={{ title: 'Add Product' }}
    />
    <Stack.Screen
      name="TransactionDetail"
      component={TransactionDetailScreen}
      options={{ title: 'Transaction Details' }}
    />
  </Stack.Navigator>
);

// Root Navigator
const AppNavigator: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainStack} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
