import Swal from 'sweetalert2';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../configs/axios';

const Blogs = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  // State variables
  const [posts, setPosts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Create post modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [myExperiencedAssets, setMyExperiencedAssets] = useState([]);
  const [productLink, setProductLink] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  // AI assistant state inside modal
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Comments toggles and inputs (keyed by post ID)
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});

  // Share post state
  const [activeSharePostId, setActiveSharePostId] = useState(null);
  const [shareText, setShareText] = useState('');

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch posts
        const postsRes = await api.get('/posts');
        if (postsRes.data && postsRes.data.success) {
          setPosts(postsRes.data.data);
        }

        // Fetch verified assets to populate tagged assets dropdown & "My Gear" sidebar
        const assetsRes = await api.get('/assets');
        if (assetsRes.data && assetsRes.data.success) {
          // Map DB categories for visual consistency
          const mapped = assetsRes.data.data.map(item => {
            const nameLower = (item.name || '').toLowerCase();
            const catLower = (item.category || '').toLowerCase();
            
            let category = 'Tech';
            if (catLower === 'camping' || ['lều', 'tent', 'bếp', 'dã ngoại', 'cắm trại', 'balo', 'túi ngủ', 'bàn', 'ghế'].some(kw => nameLower.includes(kw))) {
              category = 'Camping';
            }

            // Determine subcategory
            let subCategory = 'Khác';
            if (category === 'Camping') {
              if (['lều', 'tent', 'tăng', 'bạt', 'thảm', 'footprint', 'túi ngủ', 'đệm'].some(kw => nameLower.includes(kw))) {
                subCategory = 'Lều & Thảm dã ngoại';
              } else if (['bếp', 'nồi', 'chảo', 'stove', 'cook', 'gas', 'ấm', 'ly', 'chén', 'đĩa', 'vỉ nướng'].some(kw => nameLower.includes(kw))) {
                subCategory = 'Bếp & Dụng cụ nấu ăn';
              } else if (['bàn', 'ghế', 'table', 'chair', 'giường xếp'].some(kw => nameLower.includes(kw))) {
                subCategory = 'Bàn ghế dã ngoại';
              } else if (['đèn', 'pin', 'light', 'flashlight', 'đuốc'].some(kw => nameLower.includes(kw))) {
                subCategory = 'Đèn & Thiết bị chiếu sáng';
              } else if (['balo', 'backpack', 'túi', 'bag', 'rìu', 'dao', 'sinh tồn', 'hộp y tế'].some(kw => nameLower.includes(kw))) {
                subCategory = 'Balo & Đồ sinh tồn';
              } else {
                subCategory = 'Lều & Thảm dã ngoại';
              }
            } else {
              if (['máy ảnh', 'camera', 'lens', 'ống kính', 'gimbal', 'tripod', 'sony', 'canon', 'fuji', 'nikon'].some(kw => nameLower.includes(kw))) {
                subCategory = 'Máy ảnh & Ống kính';
              } else if (['flycam', 'drone', 'mavic', 'phantom', 'dji'].some(kw => nameLower.includes(kw))) {
                subCategory = 'Flycam & Drone';
              } else if (['loa', 'sound', 'speaker', 'tai nghe', 'headphone', 'micro', 'amp'].some(kw => nameLower.includes(kw))) {
                subCategory = 'Loa & Thiết bị âm thanh';
              } else if (['laptop', 'macbook', 'máy tính', 'pc', 'ram', 'ổ cứng', 'ssd'].some(kw => nameLower.includes(kw))) {
                subCategory = 'Laptop & Phụ kiện';
              } else if (['đèn', 'light', 'aputure', 'studio', 'softbox'].some(kw => nameLower.includes(kw))) {
                subCategory = 'Đèn Studio & Ánh sáng';
              } else {
                subCategory = 'Máy ảnh & Ống kính';
              }
            }
            return { ...item, category, subCategory };
          });
          setAssets(mapped);
        }

        // If logged in, fetch profile for user identification
        if (token) {
          try {
            const profileRes = await api.get('/auth/me');
            if (profileRes.data && profileRes.data.success) {
              setCurrentUser(profileRes.data.data);
            }
          } catch (e) {
            console.error('Failed to fetch user profile:', e);
            // Fallback parsing from token if profile API isn't direct
            const payloadBase64 = token.split('.')[1];
            if (payloadBase64) {
              const decodedPayload = JSON.parse(atob(payloadBase64));
              setCurrentUser({ _id: decodedPayload.id });
            }
          }
          // Fetch renter's orders to extract experienced assets
          try {
            const ordersRes = await api.get('/orders/my-rentals');
            if (ordersRes.data?.success) {
              const ordersList = ordersRes.data.data || [];
              const uniqueAssetsMap = {};
              ordersList.forEach(o => {
                if (o.asset && o.asset._id) {
                  uniqueAssetsMap[o.asset._id] = {
                    _id: o.asset._id,
                    name: o.asset.name,
                    category: o.asset.category,
                    images: o.asset.images
                  };
                }
              });
              setMyExperiencedAssets(Object.values(uniqueAssetsMap));
            }
          } catch (err) {
            console.error("Failed to fetch experienced assets:", err);
          }
        }
      } catch (err) {
        console.error('Error fetching blogs/posts page data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Handle Like Toggle
  const handleLike = async (postId) => {
    if (!token) {
      Swal.fire('Vui lòng đăng nhập để thích bài viết.');
      navigate('/login');
      return;
    }

    try {
      const res = await api.post(`/posts/${postId}/like`);
      if (res.data && res.data.success) {
        // Optimistically update posts state
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post._id === postId) {
              const currentUserId = currentUser?._id;
              const hasLiked = post.likes.includes(currentUserId);
              const newLikes = hasLiked
                ? post.likes.filter(id => id !== currentUserId)
                : [...post.likes, currentUserId];
              return { ...post, likes: newLikes };
            }
            return post;
          })
        );
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  // Handle Add Comment
  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault();
    if (!token) {
      Swal.fire('Vui lòng đăng nhập để bình luận.');
      navigate('/login');
      return;
    }

    const commentText = commentInputs[postId];
    if (!commentText || !commentText.trim()) return;

    try {
      const res = await api.post(`/posts/${postId}/comment`, { content: commentText });
      if (res.data && res.data.success) {
        // Update comments for this specific post
        setPosts(prevPosts =>
          prevPosts.map(post => {
            if (post._id === postId) {
              return { ...post, comments: res.data.data };
            }
            return post;
          })
        );
        // Clear input
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const handleCommentInputChange = (postId, value) => {
    setCommentInputs(prev => ({ ...prev, [postId]: value }));
  };

  // Handle Share Post
  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!activeSharePostId) return;

    try {
      const res = await api.post(`/posts/${activeSharePostId}/share`, { sharedText: shareText });
      if (res.data && res.data.success) {
        setPosts(prev => [res.data.data, ...prev]);
        setActiveSharePostId(null);
        setShareText('');
        Swal.fire('Thành công', 'Đã chia sẻ bài viết lên tường nhà bạn!', 'success');
      }
    } catch (err) {
      console.error('Failed to share post:', err);
      Swal.fire('Lỗi', 'Không thể chia sẻ bài viết.', 'error');
    }
  };

  // Handle AI Content Generation
  const handleAIGenerate = async () => {
    if (!selectedAssetId) {
      Swal.fire('Vui lòng chọn một thiết bị để viết bài PR/Review.');
      return;
    }
    
    setAiLoading(true);
    try {
      const res = await api.post('/posts/generate-ai-content', {
        assetId: selectedAssetId,
        userRequest: aiPrompt
      });

      if (res.data && res.data.success) {
        const { title: aiTitle, content: aiContent } = res.data.data;
        setTitle(aiTitle || '');
        setContent(aiContent || '');
        setShowAIPanel(false);
      } else {
        Swal.fire('Sinh nội dung AI thất bại. Vui lòng tự nhập.');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Lỗi kết nối với Gemini AI.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleImageUploadChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
      });
      setImageUrl(base64);
      setImagePreview(base64);
    } catch (err) {
      console.error("Failed to convert image to base64:", err);
      Swal.fire("Không thể đọc file ảnh.");
    }
  };

  // Handle Create Post Submit
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!token) {
      Swal.fire('Vui lòng đăng nhập trước khi đăng bài.');
      navigate('/login');
      return;
    }

    if (!title.trim() || !content.trim()) {
      setCreateError('Vui lòng nhập đầy đủ tiêu đề và nội dung.');
      return;
    }

    setCreateLoading(true);
    setCreateError('');

    try {
      const postData = {
        title,
        content,
        images: imageUrl.trim() ? [imageUrl.trim()] : [],
        taggedAssets: selectedAssetId ? [selectedAssetId] : [],
        productLink: productLink.trim() || ''
      };

      const res = await api.post('/posts', postData);
      if (res.data && res.data.success) {
        // Refresh posts list
        const updatedPostsRes = await api.get('/posts');
        if (updatedPostsRes.data && updatedPostsRes.data.success) {
          setPosts(updatedPostsRes.data.data);
        }
        // Reset form & Close modal
        setTitle('');
        setContent('');
        setImageUrl('');
        setSelectedAssetId('');
        setProductLink('');
        setImagePreview('');
        setAiPrompt('');
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setCreateError(err.response.data.message);
      } else {
        setCreateError('Không thể tạo bài đăng. Vui lòng thử lại sau.');
      }
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter py-8 grid grid-cols-1 md:grid-cols-12 gap-8">
      {/* Left Sidebar */}
      <aside className="hidden md:block md:col-span-3 space-y-8">
        {/* Trending Topics */}
        <div className="glass-panel rounded-xl p-6 bg-white border border-outline-variant/50 shadow-sm">
          <h3 className="font-title-md text-[18px] text-on-surface mb-4 flex items-center gap-2 font-bold">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
            Chủ đề thịnh hành
          </h3>
          <ul className="space-y-4">
            <li>
              <a className="group block" href="#trending">
                <span className="font-body-md text-sm text-on-surface-variant group-hover:text-primary transition-colors">#CắmTrạiCuốiTuần</span>
                <p className="font-label-sm text-[10px] text-outline mt-1">1.2k bài viết</p>
              </a>
            </li>
            <li>
              <a className="group block" href="#trending">
                <span className="font-body-md text-sm text-on-surface-variant group-hover:text-primary transition-colors">#ĐánhGiáMáyẢnh</span>
                <p className="font-label-sm text-[10px] text-outline mt-1">856 bài viết</p>
              </a>
            </li>
            <li>
              <a className="group block" href="#trending">
                <span className="font-body-md text-sm text-on-surface-variant group-hover:text-primary transition-colors">#LeoNúiChứaChan</span>
                <p className="font-label-sm text-[10px] text-outline mt-1">432 bài viết</p>
              </a>
            </li>
          </ul>
        </div>

        {/* My Gear Snippet / Curated List */}
        <div className="glass-panel rounded-xl p-6 bg-white border border-outline-variant/50 shadow-sm">
          <h3 className="font-title-md text-[18px] text-on-surface mb-4 flex items-center gap-2 font-bold">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>backpack</span>
            Thiết bị hot trên sàn
          </h3>
          <div className="space-y-3">
            {assets.slice(0, 3).map((item) => (
              <div key={item._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-container transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded bg-surface-container-high overflow-hidden flex-shrink-0 border border-outline-variant/30">
                  <img 
                    alt={item.name} 
                    className="w-full h-full object-cover" 
                    src={item.images && item.images.length > 0 ? item.images[0] : 'https://placehold.co/100?text=Gear'} 
                  />
                </div>
                <div className="overflow-hidden">
                  <p className="font-body-md text-xs font-semibold text-on-surface truncate">{item.name}</p>
                  <span className="font-label-sm text-[10px] text-primary-container px-2 py-0.5 bg-primary-container/10 rounded-full inline-block mt-1">
                    {item.pricePerDay >= 1000000 
                      ? `${(item.pricePerDay / 1000000).toFixed(1)}tr/ngày`
                      : `${(item.pricePerDay / 1000).toFixed(0)}k/ngày`}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Link to="/assets" className="mt-4 block w-full text-center font-body-md text-xs text-secondary hover:text-secondary-container transition-colors font-semibold">
            Xem tất cả đồ cho thuê
          </Link>
        </div>
      </aside>

      {/* Center Feed */}
      <section className="col-span-1 md:col-span-6 space-y-8">
        {token ? (
          /* Create Post Input */
          <div className="glass-panel rounded-xl p-4 flex gap-4 items-center bg-white border border-outline-variant shadow-sm">
            <Link to={`/user/${currentUser?._id}`} className="flex-shrink-0 relative group" title="Trang cá nhân của tôi">
              <img 
                alt="User Avatar" 
                className="w-10 h-10 rounded-full border border-outline-variant bg-surface-container object-cover group-hover:opacity-80 transition-opacity" 
                src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"} 
              />
              <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-white text-[16px]">person</span>
              </div>
            </Link>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex-1 bg-surface-bright hover:bg-surface-container text-left border border-outline-variant/60 rounded-full px-5 py-2.5 text-on-surface-variant text-sm font-medium transition-colors"
            >
              Bạn muốn chia sẻ chuyến đi nào hôm nay?
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary text-on-primary p-2.5 rounded-full hover:bg-primary/95 active:scale-95 transition-all shadow-sm flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </button>
          </div>
        ) : (
          /* Prominent sign in block for guests */
          <div className="glass-panel rounded-xl p-6 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border border-outline-variant shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
              <span className="material-symbols-outlined text-2xl">rate_review</span>
            </div>
            <div>
              <h4 className="font-title-md text-sm font-bold text-on-surface">Chia sẻ trải nghiệm của riêng bạn!</h4>
              <p className="text-xs text-on-surface-variant mt-1">Đăng nhập ngay để đăng bài viết review, tương tác thả tim và bình luận cùng cộng đồng EquipPeer.</p>
            </div>
            <Link 
              to="/login" 
              className="inline-block bg-primary text-on-primary px-6 py-2 rounded-lg text-xs font-semibold hover:bg-primary/95 shadow transition-all active:scale-95"
            >
              Đăng nhập để chia sẻ
            </Link>
          </div>
        )}

        {/* Feed Posts */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <p className="text-on-surface-variant font-medium">Đang tải bảng tin cộng đồng...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-outline-variant/50 shadow-sm">
            <span className="material-symbols-outlined text-outline text-5xl mb-3">feed</span>
            <p className="text-on-surface-variant font-medium">Chưa có bài viết nào được đăng tải.</p>
          </div>
        ) : (
          posts.map((post) => {
            const isLiked = currentUser && post.likes && post.likes.includes(currentUser._id);
            const showComments = activeCommentsPostId === post._id;
            
            // Format author details
            const authorName = post.author?.name || 'Thành viên ẩn danh';
            const authorRole = post.author?.role === 'lender' ? 'Lender' : 'Renter';
            const postDate = new Date(post.createdAt).toLocaleDateString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit'
            });

            return (
              <article key={post._id} className="feed-card rounded-xl overflow-hidden bg-white border border-outline-variant/50 shadow-sm hover:shadow-md transition-shadow">
                
                {/* Shared Post Context */}
                {post.isShared && (
                  <div className="bg-surface-container-low px-4 py-2 border-b border-outline-variant/30 text-xs text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">repeat</span>
                    <Link to={`/user/${post.author?._id}`} className="font-semibold hover:underline text-on-surface">{authorName}</Link> 
                    đã chia sẻ một bài viết.
                  </div>
                )}

                {/* Shared Text (Caption) */}
                {post.isShared && post.sharedText && (
                  <div className="px-4 pt-3 pb-1">
                    <p className="font-body-md text-sm text-on-surface whitespace-pre-line">{post.sharedText}</p>
                  </div>
                )}

                <div 
                  onClick={(e) => {
                    if (e.target.closest('a') || e.target.closest('button')) return;
                    if (post.isShared && post.originalPost?.author?._id) {
                      navigate(`/user/${post.originalPost.author._id}`);
                    }
                  }}
                  className={post.isShared ? "m-3 border border-outline-variant/30 rounded-lg overflow-hidden cursor-pointer hover:bg-surface-container-lowest transition-colors group/shared" : ""}
                >
                  {/* Header */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        alt={post.isShared ? (post.originalPost?.author?.name || 'Ẩn danh') : authorName} 
                        className="w-10 h-10 rounded-full border border-outline-variant bg-surface-container object-cover" 
                        src={(post.isShared ? post.originalPost?.author?.avatar : post.author?.avatar) || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'} 
                      />
                      <div>
                        <h4 className="font-body-md font-semibold text-on-surface flex items-center gap-1.5 text-sm">
                          <Link to={`/user/${post.isShared ? post.originalPost?.author?._id : post.author?._id}`} className="hover:underline">
                            {post.isShared ? (post.originalPost?.author?.name || 'Ẩn danh') : authorName}
                          </Link>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                            (post.isShared ? post.originalPost?.author?.role : post.author?.role) === 'lender' ? 'bg-secondary/15 text-secondary' : 'bg-primary/15 text-primary'
                          }`}>
                            {(post.isShared ? post.originalPost?.author?.role : post.author?.role) === 'lender' ? 'Lender' : 'Renter'}
                          </span>
                        </h4>
                        <p className="font-label-sm text-[10px] text-outline mt-0.5">
                          {new Date(post.isShared ? post.originalPost?.createdAt : post.createdAt).toLocaleDateString('vi-VN', {
                            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                {/* Content */}
                <div className="px-4 pb-3">
                  <h3 className="font-title-md text-base font-bold text-on-surface mb-1">{post.isShared ? post.originalPost?.title : post.title}</h3>
                  <p className="font-body-md text-on-surface-variant text-sm leading-relaxed whitespace-pre-line">
                    {post.isShared ? post.originalPost?.content : post.content}
                  </p>
                </div>

                {/* Image if any */}
                {((post.isShared ? post.originalPost?.images : post.images) || []).length > 0 && (
                  <div className="w-full aspect-[16/9] bg-surface-container-high relative overflow-hidden border-y border-outline-variant/30">
                    <img 
                      alt={post.isShared ? post.originalPost?.title : post.title} 
                      className="w-full h-full object-cover" 
                      src={(post.isShared ? post.originalPost?.images : post.images)[0]} 
                    />
                  </div>
                )}

                {/* Tagged Gear Link */}
                {(((post.isShared ? post.originalPost?.taggedAssets : post.taggedAssets) || []).length > 0 || (post.isShared ? post.originalPost?.productLink : post.productLink)) && (
                  <div className="px-4 py-3 border-b border-outline-variant/30 bg-surface-bright/50 space-y-2">
                    {(post.isShared ? post.originalPost?.taggedAssets : post.taggedAssets)?.filter(asset => asset && asset._id).map((asset) => (
                      <Link 
                        key={asset._id}
                        to={`/assets/${asset._id}`} 
                        className="flex items-center gap-3 bg-white p-2.5 rounded-lg hover:bg-surface-container transition-colors border border-outline-variant/30 shadow-sm"
                      >
                        <div className="w-10 h-10 bg-surface-container rounded overflow-hidden flex-shrink-0 border border-outline-variant/20">
                          <img 
                            alt={asset.name} 
                            className="w-full h-full object-cover" 
                            src={asset.images && asset.images.length > 0 ? asset.images[0] : 'https://placehold.co/100?text=Gear'} 
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="font-label-sm text-[9px] text-primary font-bold uppercase tracking-wider mb-0.5">Thiết bị trải nghiệm</p>
                          <p className="font-body-md text-xs font-bold text-on-surface truncate">{asset.name}</p>
                        </div>
                        <div className="flex items-center text-primary font-semibold text-xs shrink-0 bg-primary/10 px-2.5 py-1 rounded">
                          Xem đồ
                          <span className="material-symbols-outlined text-[14px] ml-0.5">chevron_right</span>
                        </div>
                      </Link>
                    ))}

                    {(post.isShared ? post.originalPost?.productLink : post.productLink) && (
                      <a 
                        href={post.isShared ? post.originalPost?.productLink : post.productLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-3 bg-white p-2.5 rounded-lg hover:bg-surface-container transition-colors border border-outline-variant/30 shadow-sm"
                      >
                        <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded flex items-center justify-center flex-shrink-0 border border-teal-100">
                          <span className="material-symbols-outlined text-xl">link</span>
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="font-label-sm text-[9px] text-teal-600 font-bold uppercase tracking-wider mb-0.5">Liên kết sản phẩm ngoài</p>
                          <p className="font-body-md text-xs font-bold text-on-surface truncate">{post.isShared ? post.originalPost?.productLink : post.productLink}</p>
                        </div>
                        <div className="flex items-center text-teal-600 font-semibold text-xs shrink-0 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                          Mở liên kết
                          <span className="material-symbols-outlined text-[14px] ml-0.5">open_in_new</span>
                        </div>
                      </a>
                    )}
                  </div>
                )}
                </div>

                {/* Actions Row */}
                <div className="px-4 py-2 flex items-center gap-6 border-b border-outline-variant/20">
                  <button 
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-error-container/30 transition-colors group ${
                      isLiked ? 'text-red-600 font-semibold' : 'text-outline hover:text-red-500'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>
                      favorite
                    </span>
                    <span className="font-body-md text-xs">{post.likes?.length || 0}</span>
                  </button>
                  <button 
                    onClick={() => setActiveCommentsPostId(showComments ? null : post._id)}
                    className={`flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-secondary/10 transition-colors text-outline hover:text-secondary ${
                      showComments ? 'text-secondary font-semibold bg-secondary/5' : ''
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      chat_bubble
                    </span>
                    <span className="font-body-md text-xs">{post.comments?.length || 0}</span>
                  </button>
                  <button 
                    onClick={() => {
                      if (!token) return Swal.fire('Bạn cần đăng nhập', 'Vui lòng đăng nhập để chia sẻ bài viết', 'info');
                      setActiveSharePostId(post._id);
                    }}
                    className={`flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-primary/10 transition-colors text-outline hover:text-primary ml-auto`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      share
                    </span>
                    <span className="font-body-md text-xs">Chia sẻ</span>
                  </button>
                </div>

                {/* Comments Expand Area */}
                {showComments && (
                  <div className="bg-surface-bright/40 p-4 space-y-4">
                    {/* Add Comment Form or Login Reminder */}
                    {token ? (
                      <form onSubmit={(e) => handleCommentSubmit(e, post._id)} className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="Viết bình luận của bạn..."
                          value={commentInputs[post._id] || ''}
                          onChange={(e) => handleCommentInputChange(post._id, e.target.value)}
                          className="flex-1 px-4 py-2 text-sm border border-outline-variant rounded-lg bg-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                        />
                        <button 
                          type="submit"
                          className="px-4 py-2 bg-secondary text-white rounded-lg text-xs font-semibold hover:bg-secondary-container transition-colors shadow-sm"
                        >
                          Gửi
                        </button>
                      </form>
                    ) : (
                      <div className="bg-surface-container/50 border border-outline-variant/30 rounded-lg p-3 text-center text-xs text-on-surface-variant font-medium">
                        Bạn cần{' '}
                        <Link to="/login" className="text-secondary font-bold hover:underline">
                          đăng nhập
                        </Link>{' '}
                        để viết bình luận bài viết này.
                      </div>
                    )}

                    {/* Comments List */}
                    <div className="space-y-3">
                      {post.comments && post.comments.length > 0 ? (
                        post.comments.map((comment, index) => (
                          <div key={index} className="flex gap-3 bg-white p-3 rounded-lg border border-outline-variant/20 shadow-sm">
                            {comment.user?.avatar ? (
                              <img src={comment.user.avatar} alt="User Avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-outline-variant/40" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0 text-sm font-bold border border-outline-variant/40">
                                {comment.user?.name ? comment.user.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline mb-1">
                                <span className="font-body-md text-xs font-bold text-on-surface flex items-center gap-1">
                                  {comment.user?.name || 'Thành viên'}
                                  <span className="text-[8px] bg-outline-variant/30 text-outline px-1 rounded font-bold uppercase">
                                    {comment.user?.role || 'renter'}
                                  </span>
                                </span>
                              </div>
                              <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-outline text-center py-2">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>

      {/* Right Sidebar */}
      <aside className="hidden md:block md:col-span-3 space-y-8">
        {/* Top Lenders */}
        <div className="glass-panel rounded-xl p-6 bg-white border border-outline-variant/50 shadow-sm">
          <h3 className="font-title-md text-[18px] text-on-surface mb-4 flex items-center gap-2 font-bold">
            <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            Top Người Cho Thuê
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-sm font-bold border border-outline-variant/40">TG</div>
                <div>
                  <p className="font-body-md text-xs font-bold text-on-surface">Tuấn Gear</p>
                  <div className="flex items-center text-secondary text-[10px]">
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="ml-1 font-semibold">4.9 (120+ chuyến)</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-sm font-bold border border-outline-variant/40">CC</div>
                <div>
                  <p className="font-body-md text-xs font-bold text-on-surface">Camping Chill</p>
                  <div className="flex items-center text-secondary text-[10px]">
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="ml-1 font-semibold">4.8 (85 chuyến)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to action ad card */}
        <div className="rounded-xl overflow-hidden relative shadow-sm border border-outline-variant/30 h-48 group">
          <img 
            alt="Adventure call" 
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            src="https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=600&q=80" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4 z-10">
            <h4 className="font-title-md text-sm font-bold text-white mb-1">Cuối tuần này đi đâu?</h4>
            <p className="font-body-md text-[11px] text-surface-container-high/90 mb-3 line-clamp-2">Khám phá các thiết bị cắm trại đang có sẵn quanh bạn.</p>
            <Link to="/assets" className="bg-primary text-on-primary py-1.5 px-3 rounded text-xs w-max hover:bg-primary/95 transition-all font-semibold active:scale-95 shadow">
              Tìm đồ ngay
            </Link>
          </div>
        </div>
      </aside>

      {/* CREATE POST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-outline-variant/30 relative flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-bright">
              <h3 className="font-title-md text-base font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary">rate_review</span>
                Tạo bài viết chia sẻ trải nghiệm
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreatePost} className="p-6 space-y-4 flex-grow overflow-y-auto">
              {createError && (
                <div className="p-3 rounded-lg text-xs font-semibold bg-error-container text-on-error-container border border-red-200">
                  {createError}
                </div>
              )}

              {/* Tag Asset Selector */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <label className="text-xs font-bold text-on-surface block">Gắn thẻ thiết bị liên quan</label>
                
                <div className="space-y-2.5">
                  {/* Option 1: Experienced assets */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 block">Thiết bị bạn đã thuê thực tế</span>
                    <select 
                      value={selectedAssetId && myExperiencedAssets.some(a => a._id === selectedAssetId) ? selectedAssetId : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedAssetId(val);
                        if (val) setProductLink('');
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-outline-variant rounded-lg focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary cursor-pointer"
                    >
                      <option value="">-- Chọn thiết bị bạn đã từng thuê --</option>
                      {myExperiencedAssets.map(asset => (
                        <option key={asset._id} value={asset._id}>
                          {asset.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Option 2: General assets */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 block">Hoặc chọn từ tất cả thiết bị trên sàn</span>
                    <select 
                      value={selectedAssetId && !myExperiencedAssets.some(a => a._id === selectedAssetId) ? selectedAssetId : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedAssetId(val);
                        if (val) setProductLink('');
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-outline-variant rounded-lg focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary cursor-pointer"
                    >
                      <option value="">-- Chọn thiết bị khác trên hệ thống --</option>
                      {assets.map(asset => (
                        <option key={asset._id} value={asset._id}>
                          [{asset.category}] {asset.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-2 my-2 text-outline-variant">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Hoặc</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  {/* Option 3: External Link */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 block">Liên kết sản phẩm bên ngoài (Link)</span>
                    <input 
                      type="url"
                      placeholder="Nhập đường dẫn sản phẩm, ví dụ: https://decathlon.vn/san-pham/leu-cam-trai..."
                      value={productLink}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProductLink(val);
                        if (val) setSelectedAssetId('');
                      }}
                      className="w-full px-3 py-2 text-xs border border-outline-variant rounded-lg bg-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                    />
                  </div>
                </div>
                
                <p className="text-[9px] text-outline leading-tight">
                  Chọn 1 trong các cách trên để cung cấp thông tin sản phẩm giúp bài viết chia sẻ chất lượng hơn.
                </p>
              </div>

              {/* AI helper button */}
              {selectedAssetId && (
                <div className="bg-secondary/5 rounded-lg border border-secondary/15 p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-secondary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] animate-pulse">auto_awesome</span>
                      Trợ lý viết bài bằng Gemini AI
                    </span>
                    <button 
                      type="button"
                      onClick={() => setShowAIPanel(!showAIPanel)}
                      className="text-xs text-secondary hover:underline font-semibold"
                    >
                      {showAIPanel ? 'Đóng panel AI' : 'Mở panel AI'}
                    </button>
                  </div>

                  {showAIPanel && (
                    <div className="space-y-2 pt-2 border-t border-secondary/10">
                      <input 
                        type="text"
                        placeholder="Ví dụ: chuyến đi săn mây Đà Lạt cực lạnh, lều ấm lắm..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-outline-variant rounded bg-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                      />
                      <button 
                        type="button"
                        disabled={aiLoading}
                        onClick={handleAIGenerate}
                        className="w-full flex justify-center items-center gap-1 py-1.5 px-3 bg-secondary text-white rounded text-xs font-bold hover:bg-secondary-container transition-all disabled:opacity-50"
                      >
                        {aiLoading ? 'Đang viết bài...' : 'Tự động tạo nội dung PR ✨'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Post Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface block" htmlFor="post-title">Tiêu đề bài viết</label>
                <input 
                  id="post-title"
                  type="text"
                  placeholder="Nhập tiêu đề cuốn hút..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-outline-variant rounded-lg bg-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                  required
                />
              </div>

              {/* Post Content */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface block" htmlFor="post-content">Nội dung review</label>
                <textarea 
                  id="post-content"
                  rows="4"
                  placeholder="Chia sẻ trải nghiệm chi tiết về hành trình của bạn..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-outline-variant rounded-lg bg-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary font-body-md"
                  required
                ></textarea>
              </div>

              {/* Image Upload and URL Input */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <label className="text-xs font-bold text-on-surface block">Hình ảnh bài viết</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* File Upload Block */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 block">Tải ảnh lên từ máy</span>
                    <div 
                      onClick={() => document.getElementById('post-image-file').click()}
                      className="border border-slate-200 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 hover:bg-teal-50/10 transition-all bg-white h-24 relative overflow-hidden"
                    >
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="h-full w-full object-contain" />
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-slate-400 text-2xl">add_photo_alternate</span>
                          <span className="text-[10px] text-slate-400 font-semibold mt-1">Nhấn để chọn ảnh</span>
                        </>
                      )}
                      <input 
                        id="post-image-file" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUploadChange}
                      />
                    </div>
                    {imagePreview && (
                      <button 
                        type="button"
                        onClick={() => {
                          setImageUrl('');
                          setImagePreview('');
                        }}
                        className="text-[10px] text-red-500 font-bold hover:underline"
                      >
                        Xóa ảnh đã chọn
                      </button>
                    )}
                  </div>

                  {/* URL Input Block */}
                  <div className="space-y-1 flex flex-col justify-end">
                    <span className="text-[11px] font-semibold text-slate-500 block">Hoặc dán URL hình ảnh</span>
                    <input 
                      id="post-image"
                      type="url"
                      placeholder="https://vidu.com/anh.jpg"
                      value={imageUrl.startsWith('data:') ? '' : imageUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setImageUrl(val);
                        setImagePreview(''); // clear file preview if typing URL
                      }}
                      className="w-full px-3 py-2 text-xs border border-outline-variant rounded-lg bg-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary mt-auto"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/20">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-semibold hover:bg-surface-container transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:bg-primary/95 transition-all shadow-sm disabled:opacity-50"
                >
                  {createLoading ? 'Đang đăng bài...' : 'Đăng bài viết'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {activeSharePostId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-outline-variant/30 relative flex flex-col">
            <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-bright">
              <h3 className="font-title-md text-base font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary">share</span>
                Chia sẻ bài viết
              </h3>
              <button 
                onClick={() => { setActiveSharePostId(null); setShareText(''); }}
                className="text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleShareSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-on-surface block mb-2">Thêm cảm nghĩ của bạn (Tùy chọn)</label>
                <textarea 
                  value={shareText}
                  onChange={(e) => setShareText(e.target.value)}
                  placeholder="Hãy nói gì đó về bài viết này..."
                  className="w-full px-4 py-3 text-sm border border-outline-variant rounded-xl focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary min-h-[100px] resize-none bg-surface-container-lowest"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => { setActiveSharePostId(null); setShareText(''); }}
                  className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-semibold hover:bg-surface-container transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:bg-primary/95 transition-all shadow-sm"
                >
                  Chia sẻ ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blogs;
