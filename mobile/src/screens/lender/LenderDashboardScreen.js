import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import api from '../../configs/axios';

export default function LenderDashboardScreen() {
  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState({ activeAssets: 0, pendingOrders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Giả sử API cho phép lấy số dư và thống kê cơ bản
      const [balanceRes, statsRes] = await Promise.all([
        api.get('/auth/balance').catch(() => ({ data: { balance: 0 } })),
        api.get('/assets/me').catch(() => ({ data: [] }))
      ]);
      
      setBalance(balanceRes.data.balance || 0);
      
      const assets = statsRes.data.assets || statsRes.data;
      const activeAssets = Array.isArray(assets) ? assets.filter(a => a.status === 'verified').length : 0;
      
      setStats({ activeAssets, pendingOrders: 0 });
    } catch (error) {
      console.log('Fetch lender dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold text-gray-800 mb-6">Tổng quan (Lender)</Text>
      
      <View className="bg-green-600 p-6 rounded-2xl shadow-md mb-6">
        <Text className="text-green-100 font-medium mb-1">Số dư khả dụng</Text>
        <Text className="text-3xl font-bold text-white">{balance.toLocaleString()} đ</Text>
        <TouchableOpacity className="mt-4 bg-green-500 rounded-lg p-3 items-center">
          <Text className="text-white font-bold">Yêu cầu rút tiền</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-between mb-6">
        <View className="bg-white p-4 rounded-xl flex-1 mr-2 shadow-sm items-center">
          <Text className="text-gray-500 text-sm mb-1 text-center">Thiết bị đang cho thuê</Text>
          <Text className="text-2xl font-bold text-gray-800">{stats.activeAssets}</Text>
        </View>
        <View className="bg-white p-4 rounded-xl flex-1 ml-2 shadow-sm items-center">
          <Text className="text-gray-500 text-sm mb-1 text-center">Đơn hàng chờ giao</Text>
          <Text className="text-2xl font-bold text-orange-500">{stats.pendingOrders}</Text>
        </View>
      </View>
    </ScrollView>
  );
}
