import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../configs/axios';

const AssetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = localStorage.getItem('token');
  const { user } = useSelector((state) => state.auth);

  // Page state
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Image selection state
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Booking form state
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Fetch asset details
  useEffect(() => {
    const fetchAsset = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/assets/${id}`);
        if (response.data && response.data.success) {
          const item = response.data.data;
          
          // Map DB categories for visual consistency if needed
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
          } else if (['lighting', 'ánh sáng', 'đèn'].includes(catLower)) {
            category = 'Camping';
            subCategory = 'Lighting';
          } else if (['backpacks', 'balo', 'túi'].includes(catLower)) {
            category = 'Camping';
            subCategory = 'Backpacks';
          } else if (['cameras', 'máy ảnh', 'camera'].includes(catLower)) {
            category = 'Tech';
            subCategory = 'Máy ảnh';
          } else if (['flycam', 'drone'].includes(catLower)) {
            category = 'Tech';
            subCategory = 'Flycam';
          } else if (['audio', 'âm thanh', 'loa'].includes(catLower)) {
            category = 'Tech';
            subCategory = 'Máy ảnh';
          }

          setAsset({
            ...item,
            category,
            subCategory
          });
        } else {
          setError('Không thể lấy thông tin thiết bị.');
        }
      } catch (err) {
        console.error(err);
        setError('Đã xảy ra lỗi khi kết nối với máy chủ.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAsset();
    }
  }, [id]);

  // Calculate rental details
  const getRentalDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    if (diffTime <= 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const rentalDays = getRentalDays();
  const totalRent = asset ? rentalDays * asset.pricePerDay : 0;
  const originalDeposit = asset ? asset.depositAmount : 0;
  const hasReputationDiscount = user && user.reputationScore >= 4.8;
  const deposit = hasReputationDiscount ? Math.round(originalDeposit * 0.8) : originalDeposit;
  const totalAmount = totalRent + deposit;

  // Format price helper (e.g. 120,000 -> 120k, 1,200,000 -> 1.2tr)
  const formatPrice = (price) => {
    if (price >= 1000000) {
      return (price / 1000000).toFixed(1).replace(/\.0$/, '') + 'tr';
    }
    if (price >= 1000) {
      return (price / 1000).toFixed(0) + 'k';
    }
    return price.toLocaleString('vi-VN');
  };

  // Handle Booking Submit
  const handleBooking = async () => {
    if (!token) {
      alert('Vui lòng đăng nhập trước khi thuê đồ.');
      navigate('/login');
      return;
    }

    if (user && !user.isProfileCompleted) {
      setBookingError('Vui lòng hoàn thiện thông tin cá nhân (Số điện thoại và Địa chỉ) trong trang cá nhân trước khi thuê đồ.');
      return;
    }

    if (!startDate || !endDate) {
      setBookingError('Vui lòng chọn đầy đủ ngày nhận và ngày trả.');
      return;
    }

    if (rentalDays <= 0) {
      setBookingError('Ngày trả phải sau ngày nhận ít nhất 1 ngày.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      const response = await api.post('/orders', {
        assetId: asset._id,
        startDate,
        endDate
      });

      if (response.data && response.data.success) {
        const { paymentUrl } = response.data;
        if (paymentUrl) {
          // Redirect to VNPay Payment gateway
          window.location.href = paymentUrl;
        } else {
          setBookingError('Tạo đơn hàng thành công nhưng không tìm thấy link thanh toán VNPay.');
        }
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setBookingError(err.response.data.message);
      } else {
        setBookingError('Không thể tạo đơn thuê đồ. Vui lòng thử lại sau.');
      }
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-container-max mx-auto px-margin-desktop py-20 text-center font-body-md">
        <p className="text-on-surface-variant text-lg">Đang tải thông tin thiết bị...</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="max-w-container-max mx-auto px-margin-desktop py-20 text-center font-body-md">
        <p className="text-error text-lg mb-4">{error || 'Không tìm thấy thông tin thiết bị.'}</p>
        <Link to="/assets" className="text-primary font-bold hover:underline">Quay lại danh sách</Link>
      </div>
    );
  }

  // Fallback images
  const assetImages = asset.images && asset.images.length > 0 
    ? asset.images 
    : ['https://placehold.co/600x450?text=No+Image'];

  const selectedImage = assetImages[activeImageIndex] || assetImages[0];
  const isTent = asset.category?.toLowerCase() === 'camping' && asset.subCategory?.toLowerCase() === 'tents';

  return (
    <div className="bg-surface text-on-surface antialiased flex flex-col min-h-screen selection:bg-primary-container selection:text-on-primary-container font-body-md">
      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-10 pb-16">
        
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex text-on-surface-variant font-label-sm text-label-sm mb-6">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center hover:text-primary transition-colors">
              <Link to="/">Home</Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="material-symbols-outlined text-sm mx-1">chevron_right</span>
                <Link className="hover:text-primary transition-colors" to={`/assets?category=${asset.category.toLowerCase()}`}>
                  {asset.category} Gear
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <span className="material-symbols-outlined text-sm mx-1">chevron_right</span>
                <span className="hover:text-primary transition-colors">{asset.subCategory || 'General'}</span>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <span className="material-symbols-outlined text-sm mx-1">chevron_right</span>
                <span className="text-on-surface font-medium truncate max-w-[150px] sm:max-w-none">{asset.name}</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* 12-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          
          {/* Left Column: Product Imagery & Details (Span 8) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Hero Image */}
              <div className="w-full bg-surface-container rounded-xl overflow-hidden shadow-sm border border-outline-variant relative aspect-[4/3]">
                <img 
                  alt={asset.name} 
                  className="w-full h-full object-cover" 
                  src={selectedImage} 
                />
                {/* Badges Overlay */}
                {asset.status === 'verified' && (
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <span className="bg-surface-container-lowest/90 backdrop-blur text-primary font-label-sm text-label-sm px-3 py-1 rounded-full border border-primary/20 flex items-center shadow-sm font-semibold">
                      <span className="material-symbols-outlined text-sm mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      Verified Gear
                    </span>
                  </div>
                )}
              </div>
              
              {/* Thumbnails */}
              {assetImages.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {assetImages.slice(0, 3).map((imgUrl, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                        activeImageIndex === idx ? 'border-primary' : 'border-outline-variant opacity-70 hover:opacity-100 hover:border-primary'
                      }`}
                    >
                      <img className="w-full h-full object-cover" src={imgUrl} alt={`Thumbnail ${idx + 1}`} />
                    </div>
                  ))}
                  {assetImages.length > 3 && (
                    <div 
                      onClick={() => setActiveImageIndex(3)}
                      className={`aspect-square rounded-lg overflow-hidden cursor-pointer relative border-2 transition-all ${
                        activeImageIndex >= 3 ? 'border-primary' : 'border-outline-variant opacity-70 hover:opacity-100 hover:border-primary'
                      }`}
                    >
                      <img className="w-full h-full object-cover" src={assetImages[3]} alt="Thumbnail 4" />
                      {assetImages.length > 4 && (
                        <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white font-label-sm text-xs font-semibold">
                          +{assetImages.length - 3} Photos
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Product Header Info */}
            <div>
              <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2 font-extrabold">
                {asset.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-on-surface-variant font-body-md text-sm">
                <div className="flex items-center text-primary">
                  <span className="material-symbols-outlined mr-1 text-lg text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="font-bold mr-1">{asset.reputationScore || '4.8'}</span>
                  <span className="text-on-surface-variant underline cursor-pointer hover:text-primary transition-colors">(24 reviews)</span>
                </div>
                <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
                <div className="flex items-center">
                  <span className="material-symbols-outlined mr-1 text-lg">check_circle</span>
                  <span>Độ mới {asset.itemConditionRate || 95}%</span>
                </div>
                <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
                <div className="flex items-center">
                  <span className="material-symbols-outlined mr-1 text-lg">location_on</span>
                  <span>{asset.lender?.address?.province || 'Đà Lạt'}, Việt Nam</span>
                </div>
              </div>
            </div>

            {/* Detailed Description */}
            <div className="border-t border-outline-variant pt-8">
              <h2 className="font-title-md text-title-md text-on-surface mb-4 font-bold">Mô tả thiết bị</h2>
              <div className="prose prose-on-surface font-body-md text-body-md text-on-surface-variant space-y-4 leading-relaxed">
                <p>{asset.description}</p>
                
                <div className="bg-surface-container-low rounded-xl p-6 mt-6 border border-outline-variant shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                  <h3 className="font-title-md text-on-surface mb-3 flex items-center font-bold">
                    <span className="material-symbols-outlined mr-2 text-primary">info</span>
                    Thông số kỹ thuật chính
                  </h3>
                  
                  {isTent ? (
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                      <li className="flex items-center border-b border-outline-variant/50 pb-2">
                        <span className="font-semibold w-32 text-on-surface">Chất liệu:</span>
                        <span>20D Nylon Silicone Coated</span>
                      </li>
                      <li className="flex items-center border-b border-outline-variant/50 pb-2">
                        <span className="font-semibold w-32 text-on-surface">Chống nước (Fly):</span>
                        <span>PU4000mm</span>
                      </li>
                      <li className="flex items-center border-b border-outline-variant/50 pb-2">
                        <span className="font-semibold w-32 text-on-surface">Chống nước (Floor):</span>
                        <span>PU4000mm</span>
                      </li>
                      <li className="flex items-center border-b border-outline-variant/50 pb-2">
                        <span className="font-semibold w-32 text-on-surface">Khung xương:</span>
                        <span>Hợp kim nhôm 7001</span>
                      </li>
                      <li className="flex items-center pt-1 md:col-span-2">
                        <span className="font-semibold w-32 text-on-surface">Bộ phụ kiện:</span>
                        <span>Lều trong, tấm phủ che mưa, khung nhôm, cọc cắm đất, dây ghì, tấm lót footprint, túi đựng.</span>
                      </li>
                    </ul>
                  ) : (
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                      <li className="flex items-center border-b border-outline-variant/50 pb-2">
                        <span className="font-semibold w-32 text-on-surface">Tình trạng:</span>
                        <span>{asset.condition || 'Tốt'}</span>
                      </li>
                      <li className="flex items-center border-b border-outline-variant/50 pb-2">
                        <span className="font-semibold w-32 text-on-surface">Năm mua:</span>
                        <span>{asset.purchaseYear || '2024'}</span>
                      </li>
                      <li className="flex items-center border-b border-outline-variant/50 pb-2">
                        <span className="font-semibold w-32 text-on-surface">Phân loại chính:</span>
                        <span>{asset.category}</span>
                      </li>
                      <li className="flex items-center border-b border-outline-variant/50 pb-2">
                        <span className="font-semibold w-32 text-on-surface">Hình thức cọc:</span>
                        <span>{asset.depositCalculationMode === 'auto' ? 'Định giá tự động' : 'Hạn mức cố định'}</span>
                      </li>
                      {asset.originalPrice && (
                        <li className="flex items-center border-b border-outline-variant/50 pb-2 md:col-span-2">
                          <span className="font-semibold w-32 text-on-surface">Giá trị gốc:</span>
                          <span>{asset.originalPrice.toLocaleString('vi-VN')} đ</span>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Host / Trust Signals */}
            <div className="border-t border-outline-variant pt-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-surface-container border-2 border-primary overflow-hidden flex-shrink-0">
                    <img 
                      alt="Host Avatar" 
                      className="w-full h-full object-cover" 
                      src={asset.lender?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} 
                    />
                  </div>
                  <div>
                    <h3 className="font-title-md text-on-surface font-bold">Đăng bởi {asset.lender?.name || 'Thành viên đáng tin cậy'}</h3>
                    <p className="font-body-md text-on-surface-variant text-sm">
                      Tham gia {asset.lender?.createdAt ? new Date(asset.lender.createdAt).toLocaleDateString('vi-VN', {month: 'long', year: 'numeric'}) : 'May 2023'} • Super Peer
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (!token) {
                      alert('Vui lòng đăng nhập trước khi liên hệ.');
                      navigate('/login');
                      return;
                    }
                    window.dispatchEvent(new CustomEvent('open-chat', {
                      detail: {
                        userId: asset.lender?._id,
                        name: asset.lender?.name || 'Lender',
                        role: 'lender'
                      }
                    }));
                  }}
                  className="px-4 py-2 border border-outline text-on-surface font-title-md text-sm rounded-lg hover:bg-surface-container-low transition-colors font-semibold shadow-sm"
                >
                  Liên hệ
                </button>
              </div>
              <div className="mt-6 flex items-start space-x-3 bg-inverse-on-surface p-4 rounded-xl">
                <span className="material-symbols-outlined text-primary text-2xl">shield</span>
                <div>
                  <h4 className="font-bold text-on-surface text-sm">Bảo hiểm EquipPeer Protection đi kèm</h4>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    Mọi đơn thuê đều được bảo hiểm hỗ trợ đền bù thiệt hại và sự cố không mong muốn lên tới 10.000.000 đ. Rent with peace of mind.
                  </p>
                </div>
              </div>
            </div>

            {/* Map Section */}
            <div className="border-t border-outline-variant pt-8">
              <h2 className="font-title-md text-title-md text-on-surface mb-4 font-bold">Vị trí nhận đồ</h2>
              <p className="font-body-md text-on-surface-variant mb-4 text-sm">Địa chỉ chi tiết sẽ được cung cấp sau khi đơn thuê được xác nhận thanh toán thành công. Gần Hồ Tuyền Lâm.</p>
              <div className="w-full h-64 bg-surface-container rounded-xl overflow-hidden border border-outline-variant shadow-sm relative">
                <img 
                  className="w-full h-full object-cover opacity-80" 
                  alt="Pickup map"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCClhgoxT766NZFJXPO7lpZE-cLFHiqKI9Nr7CdQbm0PiCZVFHOqkp7jQQzB9lbtwrmz9422KQeXvSUj0NvhzhDv7j13UeYEozGA-hDWuIpsc6IvccROnV5eAxzwyaaJdhMy_prCrH1fXkRP6DRijo07lE2w6tXzEtH5Pz7Ymfn2AFEW_zkpGa5m_w8Htfoel5rmSnJfVVwn9TZMpF1wC5kqb4K4mR8dsNare3Gbia1hCEGdZYAAlJnD8APcLMtbMOI2TacT2_ZI9sl" 
                />
                {/* Center Pin Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-primary text-on-primary rounded-full p-3 shadow-lg transform -translate-y-4">
                    <span className="material-symbols-outlined">location_on</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Rental Sidebar (Span 4) */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-28 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 z-10 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
              
              {/* Pricing */}
              <div className="mb-6 flex items-baseline">
                <span className="font-display-lg text-display-lg text-on-surface font-extrabold">
                  {formatPrice(asset.pricePerDay)}
                </span>
                <span className="font-body-md text-on-surface-variant ml-2 text-sm">VND / ngày</span>
              </div>

              {bookingError && (
                <div className="bg-error-container text-on-error-container p-3 rounded-lg text-xs font-semibold mb-4 border border-red-200 flex flex-col gap-1">
                  <span>{bookingError}</span>
                  {bookingError.includes('trang cá nhân') && (
                    <Link to="/profile" className="underline text-primary hover:text-primary-container font-bold block mt-1">
                      Đi tới trang cá nhân ngay &rarr;
                    </Link>
                  )}
                </div>
              )}

              {/* Date Picker Simulation */}
              <div className="border border-outline-variant rounded-xl overflow-hidden flex mb-4 focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary transition-all">
                <div className="flex-1 p-3 border-r border-outline-variant cursor-pointer hover:bg-surface-container-low transition-colors relative">
                  <label className="block font-label-sm text-xs text-on-surface-variant uppercase mb-1 font-bold">Ngày nhận</label>
                  <div className="font-title-md text-on-surface flex items-center text-sm relative">
                    <span className="material-symbols-outlined text-primary mr-2 text-base">calendar_today</span>
                    <input 
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      onClick={(e) => {
                        try {
                          e.target.showPicker();
                        } catch (err) {
                          console.error('showPicker failed:', err);
                        }
                      }}
                    />
                    <span className="truncate">{startDate ? new Date(startDate).toLocaleDateString('vi-VN') : 'Chọn ngày'}</span>
                  </div>
                </div>
                
                <div className="flex-1 p-3 cursor-pointer hover:bg-surface-container-low transition-colors relative">
                  <label className="block font-label-sm text-xs text-on-surface-variant uppercase mb-1 font-bold">Ngày trả</label>
                  <div className="font-title-md text-on-surface flex items-center text-sm relative">
                    <span className="material-symbols-outlined text-secondary mr-2 text-base">event_upcoming</span>
                    <input 
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      onClick={(e) => {
                        try {
                          e.target.showPicker();
                        } catch (err) {
                          console.error('showPicker failed:', err);
                        }
                      }}
                    />
                    <span className="truncate">{endDate ? new Date(endDate).toLocaleDateString('vi-VN') : 'Chọn ngày'}</span>
                  </div>
                </div>
              </div>

              {/* Duration / Guests */}
              <div className="border border-outline-variant rounded-xl p-3 mb-6 cursor-pointer hover:bg-surface-container-low transition-colors flex justify-between items-center">
                <div>
                  <label className="block font-label-sm text-xs text-on-surface-variant uppercase mb-1 font-bold">Số lượng</label>
                  <div className="font-title-md text-on-surface text-sm font-semibold">1 Thiết bị</div>
                </div>
                <span className="material-symbols-outlined text-outline">expand_more</span>
              </div>

              {/* Summary Details */}
              {rentalDays > 0 && (
                <div className="mt-4 mb-6 pt-4 border-t border-outline-variant/50 space-y-3">
                  <div className="flex justify-between font-body-md text-sm text-on-surface-variant">
                    <span>{asset.pricePerDay.toLocaleString('vi-VN')} đ x {rentalDays} ngày</span>
                    <span>{totalRent.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between items-center font-body-md text-sm text-on-surface-variant">
                    <span className="underline cursor-pointer flex items-center gap-1">
                      Ký quỹ đặt cọc
                      <span className="material-symbols-outlined text-xs text-outline cursor-help" title="Số tiền này sẽ được hoàn trả 100% sau khi giao trả đồ thành công">help</span>
                      {hasReputationDiscount && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold ml-1.5 flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-xs">verified</span>
                          -20% Uy tín
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {hasReputationDiscount && (
                        <span className="text-xs text-on-surface-variant/50 line-through">
                          {originalDeposit.toLocaleString('vi-VN')} đ
                        </span>
                      )}
                      <span className={hasReputationDiscount ? "text-emerald-700 font-bold" : ""}>
                        {deposit.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-outline-variant/50 pt-3 flex justify-between font-title-md text-on-surface font-bold">
                    <span>Tổng tạm tính</span>
                    <span className="text-primary">{totalAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <p className="text-center font-body-md text-[10px] text-on-surface-variant mt-2 italic">
                    * Renter sẽ được hoàn lại {deposit.toLocaleString('vi-VN')} đ tiền đặt cọc sau khi kết thúc đơn hàng.
                  </p>
                </div>
              )}

              {/* CTA Action */}
              <button 
                onClick={handleBooking}
                disabled={bookingLoading}
                className="w-full bg-primary-container text-on-primary-container font-title-md text-title-md py-4 rounded-xl shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex justify-center items-center font-bold"
              >
                <span className="material-symbols-outlined mr-2">shopping_bag</span>
                {bookingLoading ? 'Đang khởi tạo...' : 'Thuê Ngay'}
              </button>

              <p className="text-center font-body-md text-xs text-on-surface-variant mt-4">
                Bạn chưa bị trừ tiền ngay. Tiền đặt cọc được đảm bảo hoàn trả.
              </p>
            </div>

            {/* Extra Contextual Badge below sidebar */}
            <div className="mt-6 flex justify-center">
              <div className="flex items-center text-on-surface-variant text-sm bg-surface-container px-4 py-2 rounded-full border border-outline-variant/50">
                <span className="material-symbols-outlined text-base mr-2 text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                Thiết bị được yêu cầu nhiều tuần này
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

export default AssetDetail;

