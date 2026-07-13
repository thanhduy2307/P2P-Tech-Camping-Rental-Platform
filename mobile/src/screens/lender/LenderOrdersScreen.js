import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import api from '../../configs/axios';

export default function LenderOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');

  useEffect(() => {
    fetchLenderOrders();
  }, []);

  const fetchLenderOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/incoming').catch(() => ({ data: [] }));
      setOrders(response.data.orders || response.data);
    } catch (error) {
      console.log('Fetch lender orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOTP = (orderId, type) => {
    // Demo flow, in a real app use a Modal to input OTP
    Alert.prompt(
      `Nhập mã OTP ${type === 'handover' ? 'Giao đồ' : 'Nhận đồ'}`,
      'Vui lòng nhập mã OTP gồm 6 chữ số từ Renter cung cấp',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xác nhận', 
          onPress: async (otpCode) => {
            try {
              if (type === 'handover') {
                await api.put(`/orders/${orderId}/handover`, { handoverOTP: otpCode });
                Alert.alert('Thành công', 'Bàn giao đồ thành công!');
              } else {
                await api.put(`/orders/${orderId}/return`, { returnOTP: otpCode });
                Alert.alert('Thành công', 'Nhận lại đồ và quyết toán thành công!');
              }
              fetchLenderOrders();
            } catch (err) {
              Alert.alert('Lỗi', err.response?.data?.message || 'Xác thực OTP thất bại');
            }
          } 
        }
      ]
    );
  };

  const handleCancelOrder = (orderId) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn hủy đơn hàng này?', [
      { text: 'Không', style: 'cancel' },
      { text: 'Hủy Đơn', style: 'destructive', onPress: async () => {
        try {
          await api.put(`/orders/${orderId}/cancel`);
          Alert.alert('Thành công', 'Đã hủy đơn hàng');
          fetchLenderOrders();
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
      fetchLenderOrders();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể gửi khiếu nại');
    }
  };

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold text-gray-800 mb-4">Quản lý Đơn thuê</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#16a34a" className="mt-10" />
      ) : orders.length === 0 ? (
        <View className="items-center mt-10">
          <Text className="text-gray-500">Chưa có đơn thuê nào</Text>
        </View>
      ) : (
        <FlatList 
          data={orders}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <View className="bg-white p-4 rounded-xl shadow-sm mb-3">
              <Text className="text-lg font-bold text-gray-800">{item.asset?.name || 'Thiết bị'}</Text>
              <Text className="text-gray-500 mt-1">Người thuê: {item.renter?.name || 'Khách'}</Text>
              
              <View className="mt-4 flex-row flex-wrap justify-between items-center space-x-2">
                <Text className={`font-semibold mb-2 ${
                  item.status === 'cancelled' ? 'text-red-500' :
                  item.status === 'disputed' ? 'text-orange-500' :
                  item.status === 'pending' || item.status === 'reserved' ? 'text-orange-500' : 'text-blue-600'
                }`}>
                  {item.status.toUpperCase()}
                </Text>
                
                <View className="flex-row space-x-2 mb-2 flex-wrap justify-end">
                  {item.status === 'pending' && (
                    <TouchableOpacity 
                      className="bg-red-100 px-3 py-2 rounded-lg ml-2"
                      onPress={() => handleCancelOrder(item._id)}
                    >
                      <Text className="text-red-700 font-bold">Hủy đơn</Text>
                    </TouchableOpacity>
                  )}

                  {item.status === 'reserved' && (
                    <TouchableOpacity 
                      className="bg-green-100 px-3 py-2 rounded-lg ml-2"
                      onPress={() => handleOTP(item._id, 'handover')}
                    >
                      <Text className="text-green-700 font-bold">Giao đồ</Text>
                    </TouchableOpacity>
                  )}

                  {item.status === 'active' && (
                    <TouchableOpacity 
                      className="bg-blue-100 px-3 py-2 rounded-lg ml-2"
                      onPress={() => handleOTP(item._id, 'return')}
                    >
                      <Text className="text-blue-700 font-bold">Nhận đồ</Text>
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
            <Text className="text-xl font-bold mb-4">Mở Tranh Chấp</Text>
            <TextInput 
              className="bg-gray-100 p-4 rounded-xl mb-4 h-24"
              placeholder="VD: Người thuê làm hỏng đồ..."
              multiline
              textAlignVertical="top"
              value={disputeReason}
              onChangeText={setDisputeReason}
            />
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity onPress={() => setDisputeModalVisible(false)} className="p-3 mr-2">
                <Text className="text-gray-500 font-bold">Hủy</Text>
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
