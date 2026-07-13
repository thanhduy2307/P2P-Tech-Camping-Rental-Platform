import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Image, FlatList, TouchableOpacity } from 'react-native';
import api from '../../configs/axios';

export default function PublicProfileScreen({ route, navigation }) {
  const { userId } = route.params || {};
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/auth/users/${userId}/profile`);
      setProfile(response.data.profile || response.data);
    } catch (error) {
      console.log('Fetch public profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-500">Không tìm thấy hồ sơ người dùng</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white p-6 items-center shadow-sm">
        <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center overflow-hidden mb-4">
          {profile.avatar ? (
            <Image source={{ uri: profile.avatar }} className="w-full h-full" />
          ) : (
            <Text className="text-3xl font-bold text-blue-600">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          )}
        </View>
        <Text className="text-2xl font-bold text-gray-800">{profile.name}</Text>
        <Text className="text-gray-500 mt-1 uppercase tracking-widest text-xs font-semibold">{profile.role}</Text>
        
        <TouchableOpacity 
          className="mt-4 bg-blue-100 px-6 py-2 rounded-full"
          onPress={() => navigation.navigate('ChatDetail', { chatId: profile._id, recipientName: profile.name })}
        >
          <Text className="text-blue-700 font-bold">Nhắn tin</Text>
        </TouchableOpacity>
      </View>
      
      <View className="p-4 mt-2">
        <Text className="text-lg font-bold text-gray-800 mb-2">Đánh giá trung bình</Text>
        <Text className="text-gray-600">{profile.rating ? `${profile.rating} / 5 ⭐` : 'Chưa có đánh giá nào'}</Text>
        
        <Text className="text-lg font-bold text-gray-800 mt-6 mb-2">Các thiết bị đang cho thuê</Text>
        {/* Placeholder for fetching assets by userId if backend supports it */}
        <Text className="text-gray-500 italic">Tính năng sắp ra mắt...</Text>
      </View>
    </View>
  );
}
