import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import api from '../../configs/axios';

export default function LenderWalletScreen() {
  const [balance, setBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [balanceRes, withdrawRes] = await Promise.all([
        api.get('/auth/balance').catch(() => ({ data: { balance: 0 } })),
        api.get('/auth/my-withdrawals').catch(() => ({ data: [] }))
      ]);
      
      setBalance(balanceRes.data.balance || 0);
      setWithdrawals(withdrawRes.data.withdrawals || withdrawRes.data || []);
    } catch (error) {
      console.log('Fetch wallet error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const withdrawAmount = parseInt(amount);
    if (!withdrawAmount || withdrawAmount < 50000) {
      Alert.alert('Lỗi', 'Số tiền rút tối thiểu là 50,000 đ');
      return;
    }
    if (withdrawAmount > balance) {
      Alert.alert('Lỗi', 'Số dư không đủ');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/withdraw', { amount: withdrawAmount });
      Alert.alert('Thành công', 'Đã gửi yêu cầu rút tiền');
      setAmount('');
      fetchWalletData();
    } catch (error) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể yêu cầu rút tiền');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold text-gray-800 mb-6">Ví của tôi</Text>
      
      <View className="bg-green-600 p-6 rounded-2xl shadow-md mb-6">
        <Text className="text-green-100 font-medium mb-1">Số dư khả dụng</Text>
        <Text className="text-3xl font-bold text-white">{balance.toLocaleString()} đ</Text>
      </View>

      <View className="bg-white p-4 rounded-xl shadow-sm mb-6">
        <Text className="text-lg font-bold text-gray-800 mb-3">Yêu cầu rút tiền</Text>
        <TextInput
          className="bg-gray-100 p-3 rounded-lg mb-3"
          placeholder="Nhập số tiền cần rút..."
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <TouchableOpacity 
          className="bg-green-600 p-3 rounded-lg items-center"
          onPress={handleWithdraw}
          disabled={loading}
        >
          <Text className="text-white font-bold">Rút tiền</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-lg font-bold text-gray-800 mb-3">Lịch sử rút tiền</Text>
      
      {loading && withdrawals.length === 0 ? (
        <ActivityIndicator size="large" color="#16a34a" />
      ) : withdrawals.length === 0 ? (
        <Text className="text-gray-500 text-center mt-4">Chưa có giao dịch nào</Text>
      ) : (
        <FlatList 
          data={withdrawals}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <View className="bg-white p-4 rounded-xl shadow-sm mb-3 flex-row justify-between items-center">
              <View>
                <Text className="font-bold text-gray-800">{item.amount.toLocaleString()} đ</Text>
                <Text className="text-gray-500 text-sm mt-1">
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text className={`font-semibold ${
                item.status === 'pending' ? 'text-orange-500' : 
                item.status === 'completed' ? 'text-green-600' : 'text-red-500'
              }`}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
