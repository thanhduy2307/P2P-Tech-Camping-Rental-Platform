import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../configs/axios';


// ─── Helpers ──────────────────────────────────────────────────────────────────
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    if (!file) { resolve(''); return; }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
  });

// ─── Component ────────────────────────────────────────────────────────────────
const PostAsset = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Chế độ chỉnh sửa (Edit Mode)
  const [isEditMode, setIsEditMode] = useState(false);
  const [assetId, setAssetId] = useState(null);

  // Basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Tech');
  const [condition, setCondition] = useState('Excellent');



  // Pricing
  const [pricePerDay, setPricePerDay] = useState('');
  const [depositCalculationMode, setDepositCalculationMode] = useState('fixed');
  const [depositAmount, setDepositAmount] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [purchaseYear, setPurchaseYear] = useState(new Date().getFullYear());
  const [itemConditionRate, setItemConditionRate] = useState(95);


  // ── Images (Tối thiểu 5 ảnh bắt buộc) ──────────────────────────────────────
  const [imgFiles, setImgFiles] = useState([null, null, null, null, null]);
  const [imgPreviews, setImgPreviews] = useState(['', '', '', '', '']);
  const fileInputRefs = [useRef(), useRef(), useRef(), useRef(), useRef()];

  const handleFileChange = (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;
    const newFiles = [...imgFiles];
    newFiles[idx] = file;
    setImgFiles(newFiles);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const newPreviews = [...imgPreviews];
      newPreviews[idx] = ev.target.result;
      setImgPreviews(newPreviews);
    };
    reader.readAsDataURL(file);
  };


  // ── Location ───────────────────────────────────────────────────────────────
  const [lat, setLat] = useState(11.9404);
  const [lng, setLng] = useState(108.4373);
  const [locationLabel, setLocationLabel] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Trình duyệt không hỗ trợ Geolocation.');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude.toFixed(6));
        setLng(longitude.toFixed(6));
        // Reverse geocode using Nominatim (no API key needed)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=vi`
          );
          const data = await res.json();
          setLocationLabel(data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } catch {
          setLocationLabel(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        setGpsLoading(false);
      },
      (err) => {
        setGpsError('Không thể lấy vị trí. Vui lòng cho phép quyền truy cập vị trí.');
        setGpsLoading(false);
      },
      { timeout: 10000 }
    );
  };

  // Tải dữ liệu thiết bị nếu trong chế độ chỉnh sửa (Edit Mode)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get('id');
    if (id) {
      setIsEditMode(true);
      setAssetId(id);
      
      const fetchAssetDetails = async (id) => {
        try {
          const response = await api.get(`/assets/${id}`);
          if (response.data && response.data.success) {
            const item = response.data.data;
            setName(item.name || '');
            setDescription(item.description || '');
            setCategory(item.category || 'Tech');
            setCondition(item.condition || 'Excellent');
            setPricePerDay(item.pricePerDay ?? '');
            setDepositCalculationMode(item.depositCalculationMode || 'fixed');
            setDepositAmount(item.depositAmount ?? '');
            setOriginalPrice(item.originalPrice ?? '');
            setPurchaseYear(item.purchaseYear ?? new Date().getFullYear());
            setItemConditionRate(item.itemConditionRate ?? 95);



            if (item.images && item.images.length > 0) {
              const previews = ['', '', '', '', ''];
              item.images.forEach((img, index) => {
                if (index < 5) previews[index] = img;
              });
              setImgPreviews(previews);
            }

            if (item.location) {
              setLat(item.location.lat);
              setLng(item.location.lng);
              setLocationLabel(item.location.addressString || `${item.location.lat.toFixed(4)}, ${item.location.lng.toFixed(4)}`);
            }
          }
        } catch (err) {
          console.error("Failed to fetch asset details:", err);
          setErrorMsg("Không thể tải thông tin thiết bị để chỉnh sửa.");
        }
      };
      fetchAssetDetails(id);
    }
  }, []);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [assignedTaskInfo, setAssignedTaskInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setAssignedTaskInfo(null);
    setLoading(true);

    // Validate images count (at least 5 images)
    const activeImagesCount = imgPreviews.filter(p => p !== '').length;
    if (activeImagesCount < 5) {
      setErrorMsg('Vui lòng cung cấp đầy đủ 5 hình ảnh sản phẩm (4 ảnh các góc + 1 ảnh chụp rõ số Serial trên thân máy hoặc ảnh bung lều thực tế).');
      setLoading(false);
      return;
    }


    // Validate original price
    const finalOriginalPrice = parseFloat(originalPrice);
    if (isNaN(finalOriginalPrice) || finalOriginalPrice <= 0) {
      setErrorMsg('Vui lòng cung cấp giá trị gốc lúc mua mới của sản phẩm để phân bổ kiểm định.');
      setLoading(false);
      return;
    }

    try {
      // Convert selected images to base64 or keep existing preview URLs
      const images = [];
      for (let i = 0; i < 5; i++) {
        if (imgFiles[i]) {
          images.push(await fileToBase64(imgFiles[i]));
        } else if (imgPreviews[i]) {
          images.push(imgPreviews[i]);
        }
      }



      const payload = {
        name,
        description,
        category,
        condition,
        pricePerDay: parseFloat(pricePerDay),
        depositCalculationMode,
        originalPrice: finalOriginalPrice,
        location: { lat: parseFloat(lat), lng: parseFloat(lng), addressString: locationLabel },
        images,
      };

      if (depositCalculationMode === 'fixed') {
        payload.depositAmount = parseFloat(depositAmount);
        if (isNaN(payload.depositAmount) || payload.depositAmount < 0) {
          setErrorMsg('Vui lòng cung cấp số tiền đặt cọc cố định hợp lệ.');
          setLoading(false);
          return;
        }
      } else {
        payload.purchaseYear = parseInt(purchaseYear);
        payload.itemConditionRate = parseInt(itemConditionRate);

        if (isNaN(payload.purchaseYear) || payload.purchaseYear > new Date().getFullYear()) {
          setErrorMsg('Năm mua thiết bị không hợp lệ.');
          setLoading(false);
          return;
        }
        if (isNaN(payload.itemConditionRate) || payload.itemConditionRate < 0 || payload.itemConditionRate > 100) {
          setErrorMsg('Độ mới của thiết bị phải từ 0% đến 100%.');
          setLoading(false);
          return;
        }
      }

      let response;
      if (isEditMode) {
        response = await api.put(`/assets/${assetId}`, payload);
      } else {
        response = await api.post('/assets', payload);
      }

      if (response.data?.success) {
        setSuccessMsg(isEditMode 
          ? (response.data.message || 'Cập nhật thiết bị thành công! Thiết bị đang được kiểm duyệt lại.')
          : (response.data.message || 'Đăng thiết bị thành công! Đang chờ kiểm duyệt.')
        );
        if (response.data.assignedTask) setAssignedTaskInfo(response.data.assignedTask);
        setTimeout(() => navigate('/lender-inventory'), 5000);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Không thể lưu thiết bị. Vui lòng kiểm tra lại thông tin.');
    } finally {
      loading && setLoading(false);
    }
  };


  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white px-8 py-6 border-b border-slate-800">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-teal-400">
            {isEditMode ? 'edit_document' : 'add_circle'}
          </span>
          {isEditMode ? 'Cập Nhật Thông Tin Thiết Bị' : 'Đăng Ký Cho Thuê Thiết Bị'}
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          {isEditMode 
            ? 'Chỉnh sửa thông tin thiết bị của bạn. Sửa đổi thông tin cốt lõi sẽ khiến thiết bị cần được thẩm duyệt lại.' 
            : 'Điền đầy đủ thông tin để hồ sơ được kiểm duyệt nhanh nhất.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* ── Messages ── */}
        {errorMsg && (
          <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-4 text-xs font-semibold flex items-start gap-2 animate-in fade-in duration-200">
            <span className="material-symbols-outlined text-[16px] mt-0.5">error</span>
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg p-4 space-y-2 text-xs animate-in fade-in duration-200">
            <p className="font-bold flex items-center gap-1.5 text-emerald-700">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {successMsg}
            </p>
            {assignedTaskInfo && (
              <div className="mt-2 pt-2 border-t border-emerald-200/50 text-[11px] text-emerald-600">
                <p><strong>Nhiệm vụ kiểm duyệt:</strong></p>
                <p>- Hình thức: {assignedTaskInfo.isRemote ? 'Kiểm duyệt TỪ XA qua ảnh/video' : 'Kiểm duyệt TRỰC TIẾP tại nơi'}</p>
                <p>- Trạng thái: Đã phân bổ cho Inspector gần nhất</p>
              </div>
            )}
            <p className="text-slate-500 italic pt-1">Hệ thống đang chuyển hướng bạn về Kho thiết bị sau vài giây...</p>
          </div>
        )}

        {/* ══ Section 1: Basic Info ══════════════════════════════════════════ */}
        <section className="space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-slate-400">info</span>
            1. Thông tin cơ bản
          </h3>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700" htmlFor="asset-name">
              Tên thiết bị <span className="text-red-500">*</span>
            </label>
            <input
              id="asset-name"
              type="text"
              placeholder="e.g. Lều Eureka Apex 2XT (Dành cho 2 người)"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700" htmlFor="asset-category">Danh mục</label>
              <select
                id="asset-category"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal-500 text-sm bg-white cursor-pointer"
                value={category}
                onChange={(e) => { setCategory(e.target.value); setFixedSpecs({}); }}
              >
                <option value="Tech">Đồ Công Nghệ (Tech)</option>
                <option value="Camping">Đồ Cắm Trại (Camping)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700" htmlFor="asset-condition">Hình thức</label>
              <select
                id="asset-condition"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal-500 text-sm bg-white cursor-pointer"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                <option value="New">Mới 100% (New)</option>
                <option value="Excellent">Như mới (Excellent)</option>
                <option value="Good">Hoạt động tốt (Good)</option>
                <option value="Fair">Có trầy xước nhẹ (Fair)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700" htmlFor="asset-description">
              Mô tả thiết bị &amp; Quy định bàn giao <span className="text-red-500">*</span>
            </label>
            <textarea
              id="asset-description"
              rows="4"
              placeholder="Mô tả tổng quát thiết bị, quy định khi nhận đồ, lưu ý đặc biệt..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 text-sm leading-relaxed"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
        </section>





        {/* ══ Section 3: Pricing ════════════════════════════════════════════ */}
        <section className="space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-slate-400">payments</span>
            3. Giá trị, Giá thuê &amp; Ký quỹ cọc
          </h3>

          <div className="space-y-4">
            {/* Original value input is ALWAYS required (for routing/anti-fraud reasons) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700" htmlFor="asset-orig-price">
                Giá trị thiết bị lúc mua mới (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                id="asset-orig-price"
                type="number"
                placeholder="e.g. 12000000"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal-500 text-sm"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                required
              />
              <p className="text-[10px] text-slate-400">
                * Giá trị này quyết định luồng duyệt: Dưới hoặc bằng 20.000.000đ duyệt Online, Trên 20.000.000đ duyệt Offline tận nơi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700" htmlFor="asset-price">
                  Giá thuê một ngày (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  id="asset-price"
                  type="number"
                  placeholder="e.g. 150000"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal-500 text-sm"
                  value={pricePerDay}
                  onChange={(e) => setPricePerDay(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700" htmlFor="asset-deposit-mode">Cách tính tiền cọc</label>
                <select
                  id="asset-deposit-mode"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal-500 text-sm bg-white cursor-pointer"
                  value={depositCalculationMode}
                  onChange={(e) => setDepositCalculationMode(e.target.value)}
                >
                  <option value="fixed">Hạn mức cố định (Nhập thủ công)</option>
                  <option value="auto">Tính tự động (Khấu hao theo năm mua &amp; chất lượng)</option>
                </select>
              </div>
            </div>
          </div>

          {depositCalculationMode === 'fixed' ? (
            <div className="space-y-1 bg-slate-50 p-4 rounded-lg border border-slate-200/50">
              <label className="text-xs font-semibold text-slate-700" htmlFor="asset-deposit">
                Số tiền đặt cọc cố định (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                id="asset-deposit"
                type="number"
                placeholder="e.g. 1500000"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:border-teal-500 text-sm"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                required={depositCalculationMode === 'fixed'}
              />
              <p className="text-[10px] text-slate-400 mt-1">Khoản tiền cọc renter cần đặt trước khi thuê thiết bị này.</p>
            </div>
          ) : (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/50 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700" htmlFor="asset-buy-year">Năm mua hàng</label>
                <input
                  id="asset-buy-year"
                  type="number"
                  placeholder="e.g. 2024"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-teal-500 text-sm"
                  value={purchaseYear}
                  onChange={(e) => setPurchaseYear(e.target.value)}
                  required={depositCalculationMode === 'auto'}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700" htmlFor="asset-rate">Độ mới thực tế (%)</label>
                <input
                  id="asset-rate"
                  type="number"
                  placeholder="e.g. 95"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-teal-500 text-sm"
                  value={itemConditionRate}
                  onChange={(e) => setItemConditionRate(e.target.value)}
                  min="0"
                  max="100"
                  required={depositCalculationMode === 'auto'}
                />
              </div>
              <p className="text-[10px] text-slate-450 md:col-span-2 mt-1 italic">
                * Hệ thống tự động tính cọc: Tiền cọc = Giá trị gốc × độ mới × (khấu hao 10% mỗi năm, tối đa khấu hao 50%).
              </p>
            </div>
          )}
        </section>

        {/* ══ Section 4: Images ═════════════════════════════════════════════ */}
        <section className="space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-slate-400">photo_library</span>
            4. Hình ảnh thiết bị (Bắt buộc đủ 5 ảnh các góc cạnh)
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[0, 1, 2, 3, 4].map((idx) => {
              const labels = [
                'Góc mặt trước', 
                'Góc mặt sau', 
                'Góc bên trái', 
                'Góc bên phải', 
                category === 'Tech' ? 'Tem mã vạch / Serial' : 'Bung lều thực tế'
              ];
              return (
                <div key={idx} className="space-y-2">
                  <p className="text-[10px] font-semibold text-slate-600 text-center truncate">
                    {labels[idx]} <span className="text-red-500">*</span>
                  </p>
                  <div
                    className={`relative w-full aspect-square rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-all group ${
                      imgPreviews[idx] ? 'border-teal-400' : 'border-slate-200 hover:border-teal-300 bg-slate-50'
                    }`}
                    onClick={() => fileInputRefs[idx].current?.click()}
                  >
                    {imgPreviews[idx] ? (
                      <>
                        <img
                          src={imgPreviews[idx]}
                          alt={`preview-${idx}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                          <span className="material-symbols-outlined text-white text-lg">edit</span>
                          <span className="text-white text-[9px] font-bold">Đổi ảnh</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1 p-2 text-center">
                        <span className="material-symbols-outlined text-slate-350 text-xl group-hover:text-teal-400 transition-colors">
                          add_photo_alternate
                        </span>
                        <span className="text-[9px] text-slate-400 leading-tight">Chọn ảnh</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRefs[idx]}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, idx)}
                  />
                  {imgFiles[idx] && (
                    <p className="text-[8px] text-slate-400 truncate text-center">{imgFiles[idx].name}</p>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400">
            * Yêu cầu chụp đủ 4 góc cạnh sản phẩm rõ nét kèm ảnh Serial thân máy (Tech) hoặc ảnh dựng lều thực tế (Camping) để AI thực hiện trích xuất và chống giả mạo.
          </p>
        </section>

        {/* ══ Section 5: Location ═══════════════════════════════════════════ */}
        <section className="space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
            5. Vĩ độ &amp; Kinh độ nhận đồ
          </h3>

          {/* GPS Button */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-teal-600 text-xl mt-0.5">my_location</span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-teal-800">Tự động xác định vị trí</p>
                <p className="text-[10px] text-teal-700/70 mt-0.5">
                  Sử dụng GPS trình duyệt để lấy tọa độ chính xác của thiết bị.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={gpsLoading}
                className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm flex-shrink-0"
              >
                {gpsLoading ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>
                    Đang lấy...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">gps_fixed</span>
                    Lấy vị trí của tôi
                  </>
                )}
              </button>
            </div>

            {/* Location result */}
            <div className="bg-white rounded-lg border border-teal-200 px-3 py-2 flex items-start gap-2 animate-in fade-in duration-250">
              <span className="material-symbols-outlined text-teal-500 text-sm mt-0.5">place</span>
              <div className="w-full">
                <p className="text-[10px] font-bold text-teal-700 uppercase tracking-wide mb-0.5">Địa chỉ lấy đồ cụ thể</p>
                <textarea 
                  className="w-full text-xs text-slate-700 leading-relaxed border border-slate-200 rounded p-1.5 focus:outline-none focus:border-teal-400"
                  value={locationLabel}
                  onChange={(e) => setLocationLabel(e.target.value)}
                  rows="2"
                  placeholder="VD: Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/TP..."
                />
                <p className="text-[9px] text-slate-400 mt-1">Bấm nút GPS ở trên để điền tự động, hoặc tự sửa tay nếu định vị chưa chuẩn.</p>
              </div>
            </div>
            {gpsError && (
              <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">warning</span>
                {gpsError}
              </p>
            )}
          </div>

          {/* Manual lat/lng fallback */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200/50">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700" htmlFor="asset-lat">Vĩ độ (Latitude)</label>
              <input
                id="asset-lat"
                type="number"
                step="0.000001"
                placeholder="e.g. 11.940400"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-teal-500 text-sm font-mono"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700" htmlFor="asset-lng">Kinh độ (Longitude)</label>
              <input
                id="asset-lng"
                type="number"
                step="0.000001"
                placeholder="e.g. 108.437300"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-teal-500 text-sm font-mono"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                required
              />
            </div>
            <p className="text-[10px] text-slate-400 md:col-span-2">
              Tọa độ được điền tự động khi bạn nhấn "Lấy vị trí của tôi". Bạn cũng có thể điều chỉnh thủ công nếu cần.
            </p>
          </div>
        </section>

        {/* ══ Footer Actions ════════════════════════════════════════════════ */}
        <div className="flex gap-4 pt-2 border-t border-slate-100 justify-end">
          <button
            type="button"
            onClick={() => navigate('/lender-inventory')}
            className="py-3 px-6 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50 transition-colors text-sm"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={loading || !!successMsg}
            className="py-3 px-8 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>
                Đang gửi hồ sơ...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">send</span>
                Đăng Ký Thiết Bị
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostAsset;
