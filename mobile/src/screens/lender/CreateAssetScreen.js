import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../../configs/axios';
import { Picker } from '@react-native-picker/picker'; // You might need to install this if not exists

export default function CreateAssetScreen({ navigation, route }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [deposit, setDeposit] = useState('');
  const [category, setCategory] = useState('Lều trại');
  const [images, setImages] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5,
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

  const estimateDeposit = async () => {
    if (!name || !description || !dailyRate) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên, mô tả và giá thuê trước khi dùng AI ước tính.');
      return;
    }

    try {
      setAiLoading(true);
      const response = await api.post('/assets/ai-estimate-deposit', {
        name,
        description,
        dailyRate: parseInt(dailyRate)
      });
      
      if (response.data && response.data.suggestedDeposit) {
        setDeposit(response.data.suggestedDeposit.toString());
        Alert.alert('AI Đề xuất', `Mức giá cọc phù hợp: ${response.data.suggestedDeposit.toLocaleString()} đ\nLý do: ${response.data.reason || 'Dựa trên giá trị thị trường.'}`);
      }
    } catch (error) {
      console.log('AI estimate error', error);
      Alert.alert('Lỗi', 'AI hiện không khả dụng. Vui lòng tự nhập giá cọc.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name || !description || !dailyRate || !deposit || images.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng điền đủ thông tin và chọn ít nhất 1 ảnh');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('dailyRate', dailyRate);
      formData.append('deposit', deposit);
      formData.append('category', category);

      images.forEach((uri, index) => {
        formData.append('images', {
          uri,
          name: `image_${index}.jpg`,
          type: 'image/jpeg'
        });
      });

      await api.post('/assets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      Alert.alert('Thành công', 'Đã thêm thiết bị mới');
      if (route.params?.onGoBack) {
        route.params.onGoBack(); // Refresh list in parent
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể tạo thiết bị');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold text-gray-800 mb-6">Đăng thiết bị mới</Text>

      <View className="space-y-4 mb-8">
        <View>
          <Text className="text-gray-700 font-medium mb-1">Tên thiết bị</Text>
          <TextInput
            className="bg-gray-100 p-4 rounded-xl text-gray-800"
            placeholder="VD: Lều NatureHike 4 người"
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
            placeholder="Tình trạng, kích thước, phụ kiện đi kèm..."
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
              placeholder="100000"
              keyboardType="numeric"
              value={dailyRate}
              onChangeText={setDailyRate}
            />
          </View>

          <View className="flex-1">
            <Text className="text-gray-700 font-medium mb-1">Giá cọc (đ)</Text>
            <View className="flex-row items-center bg-gray-100 rounded-xl border-2 border-transparent focus:border-purple-300">
              <TextInput
                className="flex-1 p-4 text-gray-800"
                placeholder="500000"
                keyboardType="numeric"
                value={deposit}
                onChangeText={setDeposit}
              />
              <TouchableOpacity 
                className="p-3 mr-1 bg-purple-100 rounded-lg"
                onPress={estimateDeposit}
                disabled={aiLoading}
              >
                {aiLoading ? <ActivityIndicator size="small" color="#9333ea" /> : <Text className="text-purple-700 font-bold text-xs">AI Gợi ý</Text>}
              </TouchableOpacity>
            </View>
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
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Đăng thiết bị</Text>}
        </TouchableOpacity>
        
        <View className="h-10"></View>
      </View>
    </ScrollView>
  );
}
