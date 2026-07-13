import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Image } from 'react-native';
import api from '../../configs/axios';

export default function AdminAssetsScreen() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      // Giả định backend có route GET /admin/assets. Nếu không có thể gọi GET /assets
      const response = await api.get('/admin/assets').catch(() => api.get('/assets'));
      setAssets(response.data.assets || response.data || []);
    } catch (error) {
      console.log('Fetch admin assets error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold text-gray-800 mb-4">Tất cả Thiết bị</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#9333ea" className="mt-10" />
      ) : assets.length === 0 ? (
        <Text className="text-gray-500 text-center mt-10">Không có thiết bị nào</Text>
      ) : (
        <FlatList 
          data={assets}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <View className="bg-white p-4 rounded-xl shadow-sm mb-3 flex-row">
              <View className="w-20 h-20 bg-gray-200 rounded-lg mr-4 overflow-hidden">
                {item.images && item.images.length > 0 ? (
                  <Image 
                    source={{ uri: typeof item.images[0] === 'string' ? item.images[0] : item.images[0].url }} 
                    className="w-full h-full" 
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Text className="text-gray-400 text-xs">No Image</Text>
                  </View>
                )}
              </View>
              
              <View className="flex-1 justify-center">
                <Text className="text-lg font-bold text-gray-800" numberOfLines={1}>{item.name}</Text>
                <Text className="text-gray-500 text-sm">Chủ: {item.lender?.name || '---'}</Text>
                <View className="flex-row justify-between mt-1 items-center">
                  <Text className="text-blue-600 font-bold">
                    {(item.dailyRate || item.pricePerDay || 0).toLocaleString()} đ/ngày
                  </Text>
                  <Text className={`text-xs font-bold ${
                    item.status === 'active' ? 'text-green-600' :
                    item.status === 'pending_approval' ? 'text-orange-500' : 'text-gray-500'
                  }`}>
                    {item.status?.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
