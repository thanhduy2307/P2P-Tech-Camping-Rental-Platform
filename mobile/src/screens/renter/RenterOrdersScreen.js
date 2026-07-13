import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import api from '../../configs/axios';

export default function RenterOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/my-rentals'); 
      setOrders(response.data.orders || response.data);
    } catch (error) {
      console.log('Fetch renter orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = (orderId) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn hủy đơn hàng này?', [
      { text: 'Không', style: 'cancel' },
      { text: 'Hủy Đơn', style: 'destructive', onPress: async () => {
        try {
          await api.put(`/orders/${orderId}/cancel`);
          Alert.alert('Thành công', 'Đã hủy đơn hàng');
          fetchOrders();
        } catch (error) {
          Alert.alert('Lỗi', 'Không thể hủy đơn hàng này');
        }
      }}
    ]);
  };

  const openDispute = (orderId) => {
    setCurrentOrderId(orderId);
    setDisputeReason('');
    setDisputeModalVisible(true);
  };

  const submitDispute = async () => {
    if (!disputeReason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do khiếu nại');
      return;
    }
    try {
      await api.put(`/orders/${currentOrderId}/dispute`, { reason: disputeReason });
      Alert.alert('Thành công', 'Đã gửi khiếu nại. Admin sẽ xử lý.');
      setDisputeModalVisible(false);
      fetchOrders();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể gửi khiếu nại');
    }
  };

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold text-gray-800 mb-4">Đơn thuê của tôi</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" className="mt-10" />
      ) : orders.length === 0 ? (
        <View className="items-center mt-10">
          <Text className="text-gray-500">Bạn chưa có đơn thuê nào</Text>
        </View>
      ) : (
        <FlatList 
          data={orders}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <View className="bg-white p-4 rounded-xl shadow-sm mb-3">
              <Text className="text-lg font-bold text-gray-800">
                {item.asset?.name || 'Thiết bị'}
              </Text>
              <Text className="text-gray-500 mt-1">
                Ngày thuê: {new Date(item.startDate).toLocaleDateString()}
              </Text>
              <View className="mt-3 flex-row flex-wrap justify-between items-center space-x-2">
                <Text className={`font-semibold mb-2 ${
                  item.status === 'cancelled' ? 'text-red-500' :
                  item.status === 'disputed' ? 'text-orange-500' :
                  item.status === 'pending' ? 'text-blue-500' : 'text-green-600'
                }`}>
                  {item.status.toUpperCase()}
                </Text>
                
                <View className="flex-row space-x-2 mb-2">
                  {item.status === 'pending' && (
                    <TouchableOpacity 
                      className="bg-red-100 px-3 py-2 rounded-lg ml-2"
                      onPress={() => handleCancelOrder(item._id)}
                    >
                      <Text className="text-red-700 font-bold">Hủy đơn</Text>
                    </TouchableOpacity>
                  )}
                  
                  {['active', 'returned', 'completed'].includes(item.status) && (
                    <TouchableOpacity 
                      className="bg-orange-100 px-3 py-2 rounded-lg ml-2"
                      onPress={() => openDispute(item._id)}
                    >
                      <Text className="text-orange-700 font-bold">Khiếu nại</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={disputeModalVisible} transparent={true} animationType="fade">
        <View className="flex-1 bg-black/50 justify-center p-4">
          <View className="bg-white p-6 rounded-2xl">
            <Text className="text-xl font-bold mb-4">Gửi Khiếu Nại</Text>
            <TextInput 
              className="bg-gray-100 p-4 rounded-xl mb-4 h-24"
              placeholder="Nhập lý do khiếu nại..."
              multiline
              textAlignVertical="top"
              value={disputeReason}
              onChangeText={setDisputeReason}
            />
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity onPress={() => setDisputeModalVisible(false)} className="p-3 mr-2">
                <Text className="text-gray-500 font-bold">Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitDispute} className="bg-orange-500 px-6 py-3 rounded-xl">
                <Text className="text-white font-bold">Gửi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
