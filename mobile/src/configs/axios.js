import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sử dụng địa chỉ IP LAN của máy tính chạy backend thay vì localhost cho mobile
// Đảm bảo tạo file .env trong thư mục mobile với biến EXPO_PUBLIC_API_URL=http://<YOUR_IP>:5000/api
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000/api', // 10.0.2.2 là localhost của Android Emulator
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm request interceptor để đính kèm token (sử dụng async)
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Thêm response interceptor để xử lý lỗi token hết hạn
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('role');
    }
    return Promise.reject(error);
  }
);

export default api;
