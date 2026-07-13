import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../redux/authSlice';
import api from '../configs/axios';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Hỗ trợ lắng nghe redirect URL từ WebBrowser
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { token, user } = response.data;
      dispatch(setCredentials({ token, user, role: user.role }));
      
    } catch (error) {
      Alert.alert('Đăng nhập thất bại', error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // Gọi backend auth route. Bạn cần chỉnh sửa redirect URI ở backend để trả token về Expo app (vd: exp://...)
      const returnUrl = Linking.createURL('google-auth');
      const result = await WebBrowser.openAuthSessionAsync(
        `${process.env.EXPO_PUBLIC_API_URL}/auth/google?redirect=${returnUrl}`,
        returnUrl
      );
      
      if (result.type === 'success' && result.url) {
        // Parse token từ URL (ví dụ: exp://.../?token=xyz)
        const parsedUrl = Linking.parse(result.url);
        if (parsedUrl.queryParams?.token) {
          // Lấy profile user qua token này
          const token = parsedUrl.queryParams.token;
          const userRes = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
          dispatch(setCredentials({ token, user: userRes.data.user, role: userRes.data.user.role }));
        }
      }
    } catch (err) {
      console.log('Google login error', err);
    }
  };

  return (
    <View className="flex-1 bg-white justify-center px-8">
      <View className="mb-10 items-center">
        <Text className="text-4xl font-bold text-blue-600 mb-2">Camping P2P</Text>
        <Text className="text-gray-500 text-lg">Cho thuê thiết bị dã ngoại</Text>
      </View>

      <View className="space-y-4">
        <TextInput
          className="bg-gray-100 p-4 rounded-xl text-gray-800 text-base border border-gray-200"
          placeholder="Email hoặc Số điện thoại"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          className="bg-gray-100 p-4 rounded-xl text-gray-800 text-base border border-gray-200"
          placeholder="Mật khẩu"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        
        <TouchableOpacity 
          className="bg-blue-600 p-4 rounded-xl items-center mt-4 flex-row justify-center"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-bold text-lg">Đăng nhập</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-red-50 p-4 rounded-xl items-center mt-2 border border-red-200"
          onPress={handleGoogleLogin}
        >
          <Text className="text-red-600 font-bold text-lg">Đăng nhập với Google</Text>
        </TouchableOpacity>
        
        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-600">Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text className="text-blue-600 font-bold">Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
