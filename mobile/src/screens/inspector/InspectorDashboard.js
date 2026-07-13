import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import api from '../../configs/axios';

export default function InspectorDashboard() {
  const [pendingAssets, setPendingAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingAssets();
  }, []);

  const fetchPendingAssets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/assets/pending');
      setPendingAssets(response.data.assets || response.data);
    } catch (error) {
      console.log('Fetch pending assets error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id, status) => {
    try {
      await api.put(`/assets/${id}/verify`, { status });
      Alert.alert('Thành công', `Đã ${status === 'verified' ? 'phê duyệt' : 'từ chối'} thiết bị`);
      fetchPendingAssets();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể xác duyệt lúc này');
    }
  };

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold text-gray-800 mb-4">Không gian Kiểm định</Text>
      <Text className="text-lg font-bold text-gray-700 mb-2">Danh sách chờ duyệt</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#d97706" className="mt-10" />
      ) : pendingAssets.length === 0 ? (
        <View className="items-center mt-10">
          <Text className="text-gray-500">Không có thiết bị nào đang chờ duyệt</Text>
        </View>
      ) : (
        <FlatList 
          data={pendingAssets}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <View className="bg-white p-4 rounded-xl shadow-sm mb-3">
              <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
              <Text className="text-gray-500 mt-1">Người đăng: {item.lender?.name || 'Lender'}</Text>
              
              <View className="mt-4 flex-row justify-end space-x-2">
                <TouchableOpacity 
                  className="bg-red-100 px-4 py-2 rounded-lg mr-2"
                  onPress={() => handleVerify(item._id, 'rejected')}
                >
                  <Text className="text-red-700 font-bold">Từ chối</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="bg-green-100 px-4 py-2 rounded-lg"
                  onPress={() => handleVerify(item._id, 'verified')}
                >
                  <Text className="text-green-700 font-bold">Phê duyệt</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
