import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { restoreToken } from '../../redux/authSlice';
import * as ImagePicker from 'expo-image-picker';
import api from '../../configs/axios';

export default function EditProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user, token, role } = useSelector(state => state.auth);
  
  const [name, setName] = useState(user?.name || '');
  const [address, setAddress] = useState(user?.address || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      handleUploadAvatar(result.assets[0].uri);
    }
  };

  const handleUploadAvatar = async (uri) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('avatar', {
        uri,
        name: 'avatar.jpg',
        type: 'image/jpeg'
      });

      const response = await api.put('/auth/update-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newAvatarUrl = response.data.avatar || response.data.user?.avatar;
      setAvatar(newAvatarUrl);
      
      dispatch(restoreToken({ token, role, user: { ...user, avatar: newAvatarUrl } }));
      Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải ảnh lên');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const response = await api.put('/auth/complete-profile', { name, address });
      dispatch(restoreToken({ token, role, user: response.data.user || { ...user, name, address } }));
      Alert.alert('Thành công', 'Đã cập nhật hồ sơ');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white p-4">
      <View className="items-center mt-6 mb-8">
        <TouchableOpacity onPress={pickImage} className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center overflow-hidden mb-4 relative">
          {avatar ? (
            <Image source={{ uri: avatar }} className="w-full h-full" />
          ) : (
            <Text className="text-3xl font-bold text-blue-600">
              {name ? name.charAt(0).toUpperCase() : 'U'}
            </Text>
          )}
          <View className="absolute bottom-0 bg-black/50 w-full items-center py-1">
            <Text className="text-white text-xs">Sửa ảnh</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-gray-600 mb-1 font-medium">Họ và tên</Text>
          <TextInput
            className="bg-gray-100 p-4 rounded-xl text-gray-800 text-base"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View>
          <Text className="text-gray-600 mb-1 font-medium">Địa chỉ</Text>
          <TextInput
            className="bg-gray-100 p-4 rounded-xl text-gray-800 text-base"
            value={address}
            onChangeText={setAddress}
            placeholder="Nhập địa chỉ của bạn"
          />
        </View>

        <TouchableOpacity 
          className="bg-blue-600 p-4 rounded-xl items-center mt-6"
          onPress={handleSaveProfile}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Lưu thay đổi</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}
