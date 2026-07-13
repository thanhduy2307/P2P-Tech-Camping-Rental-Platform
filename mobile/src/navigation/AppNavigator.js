import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { restoreToken } from '../redux/authSlice';
import { View, ActivityIndicator } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AssetDetailScreen from '../screens/renter/AssetDetailScreen';
import ChatListScreen from '../screens/common/ChatListScreen';
import ChatDetailScreen from '../screens/common/ChatDetailScreen';
import EditProfileScreen from '../screens/common/EditProfileScreen';
import PublicProfileScreen from '../screens/common/PublicProfileScreen';
import RenterOnboardingScreen from '../screens/common/RenterOnboardingScreen';
import LenderOnboardingScreen from '../screens/common/LenderOnboardingScreen';
import CreateAssetScreen from '../screens/lender/CreateAssetScreen';
import EditAssetScreen from '../screens/lender/EditAssetScreen';

import { 
  RenterNavigator, 
  LenderNavigator, 
  InspectorNavigator, 
  AdminNavigator 
} from './RoleNavigators';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading, role } = useSelector((state) => state.auth);

  useEffect(() => {
    const bootstrapAsync = async () => {
      let userToken;
      let userRole;
      let userData;

      try {
        userToken = await AsyncStorage.getItem('token');
        userRole = await AsyncStorage.getItem('role');
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          userData = JSON.parse(userStr);
        }
      } catch (e) {
        // Restoring token failed
      }

      dispatch(restoreToken({
        token: userToken,
        role: userRole,
        user: userData
      }));
    };

    bootstrapAsync();
  }, [dispatch]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const renderRoleNavigator = () => {
    switch (role) {
      case 'lender':
        return <Stack.Screen name="MainTabs" component={LenderNavigator} options={{ headerShown: false }} />;
      case 'inspector':
        return <Stack.Screen name="MainTabs" component={InspectorNavigator} options={{ headerShown: false }} />;
      case 'admin':
        return <Stack.Screen name="MainTabs" component={AdminNavigator} options={{ headerShown: false }} />;
      case 'renter':
      default:
        return <Stack.Screen name="MainTabs" component={RenterNavigator} options={{ headerShown: false }} />;
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isAuthenticated ? (
          // Đã đăng nhập
          <Stack.Group>
            {renderRoleNavigator()}
            {/* Global screens that can be pushed over tabs */}
            <Stack.Screen 
              name="AssetDetail" 
              component={AssetDetailScreen} 
              options={{ title: 'Chi tiết thiết bị', headerBackTitle: 'Quay lại' }} 
            />
            <Stack.Screen 
              name="ChatList" 
              component={ChatListScreen} 
              options={{ title: 'Tin nhắn', headerBackTitle: 'Quay lại' }} 
            />
            <Stack.Screen 
              name="ChatDetail" 
              component={ChatDetailScreen} 
              options={{ title: 'Trò chuyện', headerBackTitle: 'Quay lại' }} 
            />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen} 
              options={{ title: 'Chỉnh sửa hồ sơ', headerBackTitle: 'Quay lại' }} 
            />
            <Stack.Screen 
              name="PublicProfile" 
              component={PublicProfileScreen} 
              options={{ title: 'Hồ sơ người dùng', headerBackTitle: 'Quay lại' }} 
            />
            <Stack.Screen 
              name="RenterOnboarding" 
              component={RenterOnboardingScreen} 
              options={{ title: 'Định danh tài khoản', headerBackTitle: 'Quay lại' }} 
            />
            <Stack.Screen 
              name="LenderOnboarding" 
              component={LenderOnboardingScreen} 
              options={{ title: 'Đăng ký Lender', headerBackTitle: 'Quay lại' }} 
            />
            <Stack.Screen 
              name="CreateAsset" 
              component={CreateAssetScreen} 
              options={{ title: 'Thêm thiết bị', headerBackTitle: 'Quay lại' }} 
            />
            <Stack.Screen 
              name="EditAsset" 
              component={EditAssetScreen} 
              options={{ title: 'Sửa thiết bị', headerBackTitle: 'Quay lại' }} 
            />
          </Stack.Group>
        ) : (
          // Chưa đăng nhập
          <Stack.Group screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
