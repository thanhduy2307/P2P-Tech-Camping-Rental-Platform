import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import api from '../../configs/axios';

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'disputed', 'completed'

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/orders');
      let data = response.data.orders || response.data || [];
      
      if (filter === 'disputed') {
        data = data.filter(o => o.status === 'disputed');
      } else if (filter === 'completed') {
        data = data.filter(o => o.status === 'completed');
      }
      
      setOrders(data);
    } catch (error) {
      console.log('Fetch admin orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async (orderId, resolution) => {
    // resolution có thể là 'refund_renter', 'pay_lender'
    Alert.alert('Giải quyết khiếu nại', `Xác nhận phân xử: ${resolution === 'pay_lender' ? 'Bồi thường cho Chủ đồ' : 'Hoàn tiền cho Người thuê'}?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xác nhận', onPress: async () => {
        try {
          // Gửi quyết định phân xử lên BE
          await api.put(`/orders/${orderId}/resolve-dispute`, { resolution });
          Alert.alert('Thành công', 'Đã giải quyết tranh chấp');
          fetchOrders();
        } catch (error) {
          Alert.alert('Lỗi', 'Không thể giải quyết lúc này');
        }
      }}
    ]);
  };

  const handleSettle = async (orderId) => {
    Alert.alert('Quyết toán', 'Chuyển tiền thuê vào ví của Lender?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Quyết toán', onPress: async () => {
        try {
          await api.put(`/orders/${orderId}/settle`);
          Alert.alert('Thành công', 'Đã quyết toán xong');
          fetchOrders();
        } catch (error) {
          Alert.alert('Lỗi', 'Không thể quyết toán');
        }
      }}
    ]);
  };

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold text-gray-800 mb-4">Quản lý Đơn hàng</Text>

      <View className="flex-row mb-4 bg-gray-200 rounded-lg p-1">
        <TouchableOpacity 
          className={`flex-1 py-2 items-center rounded-md ${filter === 'all' ? 'bg-white shadow-sm' : ''}`}
          onPress={() => setFilter('all')}
        >
          <Text className={filter === 'all' ? 'font-bold text-gray-800' : 'text-gray-500'}>Tất cả</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 py-2 items-center rounded-md ${filter === 'disputed' ? 'bg-white shadow-sm' : ''}`}
          onPress={() => setFilter('disputed')}
        >
          <Text className={filter === 'disputed' ? 'font-bold text-orange-600' : 'text-gray-500'}>Khiếu nại</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 py-2 items-center rounded-md ${filter === 'completed' ? 'bg-white shadow-sm' : ''}`}
          onPress={() => setFilter('completed')}
        >
          <Text className={filter === 'completed' ? 'font-bold text-green-600' : 'text-gray-500'}>Cần quyết toán</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#9333ea" className="mt-10" />
      ) : orders.length === 0 ? (
        <Text className="text-gray-500 text-center mt-10">Không có đơn hàng nào</Text>
      ) : (
        <FlatList 
          data={orders}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <View className="bg-white p-4 rounded-xl shadow-sm mb-3">
              <View className="flex-row justify-between mb-2">
                <Text className="text-lg font-bold text-gray-800 flex-1">{item.asset?.name || 'Thiết bị'}</Text>
                <Text className={`font-bold ${
                  item.status === 'disputed' ? 'text-orange-500' :
                  item.status === 'completed' ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
              
              <Text className="text-gray-500 text-sm">Lender: {item.lender?.name || '---'}</Text>
              <Text className="text-gray-500 text-sm">Renter: {item.renter?.name || '---'}</Text>
              <Text className="text-blue-600 font-bold mt-1">Tổng tiền: {item.totalPrice?.toLocaleString() || '0'} đ</Text>
              
              {item.status === 'disputed' && (
                <View className="mt-4 border-t border-gray-100 pt-3 flex-row justify-end space-x-2">
                  <TouchableOpacity 
                    className="bg-blue-100 px-3 py-2 rounded-lg mr-2"
                    onPress={() => handleResolveDispute(item._id, 'refund_renter')}
                  >
                    <Text className="text-blue-700 font-bold">Hoàn Renter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="bg-orange-100 px-3 py-2 rounded-lg"
                    onPress={() => handleResolveDispute(item._id, 'pay_lender')}
                  >
                    <Text className="text-orange-700 font-bold">Phạt Renter (Đền bù Lender)</Text>
                  </TouchableOpacity>
                </View>
              )}

              {item.status === 'completed' && !item.isSettled && (
                <View className="mt-4 border-t border-gray-100 pt-3 flex-row justify-end">
                  <TouchableOpacity 
                    className="bg-green-600 px-6 py-2 rounded-lg"
                    onPress={() => handleSettle(item._id)}
                  >
                    <Text className="text-white font-bold">Quyết toán cho Lender</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}
