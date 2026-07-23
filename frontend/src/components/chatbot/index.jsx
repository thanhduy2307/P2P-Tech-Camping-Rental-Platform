import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../configs/axios';

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Xin chào! Tôi là Trợ lý AI của EquipPeer. Hãy cho tôi biết kế hoạch hành trình của bạn (ví dụ: cắm trại 4 người ở Đà Lạt 2 ngày, hoặc cần thuê máy ảnh chụp tối) để tôi tư vấn chọn đồ phù hợp nhất nhé! 🏕️📸',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}, // user denied, just skip
        { timeout: 5000 }
      );
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = [
    'Cắm trại 2 người ở Đà Lạt 2 ngày',
    'Combo chụp ảnh sự kiện tối tốt nhất',
    'Đi trekking leo núi cần chuẩn bị gì?',
    'Thuê lều và bếp dã ngoại dưới 300k'
  ];

  const handleSend = async (textToSend) => {
    const query = textToSend || inputValue;
    if (!query.trim()) return;

    // Add user message
    setMessages(prev => [...prev, {
      sender: 'user',
      text: query,
      timestamp: new Date()
    }]);

    if (!textToSend) setInputValue('');
    setLoading(true);

    try {
      const res = await api.post('/assets/recommend', { query, ...(location || {}) });
      
      if (res.data && res.data.success) {
        const { recommendations, suggestedPlan, assets } = res.data.data;
        
        // Map asset categories for consistent rendering
        const mappedAssets = (assets || []).map(item => {
          let category = item.category || '';
          let subCategory = item.subCategory || '';
          const catLower = category.toLowerCase();
          if (['tents', 'lều'].includes(catLower)) {
            category = 'Camping';
            subCategory = 'Tents';
          } else if (['cookware', 'cooking', 'cook', 'bếp'].includes(catLower)) {
            category = 'Camping';
            subCategory = 'Cooking';
          } else if (['furniture', 'bàn ghế', 'bàn', 'ghế'].includes(catLower)) {
            category = 'Camping';
            subCategory = 'Furniture';
          } else if (['cameras', 'máy ảnh', 'camera'].includes(catLower)) {
            category = 'Tech';
            subCategory = 'Máy ảnh';
          } else if (['flycam', 'drone'].includes(catLower)) {
            category = 'Tech';
            subCategory = 'Flycam';
          }
          return { ...item, category, subCategory };
        });

        // Add AI response text
        setMessages(prev => [...prev, {
          sender: 'ai',
          text: recommendations,
          suggestedPlan,
          assets: mappedAssets,
          timestamp: new Date()
        }]);
      } else {
        setMessages(prev => [...prev, {
          sender: 'ai',
          text: 'Rất tiếc, tôi không thể xử lý yêu cầu lúc này. Vui lòng thử lại sau.',
          timestamp: new Date()
        }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: 'Có lỗi kết nối xảy ra khi liên hệ với hệ thống AI. Vui lòng kiểm tra lại kết nối mạng.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-50 font-body-md">
      {/* Chat Bubble Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 group relative border border-primary-fixed-dim"
        >
          <span className="material-symbols-outlined text-[28px] animate-pulse">forum</span>
          {/* Badge indicator */}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-secondary border-2 border-white"></span>
          </span>
        </button>
      )}

      {/* Chat Widget Panel */}
      {isOpen && (
        <div className="w-[340px] sm:w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-outline-variant/60 flex flex-col overflow-hidden animate-slideUp">
          {/* Header */}
          <div className="bg-primary text-on-primary p-4 flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-primary-fixed">
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">Trợ Lý Tư Vấn AI</h3>
                <p className="text-[10px] text-primary-fixed font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-ping"></span>
                  Trực tuyến • Sẵn sàng hỗ trợ
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-on-primary/80 hover:text-on-primary hover:bg-white/10 p-1.5 rounded-full transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50">
            {messages.map((msg, index) => (
              <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Message Bubble */}
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-primary text-on-primary rounded-tr-none' 
                    : 'bg-white border border-outline-variant/30 text-on-surface rounded-tl-none'
                }`}>
                  <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                  
                  {/* Suggested Plan / Checklist inside bubble */}
                  {msg.suggestedPlan && (
                    <div className="mt-3 pt-3 border-t border-outline-variant/30 text-xs text-on-surface-variant bg-slate-50 p-2.5 rounded-lg border">
                      <p className="font-bold flex items-center gap-1 text-primary mb-1.5">
                        <span className="material-symbols-outlined text-[16px]">fact_check</span>
                        Kế hoạch chuẩn bị đề xuất:
                      </p>
                      <p className="whitespace-pre-line leading-relaxed">{msg.suggestedPlan}</p>
                    </div>
                  )}
                </div>

                {/* Tagged assets preview if returned by AI */}
                {msg.assets && msg.assets.length > 0 && (
                  <div className="w-full mt-2 grid grid-cols-1 gap-2 pl-4">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Thiết bị phù hợp có sẵn:</p>
                    {msg.assets.map(asset => (
                      <Link 
                        key={asset._id}
                        to={`/assets/${asset._id}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container transition-all shadow-sm"
                      >
                        <div className="w-10 h-10 rounded overflow-hidden bg-slate-100 flex-shrink-0 border">
                          <img 
                            alt={asset.name} 
                            className="w-full h-full object-cover" 
                            src={asset.images && asset.images.length > 0 ? asset.images[0] : 'https://placehold.co/100?text=Gear'} 
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="text-xs font-bold text-on-surface truncate">{asset.name}</p>
                          <p className="text-[10px] text-primary font-semibold mt-0.5">
                            {asset.pricePerDay >= 1000000 
                              ? `${(asset.pricePerDay / 1000000).toFixed(1)}tr/ngày`
                              : `${(asset.pricePerDay / 1000).toFixed(0)}k/ngày`}
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-outline text-lg">chevron_right</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* AI Typing Indicator */}
            {loading && (
              <div className="flex items-center gap-2 bg-white border border-outline-variant/30 rounded-2xl px-4 py-2.5 max-w-[85%] rounded-tl-none shadow-sm">
                <span className="text-xs text-on-surface-variant font-medium">Trợ lý AI đang chọn đồ</span>
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 bg-outline rounded-full animate-bounce"></span>
                  <span className="h-1.5 w-1.5 bg-outline rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="h-1.5 w-1.5 bg-outline rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length === 1 && !loading && (
            <div className="px-4 py-2 bg-slate-50 border-t border-outline-variant/20 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
              {quickPrompts.map((p, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSend(p)}
                  className="bg-white border border-outline-variant/50 text-[11px] text-on-surface-variant hover:text-primary hover:border-primary px-3 py-1.5 rounded-full shadow-sm font-semibold transition-all active:scale-95 shrink-0"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-outline-variant/40 flex gap-2">
            <input 
              type="text"
              placeholder="Hỏi trợ lý chọn đồ dã ngoại/công nghệ..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading}
              className="flex-grow px-4 py-2.5 text-xs border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
            <button 
              onClick={() => handleSend()}
              disabled={loading || !inputValue.trim()}
              className="w-10 h-10 bg-primary text-on-primary rounded-xl flex items-center justify-center hover:bg-primary/95 shadow transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatbot;
