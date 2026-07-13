import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Import Renter Screens
import RenterHomeScreen from '../screens/renter/RenterHomeScreen';
import RenterOrdersScreen from '../screens/renter/RenterOrdersScreen';

// Import Lender Screens
import LenderDashboardScreen from '../screens/lender/LenderDashboardScreen';
import MyAssetsScreen from '../screens/lender/MyAssetsScreen';
import LenderOrdersScreen from '../screens/lender/LenderOrdersScreen';
import LenderWalletScreen from '../screens/lender/LenderWalletScreen';

// Import Inspector & Admin Screens
import InspectorDashboard from '../screens/inspector/InspectorDashboard';
import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminEkycScreen from '../screens/admin/AdminEkycScreen';
import AdminRenterEkycScreen from '../screens/admin/AdminRenterEkycScreen';
import AdminWithdrawalsScreen from '../screens/admin/AdminWithdrawalsScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminAssetsScreen from '../screens/admin/AdminAssetsScreen';

// Import Common
import ProfileScreen from '../screens/common/ProfileScreen';

const Tab = createBottomTabNavigator();

export function RenterNavigator() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#2563eb' }}>
      <Tab.Screen name="RenterHome" component={RenterHomeScreen} options={{ title: 'Trang chủ', tabBarLabel: 'Khám phá' }} />
      <Tab.Screen name="RenterOrders" component={RenterOrdersScreen} options={{ title: 'Đơn thuê', tabBarLabel: 'Đơn của tôi' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Cá nhân', tabBarLabel: 'Cá nhân' }} />
    </Tab.Navigator>
  );
}

export function LenderNavigator() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#16a34a' }}>
      <Tab.Screen name="LenderDashboard" component={LenderDashboardScreen} options={{ title: 'Tổng quan' }} />
      <Tab.Screen name="MyAssets" component={MyAssetsScreen} options={{ title: 'Thiết bị' }} />
      <Tab.Screen name="LenderOrders" component={LenderOrdersScreen} options={{ title: 'Đơn hàng' }} />
      <Tab.Screen name="LenderWallet" component={LenderWalletScreen} options={{ title: 'Ví tiền' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Cá nhân' }} />
    </Tab.Navigator>
  );
}

export function InspectorNavigator() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#d97706' }}>
      <Tab.Screen name="InspectorDashboard" component={InspectorDashboard} options={{ title: 'Kiểm định' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Cá nhân' }} />
    </Tab.Navigator>
  );
}

export function AdminNavigator() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#9333ea' }}>
      <Tab.Screen name="AdminDashboard" component={AdminDashboard} options={{ title: 'Thống kê' }} />
      <Tab.Screen name="AdminOrders" component={AdminOrdersScreen} options={{ title: 'Đơn hàng' }} />
      <Tab.Screen name="AdminAssets" component={AdminAssetsScreen} options={{ title: 'Thiết bị' }} />
      <Tab.Screen name="AdminWithdrawals" component={AdminWithdrawalsScreen} options={{ title: 'Rút tiền' }} />
      <Tab.Screen name="AdminUsers" component={AdminUsersScreen} options={{ title: 'Users' }} />
      <Tab.Screen name="AdminEkyc" component={AdminEkycScreen} options={{ title: 'Lender' }} />
      <Tab.Screen name="AdminRenterEkyc" component={AdminRenterEkycScreen} options={{ title: 'Renter' }} />
    </Tab.Navigator>
  );
}
