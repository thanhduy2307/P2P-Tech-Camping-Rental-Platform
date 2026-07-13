import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import api from '../../configs/axios';

export default function ChatDetailScreen({ route }) {
  const { chatId, recipientName } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  
  // Note: chatId here is usually the recipient's userId in this schema according to chatRoutes
  // Backend chat route is GET /chat/:userId

  useEffect(() => {
    fetchMessages();
  }, [chatId]);

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/chat/${chatId}`);
      setMessages(response.data.messages || response.data || []);
      // Mark as read
      await api.put(`/chat/read/${chatId}`);
    } catch (error) {
      console.log('Fetch messages error:', error);
    }
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    try {
      const newMsg = { receiverId: chatId, message: text };
      // Optimistic update
      setMessages([...messages, { _id: Date.now().toString(), text, senderId: 'me', createdAt: new Date() }]);
      setText('');
      
      await api.post('/chat', newMsg);
      fetchMessages(); // refresh from server
    } catch (error) {
      console.log('Send message error:', error);
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-gray-50" 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View className="p-4 bg-white shadow-sm flex-row items-center">
        <Text className="text-xl font-bold text-gray-800">{recipientName || 'Người dùng'}</Text>
      </View>

      <FlatList 
        data={messages}
        keyExtractor={item => item._id}
        inverted={false}
        contentContainerStyle={{ padding: 10 }}
        renderItem={({ item }) => (
          <View className={`mb-3 max-w-[80%] rounded-2xl p-3 ${
            item.senderId === 'me' || item.isMine ? 'bg-blue-600 self-end rounded-tr-none' : 'bg-white self-start rounded-tl-none'
          }`}>
            <Text className={item.senderId === 'me' || item.isMine ? 'text-white' : 'text-gray-800'}>
              {item.text || item.message}
            </Text>
          </View>
        )}
      />

      <View className="flex-row items-center p-3 bg-white border-t border-gray-200">
        <TextInput
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2"
          placeholder="Nhập tin nhắn..."
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity 
          className="bg-blue-600 w-10 h-10 rounded-full items-center justify-center"
          onPress={sendMessage}
        >
          <Text className="text-white font-bold">Gửi</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
