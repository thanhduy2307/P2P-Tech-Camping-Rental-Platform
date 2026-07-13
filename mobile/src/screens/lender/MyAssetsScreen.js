import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import api from '../../configs/axios';
import { useIsFocused } from '@react-navigation/native';

export default function MyAssetsScreen({ navigation }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      fetchMyAssets();
    }
  }, [isFocused]);

  const fetchMyAssets = async () => {
    try {
      setLoading(true);
      // Giả sử backend có endpoint này cho Lender, nếu không có thể cần tùy chỉnh query
      const response = await api.get('/assets/me'); 
      setAssets(response.data.assets || response.data);
    } catch (error) {
      console.log('Fetch my assets error:', error);
      // Fallback cho dummy data nếu API chưa hỗ trợ /assets/me
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (assetId, currentStatus) => {
    if (currentStatus === 'pending_approval') {
      Alert.alert('Thông báo', 'Thiết bị đang chờ duyệt, không thể thay đổi trạng thái.');
      return;
    }
    
    const newStatus = currentStatus === 'unavailable' ? 'verified' : 'unavailable';
    try {
      await api.put(`/assets/${assetId}/status`, { status: newStatus });
      Alert.alert('Thành công', 'Đã cập nhật trạng thái thiết bị');
      fetchMyAssets();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể đổi trạng thái thiết bị');
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Xóa thiết bị',
      'Bạn có chắc chắn muốn xóa thiết bị này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/assets/${id}`);
              Alert.alert('Thành công', 'Đã xóa thiết bị');
              fetchMyAssets();
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa thiết bị');
            }
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-2xl font-bold text-gray-800">Thiết bị của tôi</Text>
        <TouchableOpacity 
          className="bg-blue-600 w-10 h-10 rounded-full items-center justify-center"
          onPress={() => navigation.navigate('CreateAsset', { onGoBack: fetchMyAssets })}
        >
          <Text className="text-white text-2xl font-bold">+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" className="mt-10" />
      ) : assets.length === 0 ? (
        <View className="items-center mt-10">
          <Text className="text-gray-500">Bạn chưa đăng thiết bị nào</Text>
        </View>
      ) : (
        <FlatList 
          data={assets}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <View className="bg-white p-4 rounded-xl shadow-sm mb-3">
              <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
              <Text className="text-gray-500 mt-1">
                Giá thuê: {item.pricePerDay ? item.pricePerDay.toLocaleString() : '0'} đ/ngày
              </Text>
              <View className="mt-3 flex-row justify-between items-center">
                <Text className={`font-semibold ${
                  item.status === 'pending_approval' ? 'text-orange-500' : 
                  item.status === 'unavailable' ? 'text-red-500' : 'text-green-600'
                }`}>
                  {item.status === 'pending_approval' ? 'Chờ duyệt' : 
                   item.status === 'unavailable' ? 'Tạm ngưng' : 'Đang hoạt động'}
                </Text>
                
                <View className="flex-row">
                  {item.status !== 'pending_approval' && (
                    <View className="flex-row space-x-2">
                      <TouchableOpacity 
                        className="bg-gray-100 p-2 rounded-lg items-center mr-2"
                        onPress={() => navigation.navigate('EditAsset', { assetId: item._id, onGoBack: fetchMyAssets })}
                      >
                        <Text className="text-gray-700 font-bold">Sửa</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        className="bg-red-50 p-2 rounded-lg items-center mr-2"
                        onPress={() => handleDelete(item._id)}
                      >
                        <Text className="text-red-600 font-bold">Xóa</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        className={`${item.status === 'active' ? 'bg-orange-100' : 'bg-green-100'} p-2 rounded-lg items-center`}
                        onPress={() => handleToggleStatus(item._id, item.status)}
                      >
                        <Text className={`${item.status === 'active' ? 'text-orange-700' : 'text-green-700'} font-bold`}>
                          {item.status === 'active' ? 'Tạm ngưng' : 'Mở lại'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
