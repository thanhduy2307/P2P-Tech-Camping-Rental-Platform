import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../configs/axios';

const Home = () => {
  const [featuredAssets, setFeaturedAssets] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await api.get('/assets');
        if (response.data && response.data.success) {
          const verified = response.data.data.filter(item => item.status === 'verified');
          setFeaturedAssets(verified.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to fetch featured assets:", err);
      } finally {
        setLoadingFeatured(false);
      }
    };
    fetchFeatured();
  }, []);

  const fallbackFeatured = [
    {
      _id: 'mock-home-1',
      name: 'Sony A7IV + Lens 24-70mm',
      pricePerDay: 450000,
      category: 'Camera',
      images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuBao-P5wee8PonR7NXczu32XW5yXw818SznHDyEHdxYRS1MfzIGe-nyYHT9lKlpJoc42xRDVGA7W918pWFh4k1WKqCv9bJT7k-KIbUyTowuBBoRsAfPwMdkG7ijj0I2ozJSh045bZKkmAE9vaSGZN0lqhRl_dcFit4c_6RnNUvNk8zpacsp7vzOWGLx820WNBn30yuKck_vVUKhGAWQDneC7OM_4I1by7YLkrU-fu8CsJ951job0wUjrMxRLALnfmPkHfTGCdDfK_ND'],
      rating: 4.9
    },
    {
      _id: 'mock-home-2',
      name: 'DJI Mavic 3 Pro',
      pricePerDay: 800000,
      category: 'Drone',
      images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuBmpSqz6XgBkyqS9geUDDKHfpyB6WJd1qGPtKH1SBaCtmwjjLGTawyT-HYOMs4xt3EYPFbquh4cvwvbxaGEMfRLd0dS5I7OE4n7ELaO-kS9btPl7umgyuYV7Sr6tQp1UA9oR6vQ0RM8R2FEakp7v62uJBZpW9NtUEQ22EKYkMg07l6s81Zg9MHdQ-0jCsOPztNFQPc48sDZN_-3PW-sK_pE7Jgru5qPOSD9kYqiYCoNbQRtqJPwUVXYj0VGsboE6yEwqR0bvnaMxEtS'],
      rating: 4.8
    },
    {
      _id: 'mock-home-3',
      name: 'Lều Naturehike 4 Người',
      pricePerDay: 120000,
      category: 'Camping',
      images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuAQhi5Oo1oMZSD1J_83LloRGVGbmX9lcOpQ2518lWWQsbYGMjKoCv1M14ev4FvBKOMKlnLihlwEAVAylNkr1GfC0wUra6FY3ySIHGyeWeX3ZN3OyMtecRn8Ee-dcYb-fA90VDoohUmEmkG5wwHLbCybhulmIJ-_n6KKtyTVIcSTKokKVOIkaEKXibYw_hssmVKNaIMV8HAsS8wq-h3WW8ksozUuWYICNUIuwX4RcYE9LpJnyLEYDg724X7xvnXN6o69nSR2LzBeVRLa'],
      rating: 5.0
    },
    {
      _id: 'mock-home-4',
      name: 'Bếp gas mini Fire-Maple',
      pricePerDay: 50000,
      category: 'Camping',
      images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuB9XN7V5vSw26r9obAYCZAwFrTqea3OsC7UtdAAwPnnn8tt_isfvZp6PkFNlXwZiytC9gMHBrSlN0MmWxXwA01V78gPAtUnFWyWPnvuwpjZgg01gwlVp_ByWmU_Y2KPrtaCXh4ESto5FbPtbTTbXe-Erb0pat2MbBhtNbR7JawtzWdj-RbrQ8ektPlpLf8dvaDA7DvvA9dm7N-59Cei-6GFLFgT8cIWlCo87m6KXtNzDto2YIo3FRabUfxtRf3VCAahKGu6Ezo3498-'],
      rating: 4.7
    }
  ];

  const displayAssets = featuredAssets.length > 0 ? featuredAssets : fallbackFeatured;

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) {
      params.append('search', searchTerm.trim());
    }
    if (startDate) {
      params.append('startDate', startDate);
    }
    if (endDate) {
      params.append('endDate', endDate);
    }
    navigate(`/assets?${params.toString()}`);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-[600px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            alt="EquipPeer Hero Background" 
            className="w-full h-full object-cover object-center" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzpH7waB-dJWylQekC7bE6PWiWozOXb4q0wiGyvJTidcZZQo_AiARBjRcWswVtH4EsfRJB8LNK-Eg3skc_2XqCZP1zIVT6UC09t9tV8eWyo_xnExHxCacfv29CJX0QFC24XnxwN3QTx_v7hoPh-BF9eP47DXfc5qZZm62eDY7DQDCFg9C11Qx_bC4gE5COel6TmBwMeB2SKspWA348HGIODbfXo2E_-dYprVV9T2kSI2lEQw0x6ooUlIN-d5V00zj2Rx19svS0rmkg"
          />
          <div className="absolute inset-0 hero-gradient"></div>
        </div>
        <div className="relative z-10 w-full max-w-container-max mx-auto px-margin-desktop md:px-margin-desktop flex flex-col items-center text-center">
          <h1 className="font-display-lg text-display-lg text-on-primary mb-4 drop-shadow-md max-w-4xl">
            Thuê &amp; Trải nghiệm: Thiết bị P2P cho chuyến phiêu lưu tiếp theo
          </h1>
          <p className="font-body-lg text-body-lg text-surface-container-high mb-10 max-w-2xl drop-shadow">
            Kết nối đam mê công nghệ và dã ngoại. Thuê thiết bị cao cấp từ cộng đồng tin cậy, an toàn và tiết kiệm.
          </p>
          {/* Search Widget */}
          <div className="glass-panel w-full max-w-4xl rounded-2xl p-4 md:p-6 shadow-xl flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center bg-surface rounded-xl px-4 py-3 border border-outline-variant/50 focus-within:border-primary">
              <span className="material-symbols-outlined text-outline mr-3">search</span>
              <input 
                className="w-full bg-transparent border-none focus:outline-none text-body-md text-on-surface placeholder-outline" 
                placeholder="Bạn muốn thuê gì?" 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            {/* Split Date Picker Form */}
            {/* <div className="flex-[1.2] flex gap-2">
              <div className="flex-1 flex items-center bg-surface rounded-xl px-3 py-2 border border-outline-variant/50 focus-within:border-primary relative">
                <span className="material-symbols-outlined text-outline mr-2 text-[20px]">calendar_today</span>
                <div className="flex flex-col flex-1 min-w-0 text-left">
                  <span className="text-[10px] text-outline font-semibold uppercase leading-none">Ngày thuê</span>
                  <input 
                    className="w-full bg-transparent border-none focus:outline-none text-xs text-on-surface cursor-pointer mt-0.5" 
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 flex items-center bg-surface rounded-xl px-3 py-2 border border-outline-variant/50 focus-within:border-primary relative">
                <span className="material-symbols-outlined text-outline mr-2 text-[20px]">event_upcoming</span>
                <div className="flex flex-col flex-1 min-w-0 text-left">
                  <span className="text-[10px] text-outline font-semibold uppercase leading-none">Ngày trả</span>
                  <input 
                    className="w-full bg-transparent border-none focus:outline-none text-xs text-on-surface cursor-pointer mt-0.5" 
                    type="date"
                    min={startDate || new Date().toISOString().split('T')[0]}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div> */}

            <button 
              onClick={handleSearch}
              className="bg-primary-container text-on-primary hover:bg-primary transition-all font-title-md font-semibold px-8 py-3 rounded-xl shadow-md whitespace-nowrap flex items-center justify-center gap-2"
            >
              <span>Tìm kiếm</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>

      {/* Categories Section (Bento Grid Style) */}
      <section className="py-20 px-margin-desktop max-w-container-max mx-auto bg-surface-bright">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Khám phá Danh mục</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Thiết bị phù hợp cho mọi nhu cầu sáng tạo và trải nghiệm.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
          {/* Tech Card */}
          <Link to="/assets?category=tech" className="relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
            <img 
              alt="Tech Gear Category" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnm9jYyngyn-6IGasOQwMwaQWVOZUPmueOqgy9DbaIK91oQtm_5y5inJAdW9lIiYWvE3NJmStq0UaqKuMtY-Kd662XnSVg4oSRFrQyFVtR9WJtzHpA1SivkSr1E0SSNbt4ZANxb5yTAzr3cuSgnTHsn1MsEgChrTetVPGUxNktB6fwAhwxX0tOQdVuvJ3FHH02YU95X4np2MaQG4Ufr-G_5XdiPcoXjzSoyy7YlwWk-0fJsqdo5Zjn1tsdg4jCNnEneDmqZdy25np5"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8 w-full flex justify-between items-end">
              <div>
                <span className="inline-block px-3 py-1 bg-secondary-container/80 backdrop-blur-sm text-on-primary rounded-full font-label-sm mb-3">Hi-Tech</span>
                <h3 className="font-headline-lg text-[28px] font-bold text-on-primary">Đồ Công Nghệ</h3>
                <p className="text-surface-container-high font-body-md mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">Camera, Drone, Laptop &amp; Phụ kiện</p>
              </div>
              <div className="bg-primary-container text-on-primary w-12 h-12 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">arrow_forward</span>
              </div>
            </div>
          </Link>
          {/* Camping Card */}
          <Link to="/assets?category=camping" className="relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
            <img 
              alt="Camping Gear Category" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiJ2HvpGec0o_lWOKKt00pH0mhIp9THKjvbGz9Gqgf0z_IwwEWaJFCqtLydclqIzHot_55fuL6tj7-FTA2fy3QSW1dE2x8QGDH6CDSDzAsXYRs3CGuM0IQWw-aCs4mFNqkG2_dJ16l8yY1HeYW75VTQu1RZTYNOMyMgeZID6Am41QY4ECbrGZslyv2StWSXK5XwxxwXXeQCq2vmI8hZN0hsihy5Y8gar3I6gLIMillxcWJ3TA6vIEkcMDT8OwrAsBB5ZTK1swda7tn"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8 w-full flex justify-between items-end">
              <div>
                <span className="inline-block px-3 py-1 bg-primary/80 backdrop-blur-sm text-on-primary rounded-full font-label-sm mb-3">Outdoor</span>
                <h3 className="font-headline-lg text-[28px] font-bold text-on-primary">Đồ Cắm Trại</h3>
                <p className="text-surface-container-high font-body-md mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">Lều, Bếp, Đồ ngủ &amp; Sinh tồn</p>
              </div>
              <div className="bg-primary-container text-on-primary w-12 h-12 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">arrow_forward</span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 px-margin-desktop max-w-container-max mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold">Thiết bị Nổi bật</h2>
          <Link to="/assets" className="font-title-md text-secondary hover:text-secondary-container flex items-center gap-1 transition-colors">
            Xem tất cả <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loadingFeatured ? (
            <div className="col-span-full text-center py-12">
              <p className="text-on-surface-variant">Đang tải thiết bị nổi bật...</p>
            </div>
          ) : (
            displayAssets.map(item => {
              const priceVND = (item.pricePerDay >= 1000000) 
                ? `${(item.pricePerDay / 1000000).toFixed(1).replace(/\.0$/, '')}tr` 
                : `${(item.pricePerDay / 1000).toFixed(0)}k`;
              const imgUrl = item.images && item.images.length > 0 ? item.images[0] : 'https://placehold.co/400x300?text=No+Image';
              return (
                <div key={item._id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  <div className="relative aspect-[4/3] bg-surface-container-low overflow-hidden group">
                    <img 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      src={imgUrl}
                    />
                    <div className="absolute top-3 right-3 bg-surface/90 backdrop-blur text-on-surface px-2 py-1 rounded-md font-label-sm font-bold flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-[14px] text-[#f59e0b]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> {item.rating || '5.0'}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <span className="text-secondary font-label-sm mb-1 uppercase tracking-wider">{item.category}</span>
                    <h3 className="font-title-md text-[18px] text-on-surface font-semibold mb-2 line-clamp-1">
                      <Link to={`/assets/${item._id}?startDate=${startDate}&endDate=${endDate}`} className="hover:text-primary transition-colors">
                        {item.name}
                      </Link>
                    </h3>
                    <div className="mt-auto flex items-end justify-between pt-4 border-t border-outline-variant/20">
                      <div>
                        <span className="font-body-md text-on-surface-variant text-sm">Từ</span>
                        <div className="font-title-md text-primary font-bold">{priceVND} <span className="text-sm font-normal text-on-surface-variant">/ngày</span></div>
                      </div>
                      <Link 
                        to={`/assets/${item._id}?startDate=${startDate}&endDate=${endDate}`}
                        className="w-10 h-10 rounded-full border border-outline-variant text-on-surface-variant hover:bg-primary-container hover:text-on-primary hover:border-primary-container transition-colors flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 bg-surface-container-low border-y border-outline-variant/20">
        <div className="max-w-container-max mx-auto px-margin-desktop text-center">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-16">Tại sao chọn EquipPeer?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-primary-container/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              </div>
              <h3 className="font-title-md text-title-md text-on-surface mb-3">Bảo hiểm An toàn</h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">Mọi giao dịch thuê đồ đều được bảo hiểm, đảm bảo an tâm cho cả người thuê và người cho thuê.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-secondary-container/10 rounded-2xl flex items-center justify-center mb-6 text-secondary">
                <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>handyman</span>
              </div>
              <h3 className="font-title-md text-title-md text-on-surface mb-3">Kiểm duyệt Chất lượng</h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">Cộng đồng uy tín với hệ thống đánh giá hai chiều và xác minh danh tính chặt chẽ.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-primary-container/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>savings</span>
              </div>
              <h3 className="font-title-md text-title-md text-on-surface mb-3">Giá cả Hợp lý</h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">Tiết kiệm chi phí đáng kể so với mua mới, tiếp cận thiết bị cao cấp dễ dàng hơn.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
