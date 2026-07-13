import Swal from 'sweetalert2';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../configs/axios';

const DashboardInspector = () => {
  const token = localStorage.getItem('token');
  const { user } = useSelector((state) => state.auth);

  // States
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal & Form States
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [status, setStatus] = useState('verified');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // Checklist States for In-person Inspections
  const [techChecklist, setTechChecklist] = useState({
    shutterCountTest: '',
    deadPixelSensorCheck: false,
    lensMoldCheck: false
  });
  const [campingChecklist, setCampingChecklist] = useState({
    zipperWearCheck: false,
    frameElasticityCheck: false,
    tentHolesCheck: false
  });

  // Fetch pending inspection tasks
  const fetchTasks = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/assets/pending');
      if (response.data && response.data.success) {
        setTasks(response.data.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách nhiệm vụ kiểm định. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [token]);

  // Open modal
  const handleOpenReview = (asset) => {
    setSelectedAsset(asset);
    setStatus('verified');
    setVerificationNotes('');
    setModalImageIndex(0);
    setTechChecklist({
      shutterCountTest: '',
      deadPixelSensorCheck: false,
      lensMoldCheck: false
    });
    setCampingChecklist({
      zipperWearCheck: false,
      frameElasticityCheck: false,
      tentHolesCheck: false
    });
    setIsModalOpen(true);
  };

  // Submit review
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;

    if (!verificationNotes.trim()) {
      Swal.fire('Vui lòng nhập ghi chú kiểm duyệt.');
      return;
    }

    const payload = {
      status,
      verificationNotes
    };

    const isOffline = selectedAsset.taskDetails && !selectedAsset.taskDetails.isRemote;
    if (status === 'verified' && isOffline) {
      if (selectedAsset.category === 'Tech') {
        if (techChecklist.shutterCountTest === '') {
          Swal.fire('Vui lòng nhập số shot đã test của thiết bị.');
          return;
        }
        payload.inspectionChecklist = {
          shutterCountTest: parseInt(techChecklist.shutterCountTest),
          deadPixelSensorCheck: techChecklist.deadPixelSensorCheck,
          lensMoldCheck: techChecklist.lensMoldCheck
        };
      } else if (selectedAsset.category === 'Camping') {
        payload.inspectionChecklist = {
          zipperWearCheck: campingChecklist.zipperWearCheck,
          frameElasticityCheck: campingChecklist.frameElasticityCheck,
          tentHolesCheck: campingChecklist.tentHolesCheck
        };
      }
    }

    setSubmitLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.put(`/assets/${selectedAsset._id}/verify`, payload);
      if (response.data && response.data.success) {
        setSuccess(`Cập nhật trạng thái kiểm định cho thiết bị "${selectedAsset.name}" thành công!`);
        setIsModalOpen(false);
        fetchTasks(); // Reload remaining tasks
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        Swal.fire(err.response.data.message);
      } else {
        Swal.fire('Gửi kết quả kiểm duyệt thất bại.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Stats
  const totalTasks = tasks.length;
  const onlineTasks = tasks.filter(t => t.taskDetails?.isRemote).length;
  const offlineTasks = tasks.filter(t => !t.taskDetails?.isRemote).length;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Upper Banner & Greet */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-950 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-400">admin_panel_settings</span>
            Bảng điều khiển Inspector
          </h2>
          <p className="text-teal-100/80 text-xs mt-1">Xin chào, {user?.name || 'Kiểm định viên'}. Bạn có nhiệm vụ kiểm tra chất lượng thiết bị đăng ký.</p>
        </div>
        <button 
          onClick={fetchTasks}
          className="bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-white/10 flex items-center gap-1.5 transition-all"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Làm mới
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 text-sm flex items-center gap-2.5">
          <span className="material-symbols-outlined text-emerald-600">check_circle</span>
          <span className="font-medium">{success}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 text-sm flex items-center gap-2.5">
          <span className="material-symbols-outlined text-red-600">error</span>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <span className="material-symbols-outlined text-2xl">pending_actions</span>
          </div>
          <div>
            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tổng đơn chờ duyệt</h4>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{totalTasks}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <span className="material-symbols-outlined text-2xl">language</span>
          </div>
          <div>
            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Kiểm định Online (Từ xa)</h4>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{onlineTasks}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <span className="material-symbols-outlined text-2xl">location_on</span>
          </div>
          <div>
            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Kiểm định Offline (Tận nơi)</h4>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{offlineTasks}</p>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-500 text-base">list_alt</span>
            Danh sách thiết bị cần thẩm định
          </h3>
          <span className="bg-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-full">{tasks.length} đơn</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <span className="material-symbols-outlined animate-spin text-3xl text-slate-300">autorenew</span>
            <p className="text-sm mt-2 font-medium">Đang tải danh sách nhiệm vụ...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <span className="material-symbols-outlined text-5xl text-slate-200">verified_user</span>
            <p className="text-sm mt-3 font-semibold text-slate-700">Tuyệt vời! Không còn đơn hàng nào chờ duyệt</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">Tất cả thiết bị được phân bổ đã được thẩm định chất lượng thành công.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30 text-slate-400 font-bold text-xs">
                  <th className="p-4 pl-6">Thiết bị</th>
                  <th className="p-4">Chủ sở hữu (Lender)</th>
                  <th className="p-4">Hình thức duyệt</th>
                  <th className="p-4">Giá thuê / Cọc</th>
                  <th className="p-4">Ngày nhận nhiệm vụ</th>
                  <th className="p-4 pr-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((asset) => {
                  const isRemote = asset.taskDetails?.isRemote;
                  const dateStr = asset.taskDetails?.assignedAt
                    ? new Date(asset.taskDetails.assignedAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '-';

                  return (
                    <tr key={asset._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                            <img 
                              src={asset.images && asset.images.length > 0 ? asset.images[0] : 'https://placehold.co/150?text=Gear'} 
                              alt={asset.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-800 text-sm truncate max-w-[200px]" title={asset.name}>{asset.name}</h4>
                            <span className="inline-block text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100/50 mt-1 capitalize">
                              {asset.category}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-xs">
                          <p className="font-bold text-slate-700">{asset.lender?.name}</p>
                          <p className="text-slate-400 mt-0.5">{asset.lender?.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        {isRemote ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                            <span className="material-symbols-outlined text-xs">language</span>
                            Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]" title={`Cách khoảng ${asset.taskDetails?.distance} km`}>
                            <span className="material-symbols-outlined text-xs">motorcycle</span>
                            Offline ({asset.taskDetails?.distance} km)
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-xs font-semibold">
                          <p className="text-teal-600 font-extrabold">{asset.pricePerDay.toLocaleString('vi-VN')} đ/ngày</p>
                          <p className="text-slate-400 mt-0.5">Cọc: {asset.depositAmount.toLocaleString('vi-VN')} đ</p>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-medium text-slate-500">{dateStr}</td>
                      <td className="p-4 pr-6 text-right">
                        <button 
                          onClick={() => handleOpenReview(asset)}
                          className="bg-primary hover:bg-primary-container text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1 ml-auto"
                        >
                          <span className="material-symbols-outlined text-sm">rate_review</span>
                          Kiểm duyệt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {isModalOpen && selectedAsset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-150 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-400">
                  {selectedAsset.taskDetails?.isRemote ? 'Kiểm duyệt trực tuyến (Online)' : `Thẩm định tận nơi (Offline - ${selectedAsset.taskDetails?.distance} km)`}
                </span>
                <h3 className="font-extrabold text-base mt-0.5">Kiểm định chất lượng: {selectedAsset.name}</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/75 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              
              {/* Product Gallery & Details grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Images column (Span 5) */}
                <div className="md:col-span-5 space-y-3">
                  <div className="w-full aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative shadow-inner">
                    <img 
                      src={selectedAsset.images && selectedAsset.images.length > 0 ? selectedAsset.images[modalImageIndex] : 'https://placehold.co/300?text=No+Image'} 
                      alt={selectedAsset.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {selectedAsset.images && selectedAsset.images.length > 1 && (
                      <div className="absolute inset-x-3 bottom-3 flex justify-between">
                        <button 
                          onClick={() => setModalImageIndex(prev => (prev === 0 ? selectedAsset.images.length - 1 : prev - 1))}
                          className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white"
                        >
                          <span className="material-symbols-outlined text-base">chevron_left</span>
                        </button>
                        <button 
                          onClick={() => setModalImageIndex(prev => (prev === selectedAsset.images.length - 1 ? 0 : prev + 1))}
                          className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white"
                        >
                          <span className="material-symbols-outlined text-base">chevron_right</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Row */}
                  {selectedAsset.images && selectedAsset.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {selectedAsset.images.map((img, idx) => (
                        <button 
                          key={idx}
                          onClick={() => setModalImageIndex(idx)}
                          className={`w-12 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                            idx === modalImageIndex ? 'border-primary scale-95 shadow' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info details column (Span 7) */}
                <div className="md:col-span-7 space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Nguyên giá gốc</span>
                      <span className="font-extrabold text-slate-800">{selectedAsset.originalPrice?.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Năm mua sản phẩm</span>
                      <span className="font-extrabold text-slate-800">Năm {selectedAsset.purchaseYear || 'Chưa rõ'}</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Giá thuê đề xuất</span>
                      <span className="font-extrabold text-teal-600">{selectedAsset.pricePerDay?.toLocaleString('vi-VN')} đ/ngày</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Mức tiền cọc</span>
                      <span className="font-extrabold text-slate-800">{selectedAsset.depositAmount?.toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>

                  {/* Serial & AI Anti-Fraud Scan Report */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                    <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Số Serial / IMEI</span>
                    <span className="font-mono font-bold text-slate-800 uppercase block">{selectedAsset.serialNumber || 'Chưa cung cấp'}</span>
                    
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Báo cáo chống gian lận (AI Image Scan)</span>
                      {selectedAsset.aiAntiFraudStatus ? (
                        selectedAsset.aiAntiFraudStatus.isCopied ? (
                          <div className="bg-red-50 text-red-700 p-2.5 rounded-lg text-[10px] font-medium border border-red-200 flex items-start gap-1">
                            <span className="material-symbols-outlined text-xs mt-0.5 text-red-650">warning</span>
                            <span><strong>CẢNH BÁO:</strong> {selectedAsset.aiAntiFraudStatus.reason}</span>
                          </div>
                        ) : (
                          <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-lg text-[10px] font-medium border border-emerald-200 flex items-start gap-1">
                            <span className="material-symbols-outlined text-xs mt-0.5 text-emerald-650">check_circle</span>
                            <span><strong>AN TOÀN:</strong> {selectedAsset.aiAntiFraudStatus.reason}</span>
                          </div>
                        )
                      ) : (
                        <p className="text-[10px] text-slate-500 italic">Chưa thực hiện quét hoặc ảnh an toàn.</p>
                      )}
                    </div>
                  </div>

                  {/* Legal ownership documents previews */}
                  {(selectedAsset.invoiceImage || selectedAsset.warrantyCardImage) && (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                      <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Chứng từ sở hữu pháp lý</span>
                      <div className="flex gap-2">
                        {selectedAsset.invoiceImage && (
                          <div className="flex-1 text-center">
                            <span className="text-[9px] text-slate-500 block mb-1">Hóa đơn mua hàng</span>
                            <div className="w-full h-20 rounded bg-white border border-slate-200 overflow-hidden cursor-zoom-in group relative">
                              <img src={selectedAsset.invoiceImage} alt="Invoice" className="w-full h-full object-cover" onClick={() => window.open(selectedAsset.invoiceImage)} />
                            </div>
                          </div>
                        )}
                        {selectedAsset.warrantyCardImage && (
                          <div className="flex-1 text-center">
                            <span className="text-[9px] text-slate-500 block mb-1">Thẻ bảo hành/tem</span>
                            <div className="w-full h-20 rounded bg-white border border-slate-200 overflow-hidden cursor-zoom-in group relative">
                              <img src={selectedAsset.warrantyCardImage} alt="Warranty" className="w-full h-full object-cover" onClick={() => window.open(selectedAsset.warrantyCardImage)} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Financial Warning Flag */}
                  {(selectedAsset.depositAmount > selectedAsset.originalPrice || selectedAsset.pricePerDay > selectedAsset.originalPrice * 0.5) && (
                    <div className="bg-amber-50 text-amber-800 p-3.5 rounded-xl border border-amber-250 text-xs font-semibold flex items-start gap-2">
                      <span className="material-symbols-outlined text-amber-600 text-base mt-0.5">warning</span>
                      <div>
                        <p className="font-bold">Cảnh báo bất thường tài chính!</p>
                        <p className="text-[10px] text-amber-700/80 font-normal leading-relaxed mt-0.5">
                          Tiền đặt cọc ({selectedAsset.depositAmount?.toLocaleString('vi-VN')} đ) hoặc đơn giá thuê ({selectedAsset.pricePerDay?.toLocaleString('vi-VN')} đ) quá cao so với giá trị món đồ ({selectedAsset.originalPrice?.toLocaleString('vi-VN')} đ). Hãy thẩm duyệt kỹ xem Lender có yêu cầu cọc quá cao để ép Renter hay không.
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Mô tả của Lender</span>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 max-h-36 overflow-y-auto text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {selectedAsset.description || 'Không có mô tả chi tiết cho sản phẩm.'}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      Độ mới khảo sát: <strong>{selectedAsset.itemConditionRate || '95'}%</strong>
                    </span>
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-blue-500">location_on</span>
                      Tọa độ: <strong className="text-slate-700">{selectedAsset.location?.lat?.toFixed(4)}, {selectedAsset.location?.lng?.toFixed(4)}</strong>
                    </span>
                  </div>
                </div>

              </div>

              {/* Action Review Form */}
              <form onSubmit={handleVerifySubmit} className="border-t border-slate-150 pt-5 space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">gavel</span>
                  Quyết định kiểm duyệt chất lượng
                </h4>

                {/* Status Selection Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label className={`border-2 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                    status === 'verified' ? 'border-emerald-600 bg-emerald-50/30' : 'border-slate-150 hover:border-slate-300'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <input 
                        type="radio" 
                        name="reviewStatus" 
                        value="verified"
                        checked={status === 'verified'}
                        onChange={(e) => setStatus(e.target.value)}
                        className="text-emerald-600 focus:ring-emerald-600"
                      />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Phê duyệt (Verified)</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">Thiết bị đạt chuẩn, hiển thị ngay lên sàn</span>
                      </div>
                    </div>
                    {status === 'verified' && <span className="material-symbols-outlined text-emerald-600 text-base font-bold">check_circle</span>}
                  </label>

                  <label className={`border-2 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                    status === 'rejected' ? 'border-red-600 bg-red-50/30' : 'border-slate-150 hover:border-slate-300'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <input 
                        type="radio" 
                        name="reviewStatus" 
                        value="rejected"
                        checked={status === 'rejected'}
                        onChange={(e) => setStatus(e.target.value)}
                        className="text-red-600 focus:ring-red-600"
                      />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Từ chối duyệt (Rejected)</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">Sản phẩm lỗi/không đúng hình mô tả</span>
                      </div>
                    </div>
                    {status === 'rejected' && <span className="material-symbols-outlined text-red-600 text-base font-bold">cancel</span>}
                  </label>

                  <label className={`border-2 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                    status === 'unavailable' ? 'border-slate-600 bg-slate-50' : 'border-slate-150 hover:border-slate-300'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <input 
                        type="radio" 
                        name="reviewStatus" 
                        value="unavailable"
                        checked={status === 'unavailable'}
                        onChange={(e) => setStatus(e.target.value)}
                        className="text-slate-600 focus:ring-slate-600"
                      />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Tạm khóa (Unavailable)</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">Thiết bị cần bảo trì, không cho thuê</span>
                      </div>
                    </div>
                    {status === 'unavailable' && <span className="material-symbols-outlined text-slate-600 text-base font-bold">lock</span>}
                  </label>
                </div>

                {/* Real-world Inspection Checklist (Offline task only) */}
                {status === 'verified' && selectedAsset.taskDetails && !selectedAsset.taskDetails.isRemote && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-in fade-in duration-200">
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-sm">fact_check</span>
                      Biên bản thẩm định thực tế (Bắt buộc cho Offline)
                    </h5>
                    
                    {selectedAsset.category === 'Tech' ? (
                      <div className="space-y-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-slate-700">Test số shot (máy ảnh) *</label>
                          <input 
                            type="number"
                            placeholder="Nhập số shot đếm được (e.g. 12500)"
                            className="bg-white border border-slate-250 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-primary w-full md:w-1/2"
                            value={techChecklist.shutterCountTest}
                            onChange={(e) => setTechChecklist(prev => ({ ...prev, shutterCountTest: e.target.value }))}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <label className="flex items-center gap-2 cursor-pointer bg-white p-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700">
                            <input 
                              type="checkbox"
                              className="text-primary focus:ring-primary rounded"
                              checked={techChecklist.deadPixelSensorCheck}
                              onChange={(e) => setTechChecklist(prev => ({ ...prev, deadPixelSensorCheck: e.target.checked }))}
                            />
                            <span>Sensor hoạt động tốt, không chết pixel</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer bg-white p-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700">
                            <input 
                              type="checkbox"
                              className="text-primary focus:ring-primary rounded"
                              checked={techChecklist.lensMoldCheck}
                              onChange={(e) => setTechChecklist(prev => ({ ...prev, lensMoldCheck: e.target.checked }))}
                            />
                            <span>Kính lens sạch, không mốc rễ tre</span>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <label className="flex items-center gap-2 cursor-pointer bg-white p-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700">
                          <input 
                            type="checkbox"
                            className="text-primary focus:ring-primary rounded"
                            checked={campingChecklist.zipperWearCheck}
                            onChange={(e) => setCampingChecklist(prev => ({ ...prev, zipperWearCheck: e.target.checked }))}
                          />
                          <span>Khóa kéo tốt, trơn tru không rách mòn</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer bg-white p-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700">
                          <input 
                            type="checkbox"
                            className="text-primary focus:ring-primary rounded"
                            checked={campingChecklist.frameElasticityCheck}
                            onChange={(e) => setCampingChecklist(prev => ({ ...prev, frameElasticityCheck: e.target.checked }))}
                          />
                          <span>Khung lều đàn hồi tốt, không cong gãy</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer bg-white p-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700">
                          <input 
                            type="checkbox"
                            className="text-primary focus:ring-primary rounded"
                            checked={campingChecklist.tentHolesCheck}
                            onChange={(e) => setCampingChecklist(prev => ({ ...prev, tentHolesCheck: e.target.checked }))}
                          />
                          <span>Màng chống muỗi kín, không lỗ thủng</span>
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {/* Verification notes field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Ghi chú kiểm duyệt / Lý do từ chối (Gửi đến Lender)</label>
                  <textarea 
                    rows="3"
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Nhập nhận xét chi tiết về chất lượng thiết bị, phụ kiện đi kèm hoặc lý do từ chối cụ thể..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium focus:bg-white focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none"
                    required
                  />
                </div>

                {/* Footer buttons */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs py-2.5 px-5 rounded-xl transition-all"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit"
                    disabled={submitLoading}
                    className="bg-primary hover:bg-primary-container text-white font-extrabold text-xs py-2.5 px-6 rounded-xl transition-all shadow active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">publish</span>
                    {submitLoading ? 'Đang lưu kết quả...' : 'Xác nhận kiểm duyệt'}
                  </button>
                </div>

              </form>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardInspector;
