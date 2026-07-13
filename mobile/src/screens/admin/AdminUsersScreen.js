import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, ActionSheetIOS, Platform } from 'react-native';
import api from '../../configs/axios';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data.users || response.data || []);
    } catch (error) {
      console.log('Fetch users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (userId, isBanned) => {
    try {
      await api.put(`/admin/users/${userId}/ban`, { isBanned: !isBanned });
      Alert.alert('Thành công', 'Đã thay đổi trạng thái tài khoản');
      fetchUsers();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  const handleChangeRole = (user) => {
    const roles = ['user', 'inspector', 'admin', 'Hủy'];
    const cancelButtonIndex = 3;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: roles,
          cancelButtonIndex,
          title: `Đổi vai trò cho ${user.name}`
        },
        (buttonIndex) => {
          if (buttonIndex !== cancelButtonIndex) {
            updateRole(user._id, roles[buttonIndex]);
          }
        }
      );
    } else {
      Alert.alert(
        `Đổi vai trò: ${user.name}`,
        'Chọn vai trò mới',
        [
          { text: 'User', onPress: () => updateRole(user._id, 'user') },
          { text: 'Inspector', onPress: () => updateRole(user._id, 'inspector') },
          { text: 'Admin', onPress: () => updateRole(user._id, 'admin') },
          { text: 'Hủy', style: 'cancel' }
        ]
      );
    }
  };

  const updateRole = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      Alert.alert('Thành công', `Đã cấp quyền ${newRole}`);
      fetchUsers();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cấp quyền');
    }
  };

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold text-gray-800 mb-4">Quản lý User</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#9333ea" className="mt-10" />
      ) : (
        <FlatList 
          data={users}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <View className="bg-white p-4 rounded-xl shadow-sm mb-3">
              <View className="flex-row justify-between">
                <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
                <Text className="text-purple-600 font-semibold">{item.role}</Text>
              </View>
              <Text className="text-gray-500 mt-1">{item.email}</Text>
              
              <View className="mt-4 flex-row justify-end space-x-2">
                <TouchableOpacity 
                  className="bg-purple-100 px-4 py-2 rounded-lg mr-2"
                  onPress={() => handleChangeRole(item)}
                >
                  <Text className="text-purple-700 font-bold">Phân quyền</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  className={`${item.isBanned ? 'bg-green-100' : 'bg-red-100'} px-4 py-2 rounded-lg`}
                  onPress={() => handleToggleBan(item._id, item.isBanned)}
                >
                  <Text className={`${item.isBanned ? 'text-green-700' : 'text-red-700'} font-bold`}>
                    {item.isBanned ? 'Mở khóa' : 'Khóa tài khoản'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
