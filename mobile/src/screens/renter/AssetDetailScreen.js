import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert, Linking } from 'react-native';
import api from '../../configs/axios';

export default function AssetDetailScreen({ route, navigation }) {
  const { assetId } = route.params || {};
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (assetId) {
      fetchAssetDetail();
    }
  }, [assetId]);

  const fetchAssetDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/assets/${assetId}`);
      setAsset(response.data.asset || response.data);
    } catch (error) {
      console.log('Error fetching asset details:', error);
      Alert.alert('Lỗi', 'Không thể tải chi tiết thiết bị');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async () => {
    try {
      setLoading(true);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 1); // Default 1 ngày
      
      const response = await api.post('/orders', {
        assetId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      if (response.data && response.data.paymentUrl) {
        // Open VNPay in browser
        Linking.openURL(response.data.paymentUrl);
        navigation.navigate('MainTabs', { screen: 'RenterOrders' });
      } else {
        Alert.alert('Thành công', 'Đặt hàng thành công!');
        navigation.goBack();
      }
    } catch (error) {
      console.log('Order error:', error.response?.data || error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể tạo đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!asset) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text>Không tìm thấy thông tin thiết bị</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="h-64 bg-gray-200 items-center justify-center overflow-hidden">
        {asset.images && asset.images.length > 0 ? (
          <Image source={{ uri: asset.images[0].url }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <Text className="text-gray-500">Chưa có hình ảnh</Text>
        )}
      </View>
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-800">{asset.name}</Text>
        <Text className="text-xl text-blue-600 font-bold mt-2">
          {asset.pricePerDay ? asset.pricePerDay.toLocaleString() : '0'} đ / ngày
        </Text>
        
        <View className="mt-4">
          <Text className="text-lg font-semibold text-gray-800">Mô tả</Text>
          <Text className="text-gray-600 mt-2 leading-6">
            {asset.description || 'Chưa có mô tả'}
          </Text>
        </View>

        <TouchableOpacity 
          className="bg-blue-600 p-4 rounded-xl items-center mt-8"
          onPress={handleOrder}
          disabled={loading}
        >
          <Text className="text-white font-bold text-lg">Đặt thuê ngay (1 Ngày)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
