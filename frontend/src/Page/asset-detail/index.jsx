import Swal from 'sweetalert2';
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
  const [depositMethod, setDepositMethod] = useState('online');

  // Fetch asset details
  useEffect(() => {
    const fetchAsset = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/assets/${id}?_t=${Date.now()}`);
        if (response.data && response.data.success) {
          const item = response.data.data;
          
          // Map DB categories for visual consistency if needed
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
  const totalAmount = depositMethod === 'cash' ? totalRent : (totalRent + deposit);

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
      Swal.fire('Vui lòng đăng nhập trước khi thuê đồ.');
      navigate('/login');
      return;
    }

    if (user && !user.isProfileCompleted) {
      setBookingError('Vui lòng hoàn thiện thông tin cá nhân (Số điện thoại và Địa chỉ) trong trang cá nhân trước khi thuê đồ.');
      return;
    }

    if (user && user.renterStatus !== 'approved' && user.lenderStatus !== 'approved') {
      let errorMsg = 'Vui lòng xác thực hình ảnh CCCD (eKYC Renter) trước khi thực hiện đặt thuê thiết bị.';
      if (user.renterStatus === 'pending') {
        errorMsg = 'Hồ sơ eKYC xác thực Renter của bạn đang được kiểm duyệt. Vui lòng quay lại sau.';
      } else if (user.renterStatus === 'rejected') {
        errorMsg = `Hồ sơ eKYC xác thực Renter bị từ chối. Lý do: "${user.renterOnboarding?.rejectReason || 'Ảnh không rõ ràng'}". Vui lòng nộp lại hồ sơ.`;
      }
      setBookingError(errorMsg);
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

    // Validate blocked dates
    const checkOverlap = (ranges) => {
      if (!ranges) return false;
      const s = new Date(startDate).setHours(0,0,0,0);
      const e = new Date(endDate).setHours(0,0,0,0);
      return ranges.some(range => {
        const rs = new Date(range.startDate).setHours(0,0,0,0);
        const re = new Date(range.endDate).setHours(0,0,0,0);
        return s <= re && e >= rs;
      });
    };

    if (checkOverlap(asset.blockedDates) || checkOverlap(asset.rentedDates)) {
      setBookingError('Thiết bị đã được đặt hoặc bị khóa trong khoảng thời gian này. Vui lòng chọn ngày khác.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      const response = await api.post('/orders', {
        assetId: asset._id,
        startDate,
        endDate,
        depositMethod
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
  const isTent = asset.category?.toLowerCase() === 'camping' && ['lều & thảm dã ngoại', 'tents'].includes(asset.subCategory?.toLowerCase());

  return (
    <div className="bg-surface text-on-surface antialiased flex flex-col min-h-screen selection:bg-primary-container selection:text-on-primary-container font-body-md">
      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-10 pb-16">
        
        {asset.status === 'deleted' && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="material-symbols-outlined text-red-500">warning</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-bold">
                  Thiết bị này đã bị xóa hoặc ngưng cung cấp.
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Thông tin dưới đây chỉ nhằm mục đích lưu trữ lịch sử cho các đơn hàng cũ. Bạn không thể tiếp tục đặt thuê thiết bị này.
                </p>
              </div>
            </div>
          </div>
        )}

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
              <div className="w-full bg-surface-container rounded-xl overflow-hidden shadow-sm border border-outline-variant relative aspect-[4/3] group">
                <img 
                  alt={asset.name} 
                  className="w-full h-full object-cover" 
                  src={selectedImage} 
                />
                
                {/* Navigation Arrows */}
                {assetImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImageIndex((prev) => (prev === 0 ? assetImages.length - 1 : prev - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm z-10"
                    >
                      <span className="material-symbols-outlined font-bold">chevron_left</span>
                    </button>
                    <button
                      onClick={() => setActiveImageIndex((prev) => (prev === assetImages.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm z-10"
                    >
                      <span className="material-symbols-outlined font-bold">chevron_right</span>
                    </button>
                  </>
                )}
                {/* Badges Overlay */}
                {asset.status === 'verified' && (
                  <div className="absolute top-4 right-4 flex flex-col sm:flex-row gap-2">
                    {asset.badges && asset.badges.length > 0 ? (
                      asset.badges.map((b, bi) => (
                        <span 
                          key={bi}
                          className="bg-emerald-950/90 text-emerald-300 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center shadow-lg border border-emerald-500/30 tracking-wide animate-in fade-in zoom-in-90 duration-300"
                        >
                          <span className="material-symbols-outlined text-sm mr-1 text-emerald-450" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {b.includes('tận nơi') ? 'motorcycle' : 'verified_user'}
                          </span>
                          {b}
                        </span>
                      ))
                    ) : (
                      <span className="bg-surface-container-lowest/90 backdrop-blur text-primary font-label-sm text-label-sm px-3 py-1 rounded-full border border-primary/20 flex items-center shadow-sm font-semibold">
                        <span className="material-symbols-outlined text-sm mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        Verified Gear
                      </span>
                    )}
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
                  <span>{asset.location?.addressString ? asset.location.addressString.split(',').slice(-2).join(',').trim() : (asset.lender?.address?.province || 'Đà Lạt')}</span>
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
                      Swal.fire('Vui lòng đăng nhập trước khi liên hệ.');
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
              <h2 className="font-title-md text-title-md text-on-surface mb-4 font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">location_searching</span>
                Vị trí nhận đồ
              </h2>
              <p className="font-body-md text-on-surface-variant mb-4 text-sm bg-primary-container/30 p-3 rounded-lg border border-primary/10">
                <span className="font-bold text-primary mr-1">Bảo mật:</span> 
                Địa chỉ chi tiết và số điện thoại của người cho thuê sẽ được cung cấp ngay sau khi bạn đặt cọc thành công. Khu vực nhận đồ ước tính ở xung quanh <strong>{asset.location?.addressString ? asset.location.addressString.split(',').slice(-3).join(',').trim() : (asset.lender?.address?.ward ? `${asset.lender.address.ward}, ` : '') + (asset.lender?.address?.district || 'khu vực này')}</strong>.
              </p>
              <div className="w-full h-64 bg-surface-container rounded-xl overflow-hidden border border-outline-variant shadow-sm relative">
                <img 
                  className="w-full h-full object-cover opacity-80 blur-[2px] transition-all duration-700" 
                  alt="Pickup map"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCClhgoxT766NZFJXPO7lpZE-cLFHiqKI9Nr7CdQbm0PiCZVFHOqkp7jQQzB9lbtwrmz9422KQeXvSUj0NvhzhDv7j13UeYEozGA-hDWuIpsc6IvccROnV5eAxzwyaaJdhMy_prCrH1fXkRP6DRijo07lE2w6tXzEtH5Pz7Ymfn2AFEW_zkpGa5m_w8Htfoel5rmSnJfVVwn9TZMpF1wC5kqb4K4mR8dsNare3Gbia1hCEGdZYAAlJnD8APcLMtbMOI2TacT2_ZI9sl" 
                />
                {/* Center Radius Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-32 h-32 md:w-48 md:h-48 bg-primary/20 border-2 border-primary/40 rounded-full animate-pulse flex items-center justify-center shadow-[0_0_15px_rgba(0,108,73,0.3)] backdrop-blur-[1px]">
                    <span className="material-symbols-outlined text-primary/80">explore</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews / Testimonials Section */}
            <div className="border-t border-outline-variant pt-8">
              <h2 className="font-title-md text-title-md text-on-surface mb-6 font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[28px]">reviews</span>
                Đánh giá từ khách thuê ({asset.reviews?.length || 0})
              </h2>

              {(!asset.reviews || asset.reviews.length === 0) ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-8 text-center text-slate-400 text-xs">
                  <span className="material-symbols-outlined text-3xl mb-2 text-slate-300">chat_bubble</span>
                  <p className="font-medium">Chưa có đánh giá nào cho sản phẩm này.</p>
                  <p className="text-[10px] mt-0.5 text-slate-300">Những khách hàng đã thuê đồ dã ngoại tại đây sẽ để lại phản hồi sau khi hoàn tất trả hàng.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Reviews Statistics Header */}
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150/60 mb-6">
                    <div className="text-center shrink-0 border-r border-slate-200 pr-6">
                      <div className="text-3xl font-extrabold text-slate-800">
                        {(asset.reviews.reduce((acc, r) => acc + r.lenderRating, 0) / asset.reviews.length).toFixed(1)}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 font-mono">/ 5.0</div>
                    </div>
                    <div className="text-xs text-slate-500 space-y-1">
                      <p className="font-semibold text-slate-700">Chất lượng dịch vụ & thiết bị</p>
                      <p className="leading-relaxed">Khách hàng phản hồi tích cực và hài lòng về chất lượng đồ dùng cắm trại cùng sự nhiệt tình của chủ đồ.</p>
                    </div>
                  </div>

                  {/* Reviews List */}
                  <div className="divide-y divide-slate-100">
                    {asset.reviews.map((rev) => (
                      <div key={rev._id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-150 border border-slate-200 shrink-0">
                              {rev.renter?.avatar ? (
                                <img src={rev.renter.avatar} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-slate-650 bg-slate-200 text-xs">
                                  {rev.renter?.name ? rev.renter.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                              )}
                            </div>
                            <div>
                              <strong className="text-xs text-slate-850 block">{rev.renter?.name || 'Thành viên EquipPeer'}</strong>
                              <span className="text-[9px] text-slate-400">
                                {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          </div>

                          {/* Star rating display */}
                          <div className="flex items-center text-amber-500 gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <span 
                                key={i} 
                                className="material-symbols-outlined text-sm"
                                style={{ fontVariationSettings: i < rev.lenderRating ? "'FILL' 1" : "'FILL' 0" }}
                              >
                                star
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-body-md pl-12">
                          {rev.lenderComment || 'Đánh giá 5 sao từ khách thuê.'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                  {(bookingError.includes('xác thực hình ảnh CCCD') || bookingError.includes('xác thực Renter bị từ chối')) && (
                    <Link to="/renter-ekyc" className="underline text-primary hover:text-primary-container font-bold block mt-1">
                      Xác thực CCCD ngay &rarr;
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

              {/* Unavailable Dates Alert */}
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <h4 className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">event_busy</span>
                  Các ngày không khả dụng
                </h4>
                {((asset.blockedDates && asset.blockedDates.length > 0) || (asset.rentedDates && asset.rentedDates.length > 0)) ? (
                  <ul className="text-[11px] text-amber-700 space-y-1 pl-1">
                    {[...(asset.blockedDates || []), ...(asset.rentedDates || [])]
                      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                      .map((range, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                          <span>
                            {new Date(range.startDate).toLocaleDateString('vi-VN')} - {new Date(range.endDate).toLocaleDateString('vi-VN')}
                          </span>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-amber-600 italic pl-1">Hiện chưa có lịch bận nào.</p>
                )}
                <p className="text-[10px] text-amber-600 italic mt-2 leading-tight">
                  * Vui lòng không chọn ngày nhận/trả nằm trong hoặc chứa các khoảng thời gian trên.
                </p>
              </div>

              {/* Duration / Guests */}
              <div className="border border-outline-variant rounded-xl p-3 mb-4 cursor-pointer hover:bg-surface-container-low transition-colors flex justify-between items-center">
                <div>
                  <label className="block font-label-sm text-xs text-on-surface-variant uppercase mb-1 font-bold">Số lượng</label>
                  <div className="font-title-md text-on-surface text-sm font-semibold">1 Thiết bị</div>
                </div>
                <span className="material-symbols-outlined text-outline">expand_more</span>
              </div>

              {/* Deposit Method Selection */}
              <div className="border border-outline-variant rounded-xl p-4 mb-6 bg-surface-container-low">
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-3">Hình thức đặt cọc</label>
                <div className="space-y-3">
                  {/* Online Deposit */}
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input 
                      type="radio" 
                      name="depositMethod" 
                      value="online" 
                      checked={depositMethod === 'online'}
                      onChange={() => setDepositMethod('online')}
                      className="mt-0.5 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-on-surface flex items-center gap-1">
                        Ký quỹ online qua sàn
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">Khuyên dùng</span>
                      </span>
                      <p className="text-[10px] text-on-surface-variant mt-0.5 leading-relaxed">
                        Tạm giữ an toàn qua VNPay, tự động hoàn trả 100% về ví ngay khi trả đồ thành công. Hỗ trợ giải quyết tranh chấp.
                      </p>
                    </div>
                  </label>

                  {/* Cash Deposit */}
                  <label className="flex items-start gap-2.5 cursor-pointer border-t border-outline-variant/35 pt-3">
                    <input 
                      type="radio" 
                      name="depositMethod" 
                      value="cash" 
                      checked={depositMethod === 'cash'}
                      onChange={() => setDepositMethod('cash')}
                      className="mt-0.5 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-on-surface">Cọc tiền mặt trực tiếp</span>
                      <p className="text-[10px] text-on-surface-variant mt-0.5 leading-relaxed">
                        Chỉ thanh toán trước tiền thuê online. Tự giao nhận tiền cọc mặt với chủ đồ khi gặp mặt.
                      </p>
                    </div>
                  </label>
                </div>

                {depositMethod === 'cash' && (
                  <div className="bg-amber-50 border border-amber-250 text-amber-900 p-3 rounded-lg text-[10px] font-semibold mt-3 leading-relaxed flex gap-1.5">
                    <span className="material-symbols-outlined text-sm text-amber-600 shrink-0">warning</span>
                    <span>
                      Bạn chọn cọc tiền mặt trực tiếp. Sàn miễn trừ mọi trách nhiệm pháp lý nếu xảy ra mất mát, lừa đảo tiền cọc mặt ngoài hệ thống.
                    </span>
                  </div>
                )}
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
                      {depositMethod === 'cash' ? 'Đặt cọc trực tiếp (Tiền mặt)' : 'Ký quỹ đặt cọc online'}
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
                    <span>Tổng thanh toán online</span>
                    <span className="text-primary">{totalAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <p className="text-center font-body-md text-[10px] text-on-surface-variant mt-2 italic">
                    {depositMethod === 'cash' 
                      ? '* Tiền cọc sẽ tự bàn giao & hoàn lại bằng tiền mặt trực tiếp giữa hai bên khi giao trả đồ.'
                      : `* Renter sẽ được hoàn lại ${deposit.toLocaleString('vi-VN')} đ tiền đặt cọc sau khi kết thúc đơn hàng.`}
                  </p>
                </div>
              )}

              {/* CTA Action */}
              <button 
                onClick={handleBooking}
                disabled={bookingLoading || asset.status === 'deleted'}
                className={`w-full font-title-md text-title-md py-4 rounded-xl shadow-md transition-all flex justify-center items-center font-bold ${
                  asset.status === 'deleted' 
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-primary-container text-on-primary-container hover:opacity-90 active:scale-[0.98]'
                }`}
              >
                <span className="material-symbols-outlined mr-2">shopping_bag</span>
                {asset.status === 'deleted' ? 'Ngừng cung cấp' : (bookingLoading ? 'Đang khởi tạo...' : 'Thuê Ngay')}
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

