import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import api from '../../configs/axios';

export default function AdminWithdrawalsScreen() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/withdrawals');
      setWithdrawals(response.data.withdrawals || response.data || []);
    } catch (error) {
      console.log('Fetch withdrawals error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id, status) => {
    try {
      await api.put(`/auth/withdrawals/${id}/verify`, { status });
      Alert.alert('Thành công', `Đã ${status === 'completed' ? 'duyệt' : 'từ chối'} lệnh rút tiền`);
      fetchWithdrawals();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể xử lý lúc này');
    }
  };

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold text-gray-800 mb-4">Duyệt Rút tiền</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#9333ea" className="mt-10" />
      ) : withdrawals.length === 0 ? (
        <Text className="text-gray-500 text-center mt-10">Không có yêu cầu rút tiền mới</Text>
      ) : (
        <FlatList 
          data={withdrawals.filter(w => w.status === 'pending')}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <View className="bg-white p-4 rounded-xl shadow-sm mb-3">
              <Text className="text-lg font-bold text-gray-800">{item.user?.name || 'User'}</Text>
              <Text className="text-green-600 font-bold text-xl mt-1">{item.amount.toLocaleString()} đ</Text>
              <Text className="text-gray-500 mt-1 text-xs">
                Ngày tạo: {new Date(item.createdAt).toLocaleDateString()}
              </Text>
              
              <View className="mt-4 flex-row justify-end space-x-2">
                <TouchableOpacity 
                  className="bg-red-100 px-4 py-2 rounded-lg mr-2"
                  onPress={() => handleVerify(item._id, 'rejected')}
                >
                  <Text className="text-red-700 font-bold">Từ chối</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="bg-green-100 px-4 py-2 rounded-lg"
                  onPress={() => handleVerify(item._id, 'completed')}
                >
                  <Text className="text-green-700 font-bold">Duyệt chuyển khoản</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
