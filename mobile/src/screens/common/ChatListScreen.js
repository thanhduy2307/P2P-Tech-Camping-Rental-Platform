import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import api from '../../configs/axios';

export default function ChatListScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/chat/conversations');
      setConversations(response.data.conversations || response.data || []);
    } catch (error) {
      console.log('Fetch chats error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold text-gray-800 mb-4">Tin nhắn</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" className="mt-10" />
      ) : conversations.length === 0 ? (
        <Text className="text-gray-500 text-center mt-10">Chưa có cuộc trò chuyện nào</Text>
      ) : (
        <FlatList 
          data={conversations}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              className="bg-white p-4 rounded-xl shadow-sm mb-3 flex-row items-center"
              onPress={() => navigation.navigate('ChatDetail', { 
                chatId: item._id, 
                recipientName: item.otherUser?.name || 'Khách' 
              })}
            >
              <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-4">
                <Text className="text-blue-700 font-bold text-lg">
                  {item.otherUser?.name ? item.otherUser.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-800">{item.otherUser?.name || 'Người dùng'}</Text>
                <Text className="text-gray-500 mt-1" numberOfLines={1}>
                  {item.lastMessage?.text || 'Bắt đầu trò chuyện'}
                </Text>
              </View>
              {item.unreadCount > 0 && (
                <View className="bg-red-500 w-6 h-6 rounded-full items-center justify-center">
                  <Text className="text-white text-xs font-bold">{item.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
