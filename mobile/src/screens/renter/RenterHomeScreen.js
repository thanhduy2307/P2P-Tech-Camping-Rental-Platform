import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, TextInput } from 'react-native';
import api from '../../configs/axios';

export default function RenterHomeScreen({ navigation }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [prompt, setPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      // Fetch public assets for renters
      const response = await api.get('/assets');
      setAssets(response.data.assets || response.data);
      setError('');
    } catch (err) {
      console.log('Fetch assets error:', err);
      setError('Không thể tải danh sách thiết bị');
    } finally {
      setLoading(false);
    }
  };

  const handleAiSearch = async () => {
    if (!prompt.trim()) {
      fetchAssets(); // Reset if empty
      return;
    }

    try {
      setAiLoading(true);
      const response = await api.post('/assets/recommend', { prompt });
      setAssets(response.data.recommendations || response.data || []);
      setError('');
    } catch (err) {
      console.log('AI Search error:', err);
      setError('AI hiện không khả dụng. Hiển thị kết quả mặc định.');
      fetchAssets();
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-gray-800 mb-4">Bạn muốn đi đâu?</Text>
        
        <View className="flex-row items-center bg-white rounded-2xl shadow-sm border border-purple-200">
          <TextInput
            className="flex-1 p-4 text-gray-800"
            placeholder="VD: Cắm trại Đà Lạt 3 ngày 2 đêm..."
            value={prompt}
            onChangeText={setPrompt}
            onSubmitEditing={handleAiSearch}
          />
          <TouchableOpacity 
            className="p-4 mr-1 bg-purple-100 rounded-xl"
            onPress={handleAiSearch}
            disabled={aiLoading}
          >
            {aiLoading ? <ActivityIndicator size="small" color="#9333ea" /> : <Text className="text-purple-700 font-bold">✨ AI Tìm</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" className="mt-10" />
      ) : error ? (
        <Text className="text-red-500 text-center mt-10">{error}</Text>
      ) : assets.length === 0 ? (
        <Text className="text-gray-500 text-center mt-10">Chưa có thiết bị nào</Text>
      ) : (
        assets.map((asset) => (
          <TouchableOpacity 
            key={asset._id}
            className="bg-white p-4 rounded-xl shadow-sm mb-4"
            onPress={() => navigation.navigate('AssetDetail', { assetId: asset._id })}
          >
            <View className="h-40 bg-gray-200 rounded-lg mb-3 overflow-hidden items-center justify-center">
              {asset.images && asset.images.length > 0 ? (
                <Image 
                  source={{ uri: typeof asset.images[0] === 'string' ? asset.images[0] : asset.images[0].url }} 
                  className="w-full h-full" 
                  resizeMode="cover" 
                />
              ) : (
                <Text className="text-gray-400">Không có hình ảnh</Text>
              )}
            </View>
            <Text className="text-lg font-bold text-gray-800" numberOfLines={1}>{asset.name}</Text>
            <Text className="text-blue-600 font-semibold mt-1">
              {asset.dailyRate ? asset.dailyRate.toLocaleString() : (asset.pricePerDay ? asset.pricePerDay.toLocaleString() : '0')} đ / ngày
            </Text>
            <View className="flex-row items-center mt-2">
              <Text className="text-gray-500 text-sm">📍 Trạng thái: {asset.status}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}
