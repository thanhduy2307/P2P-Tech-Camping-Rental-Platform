import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import api from '../../configs/axios';

export default function AdminEkycScreen() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/lender-applications');
      setApplications(response.data.applications || response.data || []);
    } catch (error) {
      console.log('Fetch ekyc error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id, status) => {
    try {
      await api.put(`/auth/lender-applications/${id}/verify`, { status });
      Alert.alert('Thành công', `Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} hồ sơ`);
      fetchApplications();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể xác duyệt lúc này');
    }
  };

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold text-gray-800 mb-4">Duyệt eKYC Lender</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#9333ea" className="mt-10" />
      ) : applications.length === 0 ? (
        <Text className="text-gray-500 text-center mt-10">Không có hồ sơ chờ duyệt</Text>
      ) : (
        <FlatList 
          data={applications}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <View className="bg-white p-4 rounded-xl shadow-sm mb-3">
              <Text className="text-lg font-bold text-gray-800">{item.user?.name || 'User'}</Text>
              <Text className="text-gray-500 mt-1">CCCD: {item.cccdNumber || 'Không có'}</Text>
              
              <View className="mt-4 flex-row justify-end space-x-2">
                <TouchableOpacity 
                  className="bg-red-100 px-4 py-2 rounded-lg mr-2"
                  onPress={() => handleVerify(item._id, 'rejected')}
                >
                  <Text className="text-red-700 font-bold">Từ chối</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="bg-green-100 px-4 py-2 rounded-lg"
                  onPress={() => handleVerify(item._id, 'approved')}
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
