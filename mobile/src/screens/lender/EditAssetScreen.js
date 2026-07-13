import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../../configs/axios';
import { Picker } from '@react-native-picker/picker';

export default function EditAssetScreen({ navigation, route }) {
  const { assetId, onGoBack } = route.params;
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [deposit, setDeposit] = useState('');
  const [category, setCategory] = useState('Lều trại');
  const [images, setImages] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAsset();
  }, []);

  const fetchAsset = async () => {
    try {
      const response = await api.get(`/assets/${assetId}`);
      const asset = response.data.asset || response.data;
      setName(asset.name);
      setDescription(asset.description);
      setDailyRate(asset.dailyRate.toString());
      setDeposit(asset.deposit.toString());
      setCategory(asset.category || 'Lều trại');
      setImages(asset.images || []);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải thông tin thiết bị');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
      quality: 0.5,
    });

    if (!result.canceled) {
      const selectedImages = result.assets.map(asset => asset.uri);
      setImages([...images, ...selectedImages]);
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleSubmit = async () => {
    if (!name || !description || !dailyRate || !deposit || images.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng điền đủ thông tin và chọn ít nhất 1 ảnh');
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('dailyRate', dailyRate);
      formData.append('deposit', deposit);
      formData.append('category', category);

      images.forEach((uri, index) => {
        // Only append new images as files if they are local URIs (file:// or content://)
        // For old images (http), backend logic might vary. We'll pass them as strings or handle properly.
        if (uri.startsWith('http')) {
          formData.append('existingImages', uri);
        } else {
          formData.append('images', {
            uri,
            name: `image_${index}.jpg`,
            type: 'image/jpeg'
          });
        }
      });

      await api.put(`/assets/${assetId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      Alert.alert('Thành công', 'Đã cập nhật thiết bị');
      if (onGoBack) onGoBack();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật thiết bị');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold text-gray-800 mb-6">Chỉnh sửa thiết bị</Text>

      <View className="space-y-4 mb-8">
        <View>
          <Text className="text-gray-700 font-medium mb-1">Tên thiết bị</Text>
          <TextInput
            className="bg-gray-100 p-4 rounded-xl text-gray-800"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View>
          <Text className="text-gray-700 font-medium mb-1">Danh mục</Text>
          <View className="bg-gray-100 rounded-xl overflow-hidden">
            <Picker
              selectedValue={category}
              onValueChange={(itemValue) => setCategory(itemValue)}
            >
              <Picker.Item label="Lều trại" value="Lều trại" />
              <Picker.Item label="Bếp nướng" value="Bếp nướng" />
              <Picker.Item label="Bàn ghế" value="Bàn ghế" />
              <Picker.Item label="Phụ kiện" value="Phụ kiện" />
            </Picker>
          </View>
        </View>

        <View>
          <Text className="text-gray-700 font-medium mb-1">Mô tả chi tiết</Text>
          <TextInput
            className="bg-gray-100 p-4 rounded-xl text-gray-800"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View className="flex-row space-x-4">
          <View className="flex-1">
            <Text className="text-gray-700 font-medium mb-1">Giá thuê (đ/ngày)</Text>
            <TextInput
              className="bg-gray-100 p-4 rounded-xl text-gray-800"
              keyboardType="numeric"
              value={dailyRate}
              onChangeText={setDailyRate}
            />
          </View>
          <View className="flex-1">
            <Text className="text-gray-700 font-medium mb-1">Giá cọc (đ)</Text>
            <TextInput
              className="bg-gray-100 p-4 rounded-xl text-gray-800"
              keyboardType="numeric"
              value={deposit}
              onChangeText={setDeposit}
            />
          </View>
        </View>

        <View>
          <Text className="text-gray-700 font-medium mb-2">Hình ảnh ({images.length}/5)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {images.map((uri, index) => (
              <View key={index} className="mr-3 relative">
                <Image source={{ uri }} className="w-24 h-24 rounded-xl" />
                <TouchableOpacity 
                  className="absolute -top-2 -right-2 bg-red-500 w-6 h-6 rounded-full items-center justify-center"
                  onPress={() => removeImage(index)}
                >
                  <Text className="text-white text-xs font-bold">X</Text>
                </TouchableOpacity>
              </View>
            ))}
            
            {images.length < 5 && (
              <TouchableOpacity 
                className="w-24 h-24 rounded-xl bg-gray-100 items-center justify-center border-2 border-dashed border-gray-300"
                onPress={pickImage}
              >
                <Text className="text-gray-400 text-3xl">+</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        <TouchableOpacity 
          className="bg-blue-600 p-4 rounded-xl items-center mt-6"
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Lưu thay đổi</Text>}
        </TouchableOpacity>
        
        <View className="h-10"></View>
      </View>
    </ScrollView>
  );
}
