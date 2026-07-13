import { View, Text, TouchableOpacity } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View className="flex-1 items-center justify-center bg-gray-100">
      <Text className="text-2xl font-bold text-blue-600 mb-4">Trang chủ P2P Rental</Text>
      <TouchableOpacity 
        className="bg-blue-500 px-6 py-3 rounded-lg"
        onPress={() => navigation.navigate('Login')}
      >
        <Text className="text-white font-semibold">Đi đến Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );
}
