import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout, restoreToken } from '../../redux/authSlice';
import { useNavigation } from '@react-navigation/native';
import api from '../../configs/axios';

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { user, role, token } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data && response.data.user) {
        dispatch(restoreToken({
          token,
          role,
          user: response.data.user
        }));
      }
    } catch (error) {
      console.log('Fetch profile error:', error);
    }
  };

  const handleSwitchRole = async () => {
    try {
      setLoading(true);
      const response = await api.put('/auth/switch-role');
      const newRole = response.data.role;
      dispatch(restoreToken({
        token,
        role: newRole,
        user
      }));
      Alert.alert('Thành công', `Đã chuyển sang vai trò ${newRole}`);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chuyển đổi vai trò. Bạn đã được duyệt eKYC chưa?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white p-4">
      <View className="items-center mt-8 mb-8">
        <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center mb-4">
          <Text className="text-3xl font-bold text-blue-600">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <Text className="text-2xl font-bold text-gray-800">{user?.name || 'Người dùng'}</Text>
        <Text className="text-gray-500 mt-1">{user?.email}</Text>
        <View className="mt-2 bg-blue-100 px-3 py-1 rounded-full">
          <Text className="text-blue-800 font-semibold uppercase text-xs">{role}</Text>
        </View>
      </View>

      <View className="space-y-3">
        <TouchableOpacity 
          className="bg-blue-600 p-4 rounded-xl flex-row justify-center items-center mb-4 shadow-sm"
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text className="text-white font-bold text-lg">Chỉnh sửa hồ sơ</Text>
        </TouchableOpacity>

        {role === 'renter' && (
          <TouchableOpacity 
            className="bg-blue-50 p-4 rounded-xl flex-row justify-between items-center mb-3"
            onPress={handleSwitchRole}
            disabled={loading}
          >
            <View className="flex-row items-center">
              <Text className="text-blue-700 font-bold mr-2">Chuyển sang Người cho thuê (Lender)</Text>
              {loading && <ActivityIndicator size="small" color="#1d4ed8" />}
            </View>
            <Text className="text-blue-400">></Text>
          </TouchableOpacity>
        )}

        {role === 'lender' && (
          <TouchableOpacity 
            className="bg-gray-100 p-4 rounded-xl flex-row justify-between items-center mb-3"
            onPress={handleSwitchRole}
            disabled={loading}
          >
            <View className="flex-row items-center">
              <Text className="text-gray-700 font-bold mr-2">Về chế độ Người Thuê (Renter)</Text>
              {loading && <ActivityIndicator size="small" color="#4b5563" />}
            </View>
            <Text className="text-gray-400">></Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          className="bg-gray-50 p-4 rounded-xl flex-row justify-between items-center"
          onPress={() => navigation.navigate(role === 'renter' ? 'LenderOnboarding' : 'RenterOnboarding')}
        >
          <Text className="text-gray-700 font-medium">Xác thực tài khoản (eKYC)</Text>
          <Text className="text-gray-400">></Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-gray-50 p-4 rounded-xl flex-row justify-between items-center"
          onPress={() => navigation.navigate('ChatList')}
        >
          <Text className="text-gray-700 font-medium">Tin nhắn của tôi</Text>
          <Text className="text-gray-400">></Text>
        </TouchableOpacity>

        <TouchableOpacity className="bg-gray-50 p-4 rounded-xl flex-row justify-between items-center">
          <Text className="text-gray-700 font-medium">Đổi mật khẩu</Text>
          <Text className="text-gray-400">></Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-red-50 p-4 rounded-xl flex-row justify-between items-center mt-4"
          onPress={() => dispatch(logout())}
        >
          <Text className="text-red-600 font-bold">Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
