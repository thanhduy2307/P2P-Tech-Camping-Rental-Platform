import Swal from 'sweetalert2';
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../configs/axios';

const Chat = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const targetUserId = searchParams.get('userId');
  const token = localStorage.getItem('token');

  // Conversations list
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);

  // Active chat details
  const [activeUser, setActiveUser] = useState(null); // The other user object: { _id, name, role }
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // 1. Fetch Conversations List
  const fetchConversations = async (silent = false) => {
    if (!silent) setLoadingConversations(true);
    try {
      const response = await api.get('/chats/conversations');
      if (response.data?.success) {
        let list = response.data.data || [];
        
        // If there's a targetUserId query param, check if it's already in the conversation list
        if (targetUserId) {
          const exists = list.some(c => c.user._id === targetUserId);
          
          if (!exists) {
            // Target user is not in the list yet, fetch their public profile
            try {
              const profileRes = await api.get(`/auth/users/${targetUserId}/profile`);
              if (profileRes.data?.success) {
                const targetProfile = profileRes.data.data;
                // Add a temporary mock conversation at the top
                const tempConv = {
                  user: {
                    _id: targetProfile._id,
                    name: targetProfile.name,
                    role: targetProfile.role
                  },
                  lastMessage: {
                    content: 'Bắt đầu cuộc hội thoại mới...',
                    createdAt: new Date().toISOString()
                  },
                  unreadCount: 0,
                  isTemp: true
                };
                list = [tempConv, ...list];
              }
            } catch (err) {
              console.error("Failed to fetch target user profile:", err);
            }
          }
        }
        
        setConversations(list);

        // Auto-select active user based on targetUserId or select first conversation if none selected yet
        if (targetUserId) {
          const activeConv = list.find(c => c.user._id === targetUserId);
          if (activeConv) {
            setActiveUser(activeConv.user);
          }
        } else if (list.length > 0 && !silent && !activeUser) {
          setActiveUser(list[0].user);
        }
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      if (!silent) setLoadingConversations(false);
    }
  };

  // 2. Fetch Message History for selected user
  const fetchMessages = async (userId, silent = false) => {
    if (!userId) return;
    if (!silent) setLoadingMessages(true);
    try {
      const response = await api.get(`/chats/${userId}`);
      if (response.data?.success) {
        setMessages(response.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  // 3. Mark messages as read
  const markConversationAsRead = async (userId) => {
    try {
      await api.put(`/chats/read/${userId}`);
      // Update local unread count
      setConversations(prev => 
        prev.map(c => c.user._id === userId ? { ...c, unreadCount: 0 } : c)
      );
    } catch (err) {
      console.error("Failed to mark messages as read:", err);
    }
  };

  // Initial load
  useEffect(() => {
    if (token) {
      fetchConversations();
    }
  }, [token, targetUserId]);

  // Load messages when active user changes
  useEffect(() => {
    if (activeUser) {
      fetchMessages(activeUser._id);
      markConversationAsRead(activeUser._id);
    } else {
      setMessages([]);
    }
  }, [activeUser]);

  // 4. Polling for real-time update simulator (every 3 seconds)
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      fetchConversations(true);
      if (activeUser) {
        fetchMessages(activeUser._id, true);
        markConversationAsRead(activeUser._id);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [token, activeUser]);

  // Sync conversation list if updated from other components (like floating chat)
  useEffect(() => {
    const handleSync = () => {
      fetchConversations(true);
      if (activeUser) {
        fetchMessages(activeUser._id, true);
      }
    };
    window.addEventListener('conversation-updated', handleSync);
    return () => window.removeEventListener('conversation-updated', handleSync);
  }, [token, activeUser]);

  // 5. Send message
  const handleSendMessage = async (e, customImageUrl = null) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !customImageUrl) || !activeUser || sending) return;

    setSending(true);
    const textToSend = inputText.trim();
    if (!customImageUrl) setInputText('');

    try {
      const payload = {
        receiverId: activeUser._id,
        content: textToSend
      };
      if (customImageUrl) {
        payload.imageUrl = customImageUrl;
      }

      const response = await api.post('/chats', payload);

      if (response.data?.success) {
        const newMsg = response.data.data;
        setMessages(prev => [...prev, newMsg]);

        // Remove temporary conversation status if it was active
        setConversations(prev => 
          prev.map(c => c.user._id === activeUser._id 
            ? { ...c, lastMessage: newMsg, isTemp: false } 
            : c
          )
        );

        // If targetUserId URL parameter is still present, clear it to prevent re-adding temp conversation
        if (targetUserId) {
          setSearchParams({ userId: activeUser._id });
        }
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      Swal.fire("Không thể gửi tin nhắn. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  };

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
        await handleSendMessage(null, compressedBase64);
      } catch (err) {
        console.error(err);
        Swal.fire('Lỗi', 'Không thể xử lý hình ảnh', 'error');
      }
    };
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl shadow-md text-center">
        <span className="material-symbols-outlined text-5xl text-outline mb-4">lock</span>
        <h2 className="text-xl font-bold mb-2">Vui lòng đăng nhập</h2>
        <p className="text-on-surface-variant text-sm mb-6">Bạn cần đăng nhập tài khoản để truy cập hộp thư nhắn tin.</p>
        <Link to="/login" className="bg-primary text-white px-6 py-2.5 rounded-lg shadow-sm hover:opacity-95 font-semibold transition-all">Đăng nhập ngay</Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 text-slate-800 antialiased h-[calc(100vh-72px)] flex flex-col overflow-hidden">
      <div className="max-w-container-max w-full mx-auto px-4 md:px-6 py-4 md:py-6 flex gap-4 md:gap-6 flex-grow min-h-0 h-full overflow-hidden pb-6">
        
        {/* Left Side: Conversations list (Width 1/3) */}
        <div className={`w-full md:w-80 lg:w-96 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden flex-shrink-0 h-full min-h-0 ${
          activeUser ? 'hidden md:flex' : 'flex'
        }`}>
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary">chat_bubble</span>
              Hộp thư trò chuyện
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingConversations && conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <span className="material-symbols-outlined animate-spin text-2xl text-slate-300">autorenew</span>
                <p className="text-xs mt-2">Đang tải hộp thư...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <span className="material-symbols-outlined text-4xl text-slate-350">forum</span>
                <p className="text-xs font-semibold">Chưa có cuộc trò chuyện nào.</p>
                <p className="text-[10px] text-slate-400/80">Nhấn nút 'Liên hệ' ở tin đăng bất kỳ để bắt đầu chat.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = activeUser && activeUser._id === conv.user._id;
                const initials = conv.user.name ? conv.user.name.charAt(0).toUpperCase() : 'U';
                const roleBadgeColor = conv.user.role === 'lender' ? 'bg-secondary/15 text-secondary border-secondary/20' : 'bg-primary/10 text-primary border-primary/20';

                return (
                  <div 
                    key={conv.user._id}
                    onClick={() => setActiveUser(conv.user)}
                    className={`p-4 flex items-start gap-3 cursor-pointer transition-colors relative hover:bg-slate-50/50 ${
                      isActive ? 'bg-slate-50 border-r-4 border-primary' : ''
                    }`}
                  >
                    {/* User Avatar Representation */}
                    {conv.user.avatar ? (
                      <img src={conv.user.avatar} alt="User Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm flex-shrink-0">
                        {initials}
                      </div>
                    )}

                    {/* Content Details */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-slate-800 text-sm truncate">{conv.user.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${roleBadgeColor} uppercase tracking-wider scale-90`}>
                          {conv.user.role === 'lender' ? 'Lender' : 'Renter'}
                        </span>
                      </div>
                      <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                        {conv.lastMessage?.content || ''}
                      </p>
                      <span className="block text-[9px] text-slate-350 mt-1">
                        {conv.lastMessage?.createdAt ? new Date(conv.lastMessage.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>

                    {/* Unread Message Badge */}
                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-red-500 text-white font-extrabold text-[10px] flex items-center justify-center shadow-sm flex-shrink-0 absolute right-4 bottom-4">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Chat Message history & input */}
        <div className={`flex-grow bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden h-full min-h-0 ${
          !activeUser ? 'hidden md:flex' : 'flex'
        }`}>
          {activeUser ? (
            <>
              {/* Header */}
              <div className="px-4 md:px-6 py-3 md:py-4 bg-slate-900 text-white flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setActiveUser(null);
                    if (targetUserId) {
                      setSearchParams({});
                    }
                  }}
                  className="md:hidden w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white mr-1 transition-colors flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                </button>
                {activeUser.avatar ? (
                  <img src={activeUser.avatar} alt="User Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-700 flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-teal-400 flex-shrink-0">
                    {activeUser.name ? activeUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm text-slate-100">{activeUser.name}</h4>
                  <span className="text-[9px] font-extrabold text-teal-400 uppercase tracking-widest">
                    Đang trò chuyện với {activeUser.role === 'lender' ? 'Người cho thuê' : 'Người đi thuê'}
                  </span>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 p-6 overflow-y-auto bg-slate-50/35 space-y-4 min-h-[350px]">
                {loadingMessages && messages.length === 0 ? (
                  <div className="py-20 text-center text-slate-400">
                    <span className="material-symbols-outlined animate-spin text-2xl text-slate-300">autorenew</span>
                    <p className="text-xs mt-1">Đang tải tin nhắn...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-20 text-center text-slate-400/80">
                    <span className="material-symbols-outlined text-4xl text-slate-300">waving_hand</span>
                    <p className="text-xs font-semibold mt-2">Nói xin chào để bắt đầu cuộc trò chuyện!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender.toString() === localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user'))._id === msg.sender : false;
                    // Fallback to match local user ID check
                    const currentStoredUser = JSON.parse(localStorage.getItem('user') || '{}');
                    const isMsgFromMe = msg.sender === currentStoredUser._id || msg.sender?._id === currentStoredUser._id;

                    return (
                      <div 
                        key={msg._id || Math.random()} 
                        className={`flex ${isMsgFromMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm text-sm leading-relaxed ${
                            isMsgFromMe 
                              ? 'bg-teal-600 text-white rounded-br-none' 
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                          }`}
                        >
                          {msg.imageUrl && (
                            <div className="mb-2 rounded overflow-hidden">
                              <img src={msg.imageUrl} alt="Chat image" className="max-w-full max-h-60 object-contain cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.imageUrl, '_blank')} />
                            </div>
                          )}
                          {msg.content && <p className="break-words">{msg.content}</p>}
                          <span 
                            className={`block text-[9px] mt-1.5 text-right ${
                              isMsgFromMe ? 'text-teal-200/90' : 'text-slate-400'
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-150 bg-white flex items-center gap-3">
                <button 
                  type="button"
                  onClick={handleImagePick}
                  disabled={sending}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-3 rounded-xl shadow-sm transition-colors flex items-center justify-center disabled:opacity-50"
                  title="Gửi ảnh"
                >
                  <span className="material-symbols-outlined text-[20px]">image</span>
                </button>
                <input 
                  type="text"
                  placeholder="Nhập nội dung tin nhắn..."
                  className="flex-grow border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={sending}
                />
                <button 
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  className="bg-primary hover:bg-primary-container text-white p-3 rounded-xl shadow transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-12 text-slate-400/80 text-center select-none bg-slate-50/10">
              <span className="material-symbols-outlined text-6xl text-slate-300">chat</span>
              <h3 className="font-bold text-slate-800 text-lg mt-4">Chưa chọn hội thoại</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                Vui lòng chọn một người dùng từ danh sách ở cột bên trái hoặc nhấp liên hệ từ trang sản phẩm/đơn hàng để gửi tin nhắn trao đổi trực tiếp.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Chat;
