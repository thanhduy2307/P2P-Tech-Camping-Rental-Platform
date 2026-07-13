import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import api from '../../configs/axios';

export default function LenderOnboardingScreen({ navigation }) {
  const [cccd, setCccd] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!cccd || cccd.length < 9) {
      Alert.alert('Lỗi', 'Vui lòng nhập CCCD hợp lệ');
      return;
    }
    
    try {
      setLoading(true);
      await api.post('/auth/lender-onboarding', { cccdNumber: cccd });
      Alert.alert('Thành công', 'Đã nộp hồ sơ đăng ký Lender. Vui lòng chờ admin duyệt.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể nộp hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white p-6 justify-center">
      <Text className="text-2xl font-bold text-gray-800 mb-2">Đăng ký làm Chủ thiết bị</Text>
      <Text className="text-gray-500 mb-8">Nâng cấp tài khoản để bắt đầu cho thuê thiết bị và kiếm tiền.</Text>
      
      <TextInput
        className="bg-gray-100 p-4 rounded-xl text-gray-800 text-base mb-6 border border-gray-200"
        placeholder="Số CCCD (9 hoặc 12 số)"
        keyboardType="numeric"
        value={cccd}
        onChangeText={setCccd}
      />
      
      <TouchableOpacity 
        className="bg-green-600 p-4 rounded-xl items-center"
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Nộp yêu cầu nâng cấp</Text>}
      </TouchableOpacity>
    </View>
  );
}
