import Swal from 'sweetalert2';
import React, { useState, useEffect, useRef } from 'react';
import api from '../../configs/axios';

// Individual Chat Window Component
const ChatWindow = ({ userId, name, role, isMinimized, onClose, onToggleMinimize }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem('token');

  // Fetch messages
  const fetchMessages = async (silent = false) => {
    try {
      const res = await api.get(`/chats/${userId}`);
      if (res.data?.success) {
        setMessages(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch messages in floating chat:", err);
    }
  };

  // Mark as read
  const markAsRead = async () => {
    try {
      await api.put(`/chats/read/${userId}`);
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  // Initial load & mark read
  useEffect(() => {
    if (token && !isMinimized) {
      fetchMessages();
      markAsRead();
    }
  }, [userId, isMinimized]);

  // Polling messages every 3s
  useEffect(() => {
    if (!token || isMinimized) return;

    const interval = setInterval(() => {
      fetchMessages(true);
      markAsRead();
    }, 3000);

    return () => clearInterval(interval);
  }, [userId, isMinimized]);

  // Scroll to bottom
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
      };
    });
  };

  const handleSend = async (e, customImageUrl = null) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !customImageUrl) || sending) return;

    const textToSend = inputText.trim();
    if (!customImageUrl) setInputText('');
    setSending(true);

    try {
      const payload = {
        receiverId: userId,
        content: textToSend
      };
      if (customImageUrl) {
        payload.imageUrl = customImageUrl;
      }

      const res = await api.post('/chats', payload);
      if (res.data?.success) {
        setMessages(prev => [...prev, res.data.data]);
        // Trigger global conversation update if main chat page is open
        window.dispatchEvent(new CustomEvent('conversation-updated'));
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      Swal.fire("Không thể gửi tin nhắn.");
    } finally {
      setSending(false);
    }
  };

  const handleImagePick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      
      Swal.fire({
        title: 'Đang tải ảnh lên...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
      
      try {
        const compressedBase64 = await compressImage(file);
        Swal.close();
        await handleSend(null, compressedBase64);
      } catch (err) {
        console.error(err);
        Swal.fire('Lỗi', 'Không thể xử lý hình ảnh', 'error');
      }
    };
  };

  const currentStoredUser = JSON.parse(localStorage.getItem('user') || '{}');

  if (isMinimized) {
    return (
      <div 
        onClick={onToggleMinimize}
        className="w-64 bg-slate-900 text-white rounded-t-xl shadow-lg border border-slate-700 flex items-center justify-between px-3 py-2 cursor-pointer pointer-events-auto hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-slate-750 flex items-center justify-center text-teal-400 font-bold text-xs flex-shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
          <span className="font-bold text-xs truncate">{name}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-5 h-5 rounded-full hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 md:w-80 h-[380px] bg-white rounded-t-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden pointer-events-auto">
      {/* Header */}
      <div 
        onClick={onToggleMinimize}
        className="bg-slate-900 text-white px-3 py-2.5 flex justify-between items-center cursor-pointer hover:bg-slate-850 transition-colors select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-teal-400 text-xs flex-shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h5 className="font-bold text-xs truncate leading-tight">{name}</h5>
            <span className="text-[9px] text-teal-400 uppercase font-extrabold tracking-wider leading-none">
              {role === 'lender' ? 'Lender' : 'Renter'}
            </span>
          </div>
        </div>
        
        {/* Header Actions */}
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={onToggleMinimize}
            className="w-6 h-6 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title="Thu nhỏ"
          >
            <span className="material-symbols-outlined text-[16px]">minimize</span>
          </button>
          <button 
            onClick={onClose}
            className="w-6 h-6 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
            title="Đóng"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-3 overflow-y-auto bg-slate-50 space-y-3 flex flex-col">
        {messages.length === 0 ? (
          <div className="my-auto text-center text-slate-400 text-[10px]">
            <span className="material-symbols-outlined text-2xl text-slate-300">chat_bubble</span>
            <p className="mt-1">Gửi tin nhắn để bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMsgFromMe = msg.sender === currentStoredUser._id || msg.sender?._id === currentStoredUser._id;
            return (
              <div 
                key={msg._id || Math.random()} 
                className={`flex ${isMsgFromMe ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-xl px-3 py-1.5 shadow-sm text-xs leading-relaxed ${
                    isMsgFromMe 
                      ? 'bg-teal-600 text-white rounded-br-none' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                  }`}
                >
                  {msg.imageUrl && (
                    <div className="mb-1 rounded overflow-hidden">
                      <img src={msg.imageUrl} alt="Chat image" className="max-w-full max-h-40 object-contain cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.imageUrl, '_blank')} />
                    </div>
                  )}
                  {msg.content && <p className="break-words">{msg.content}</p>}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-2 border-t border-slate-100 bg-white flex items-center gap-1.5">
        <button 
          type="button"
          onClick={handleImagePick}
          disabled={sending}
          className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 flex-shrink-0"
          title="Gửi ảnh"
        >
          <span className="material-symbols-outlined text-[16px]">image</span>
        </button>
        <input 
          type="text"
          placeholder="Nhập tin nhắn..."
          className="flex-grow border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={sending}
        />
        <button 
          type="submit"
          disabled={sending || !inputText.trim()}
          className="bg-primary hover:bg-primary-container text-white p-2 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">send</span>
        </button>
      </form>
    </div>
  );
};

// Global Floating Chat Manager
const FloatingChat = () => {
  const [activeChats, setActiveChats] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const handleOpenChat = (e) => {
      if (!token) return;
      const { userId, name, role } = e.detail;
      if (!userId || !name) return;

      setActiveChats(prev => {
        // Check if chat is already open
        const exists = prev.some(c => c.userId === userId);
        if (exists) {
          // Bring to front & expand if minimized
          return prev.map(c => c.userId === userId ? { ...c, isMinimized: false } : c);
        }

        // Limit to max 3 open chats, remove first one if exceeded
        const newList = prev.filter(c => c.userId !== userId);
        if (newList.length >= 3) {
          newList.shift();
        }
        return [...newList, { userId, name, role, isMinimized: false }];
      });
    };

    window.addEventListener('open-chat', handleOpenChat);
    return () => window.removeEventListener('open-chat', handleOpenChat);
  }, [token]);

  if (!token || activeChats.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-4 z-[9999] flex items-end gap-4 pointer-events-none select-none max-w-full pb-safe pr-safe">
      {activeChats.map((chat) => (
        <ChatWindow 
          key={chat.userId}
          userId={chat.userId}
          name={chat.name}
          role={chat.role}
          isMinimized={chat.isMinimized}
          onClose={() => {
            setActiveChats(prev => prev.filter(c => c.userId !== chat.userId));
          }}
          onToggleMinimize={() => {
            setActiveChats(prev => 
              prev.map(c => c.userId === chat.userId ? { ...c, isMinimized: !c.isMinimized } : c)
            );
          }}
        />
      ))}
    </div>
  );
};

export default FloatingChat;
