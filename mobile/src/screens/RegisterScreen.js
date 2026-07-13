import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import api from '../configs/axios';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [usePhone, setUsePhone] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // States for OTP phase
  const [isOtpPhase, setIsOtpPhase] = useState(false);
  const [otp, setOtp] = useState('');
  const [registerResponseData, setRegisterResponseData] = useState(null); // to hold user ID or phone for verify

  const handleRegister = async () => {
    if (!name || (!email && !usePhone) || (!phone && usePhone) || !password) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setLoading(true);
      if (usePhone) {
        const response = await api.post('/auth/register-phone', { name, phone, password });
        Alert.alert('Thành công', 'Vui lòng kiểm tra tin nhắn để lấy mã OTP');
        setRegisterResponseData(phone);
        setIsOtpPhase(true);
      } else {
        const response = await api.post('/auth/register', { name, email, password });
        Alert.alert('Thành công', 'Đăng ký thành công! Hãy đăng nhập');
        navigation.navigate('Login');
      }
    } catch (error) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể đăng ký');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return;
    try {
      setLoading(true);
      await api.post('/auth/verify-otp', { phone: registerResponseData, otp });
      Alert.alert('Thành công', 'Xác thực SĐT thành công. Hãy đăng nhập');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Mã OTP không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  if (isOtpPhase) {
    return (
      <View className="flex-1 bg-white justify-center px-8">
        <Text className="text-3xl font-bold text-gray-800 mb-2">Nhập mã OTP</Text>
        <Text className="text-gray-500 mb-6">Mã xác thực đã được gửi tới số {registerResponseData}</Text>
        
        <TextInput
          className="bg-gray-100 p-4 rounded-xl text-gray-800 text-center text-2xl tracking-widest font-bold border border-gray-200 mb-6"
          placeholder="------"
          keyboardType="numeric"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
        />
        
        <TouchableOpacity 
          className="bg-blue-600 p-4 rounded-xl items-center"
          onPress={handleVerifyOtp}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff"/> : <Text className="text-white font-bold text-lg">Xác nhận</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white justify-center px-8">
      <View className="mb-8 items-center">
        <Text className="text-4xl font-bold text-blue-600 mb-2">Đăng ký mới</Text>
        <Text className="text-gray-500 text-lg">Tạo tài khoản để bắt đầu thuê đồ</Text>
      </View>

      <View className="flex-row mb-6 bg-gray-100 p-1 rounded-lg">
        <TouchableOpacity 
          className={`flex-1 py-2 rounded-md items-center ${!usePhone ? 'bg-white shadow-sm' : ''}`}
          onPress={() => setUsePhone(false)}
        >
          <Text className={!usePhone ? 'text-blue-600 font-bold' : 'text-gray-500'}>Dùng Email</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 py-2 rounded-md items-center ${usePhone ? 'bg-white shadow-sm' : ''}`}
          onPress={() => setUsePhone(true)}
        >
          <Text className={usePhone ? 'text-blue-600 font-bold' : 'text-gray-500'}>Dùng Số ĐT</Text>
        </TouchableOpacity>
      </View>

      <View className="space-y-4">
        <TextInput
          className="bg-gray-100 p-4 rounded-xl text-gray-800 text-base border border-gray-200"
          placeholder="Họ và tên"
          value={name}
          onChangeText={setName}
        />
        
        {usePhone ? (
          <TextInput
            className="bg-gray-100 p-4 rounded-xl text-gray-800 text-base border border-gray-200"
            placeholder="Số điện thoại"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        ) : (
          <TextInput
            className="bg-gray-100 p-4 rounded-xl text-gray-800 text-base border border-gray-200"
            placeholder="Địa chỉ Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        )}

        <TextInput
          className="bg-gray-100 p-4 rounded-xl text-gray-800 text-base border border-gray-200"
          placeholder="Mật khẩu"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        
        <TouchableOpacity 
          className="bg-blue-600 p-4 rounded-xl items-center mt-4 flex-row justify-center"
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#ffffff" /> : <Text className="text-white font-bold text-lg">Đăng ký</Text>}
        </TouchableOpacity>
        
        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-600">Đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text className="text-blue-600 font-bold">Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
