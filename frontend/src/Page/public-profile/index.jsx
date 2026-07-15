import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../configs/axios';
import Swal from 'sweetalert2';

const PublicProfile = () => {
  const { id } = useParams();
  const { user: currentUser } = useSelector(state => state.auth);
  
  const [userProfile, setUserProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // States for interactive feed
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [activeSharePostId, setActiveSharePostId] = useState(null);
  const [shareText, setShareText] = useState('');

  // States for editing profile
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', coverImage: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProfileAndPosts = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch public profile
        const profileRes = await api.get(`/auth/users/${id}/profile`);
        if (profileRes.data && profileRes.data.success) {
          setUserProfile(profileRes.data.data);
        }

        // Fetch user posts
        const postsRes = await api.get(`/posts/user/${id}`);
        if (postsRes.data && postsRes.data.success) {
          setPosts(postsRes.data.data);
        }
      } catch (err) {
        console.error(err);
        setError('Không thể tải thông tin trang cá nhân.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProfileAndPosts();
  }, [id]);

  const handleLike = async (postId) => {
    if (!token) return Swal.fire('Bạn cần đăng nhập', 'Vui lòng đăng nhập để thích bài viết', 'info');
    try {
      const res = await api.post(`/posts/${postId}/like`);
      if (res.data && res.data.success) {
        setPosts(prev => 
          prev.map(post => {
            if (post._id === postId) {
              const likes = [...post.likes];
              if (res.data.isLiked) likes.push(currentUser._id);
              else {
                const index = likes.indexOf(currentUser._id);
                if (index > -1) likes.splice(index, 1);
              }
              return { ...post, likes };
            }
            return post;
          })
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault();
    if (!token) return Swal.fire('Bạn cần đăng nhập', 'Vui lòng đăng nhập để bình luận', 'info');
    
    const content = commentInputs[postId];
    if (!content || !content.trim()) return;

    try {
      const res = await api.post(`/posts/${postId}/comment`, { content });
      if (res.data && res.data.success) {
        setPosts(prev => 
          prev.map(post => {
            if (post._id === postId) {
              return { ...post, comments: res.data.data };
            }
            return post;
          })
        );
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!activeSharePostId) return;

    try {
      const res = await api.post(`/posts/${activeSharePostId}/share`, { sharedText: shareText });
      if (res.data && res.data.success) {
        if (currentUser && currentUser._id === id) {
          setPosts(prev => [res.data.data, ...prev]);
        }
        setActiveSharePostId(null);
        setShareText('');
        Swal.fire('Thành công', 'Đã chia sẻ bài viết lên tường nhà bạn!', 'success');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Lỗi', 'Không thể chia sẻ bài viết.', 'error');
    }
  };

  const openEditModal = () => {
    setEditForm({
      name: userProfile.name || '',
      bio: userProfile.bio || '',
      coverImage: userProfile.coverImage || ''
    });
    setIsEditingProfile(true);
  };

  const handleCoverImageUploadChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
      });
      setEditForm({ ...editForm, coverImage: base64 });
    } catch (err) {
      console.error("Failed to convert image to base64:", err);
      Swal.fire("Không thể đọc file ảnh.", "", "error");
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await api.put('/auth/users/profile', editForm);
      if (res.data && res.data.success) {
        setUserProfile(prev => ({
          ...prev,
          name: res.data.data.name,
          bio: res.data.data.bio,
          coverImage: res.data.data.coverImage
        }));
        setIsEditingProfile(false);
        Swal.fire('Thành công', 'Cập nhật thông tin thành công!', 'success');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Lỗi', 'Không thể cập nhật thông tin.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-on-surface-variant font-medium">Đang tải trang cá nhân...</p>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-error text-5xl mb-4">error</span>
        <h2 className="text-xl font-bold text-on-surface">Không tìm thấy người dùng</h2>
        <p className="text-on-surface-variant mt-2 text-sm">{error}</p>
        <Link to="/blogs" className="mt-6 text-primary hover:underline font-medium text-sm">Quay lại trang cộng đồng</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden mb-8">
        <div className="h-48 bg-gradient-to-r from-primary/80 to-secondary/80 relative" style={userProfile.coverImage ? { backgroundImage: `url(${userProfile.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
          <div className="absolute -bottom-16 left-8 flex items-end gap-4">
            <div className="w-32 h-32 rounded-full border-4 border-white bg-surface-container overflow-hidden shadow-lg">
              <img 
                src={userProfile.avatar || (userProfile.role === 'lender' 
                  ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' 
                  : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80')} 
                alt={userProfile.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mb-4 text-white drop-shadow-md">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                {userProfile.name}
                {userProfile.role === 'lender' && <span className="material-symbols-outlined text-yellow-400 text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>}
              </h1>
              <p className="text-sm font-medium opacity-90 uppercase tracking-wider">{userProfile.role}</p>
            </div>
          </div>
        </div>
        <div className="pt-20 px-8 pb-6 flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-sm text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              Tham gia: {new Date(userProfile.createdAt).toLocaleDateString('vi-VN')}
            </p>
            {userProfile.role === 'lender' && (
              <p className="text-sm text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">star</span>
                Uy tín: <strong className="text-on-surface">{userProfile.reputationScore}/100</strong>
              </p>
            )}
          </div>
          {currentUser && currentUser._id === id && (
            <button 
              onClick={openEditModal}
              className="flex items-center gap-1.5 px-4 py-2 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Chỉnh sửa thông tin
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Info Sidebar */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-outline-variant/30 p-5">
            <h3 className="font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">info</span>
              Giới thiệu
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
              {userProfile.bio || `Xin chào! Đây là trang cá nhân của ${userProfile.name}. Rất vui được chia sẻ những trải nghiệm thiết bị với cộng đồng!`}
            </p>
          </div>
        </div>

        {/* Timeline Feed */}
        <div className="md:col-span-8 space-y-6">
          <h2 className="text-lg font-bold text-on-surface mb-4">Bài viết & Hoạt động</h2>
          
          {posts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-outline-variant/50 shadow-sm">
              <span className="material-symbols-outlined text-outline text-5xl mb-3">sentiment_dissatisfied</span>
              <p className="text-on-surface-variant font-medium">Người dùng này chưa có hoạt động nào.</p>
            </div>
          ) : (
            posts.map((post) => {
              const isLiked = currentUser && post.likes && post.likes.includes(currentUser._id);
              const showComments = activeCommentsPostId === post._id;
              
              const authorName = post.author?.name || 'Thành viên ẩn danh';

              return (
                <article key={post._id} className="feed-card rounded-xl overflow-hidden bg-white border border-outline-variant/50 shadow-sm">
                  {/* Shared Post Context */}
                  {post.isShared && (
                    <div className="bg-surface-container-low px-4 py-2 border-b border-outline-variant/30 text-xs text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">repeat</span>
                      <span className="font-semibold text-on-surface">{authorName}</span> 
                      đã chia sẻ một bài viết.
                    </div>
                  )}

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

                  {/* Comments */}
                  {showComments && (
                    <div className="bg-surface-bright/40 p-4 space-y-4">
                      {token && (
                        <form onSubmit={(e) => handleCommentSubmit(e, post._id)} className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="Viết bình luận..."
                            value={commentInputs[post._id] || ''}
                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                            className="flex-1 px-4 py-2 text-sm border border-outline-variant rounded-lg focus:outline-none focus:border-secondary"
                          />
                          <button type="submit" disabled={!commentInputs[post._id]?.trim()} className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/95 disabled:opacity-50">
                            Gửi
                          </button>
                        </form>
                      )}
                      
                      <div className="space-y-3">
                        {post.comments && post.comments.length > 0 ? (
                          post.comments.slice().reverse().map(comment => (
                            <div key={comment._id} className="flex gap-2">
                              <img src={comment.user?.avatar || 'https://placehold.co/40'} alt={comment.user?.name} className="w-8 h-8 rounded-full bg-surface-container object-cover" />
                              <div className="flex-1 bg-white p-2.5 rounded-lg border border-outline-variant/30 text-sm">
                                <div className="flex items-baseline justify-between mb-0.5">
                                  <Link to={`/user/${comment.user?._id}`} className="font-bold text-on-surface hover:underline">{comment.user?.name || 'Ẩn danh'}</Link>
                                  <span className="text-[9px] text-outline">{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <p className="text-on-surface-variant break-words">{comment.content}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-xs text-outline py-2">Chưa có bình luận nào.</p>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>

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

      {/* EDIT PROFILE MODAL */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-outline-variant/30 relative flex flex-col">
            <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-bright">
              <h3 className="font-title-md text-base font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary">edit</span>
                Chỉnh sửa thông tin
              </h3>
              <button 
                onClick={() => setIsEditingProfile(false)}
                className="text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-on-surface block mb-2">Tên hiển thị</label>
                <input 
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Tên của bạn"
                  className="w-full px-4 py-2 text-sm border border-outline-variant rounded-lg focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary bg-surface-container-lowest"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-2">Giới thiệu bản thân (Bio)</label>
                <textarea 
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Hãy giới thiệu một chút về bạn..."
                  className="w-full px-4 py-3 text-sm border border-outline-variant rounded-lg focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary min-h-[80px] resize-none bg-surface-container-lowest"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-2">Ảnh bìa (Cover Image)</label>
                <div className="flex items-center gap-4">
                  {editForm.coverImage && (
                    <div className="w-24 h-16 rounded overflow-hidden border border-outline-variant/30 flex-shrink-0">
                      <img src={editForm.coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-outline-variant rounded-xl cursor-pointer hover:bg-surface-container-low transition-colors bg-surface-container-lowest text-sm text-on-surface-variant hover:text-primary hover:border-primary/50">
                      <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                      <span>{editForm.coverImage ? 'Thay đổi ảnh bìa' : 'Tải ảnh lên từ máy tính'}</span>
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={handleCoverImageUploadChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-semibold hover:bg-surface-container transition-colors disabled:opacity-50"
                  disabled={isSavingProfile}
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:bg-primary/95 transition-all shadow-sm disabled:opacity-50"
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicProfile;
