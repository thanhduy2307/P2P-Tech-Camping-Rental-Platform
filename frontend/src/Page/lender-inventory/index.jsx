import Swal from 'sweetalert2';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../configs/axios';

const LenderInventory = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedAssetForBlock, setSelectedAssetForBlock] = useState(null);
  const [blockStartDate, setBlockStartDate] = useState('');
  const [blockEndDate, setBlockEndDate] = useState('');

  const fetchMyInventory = async () => {
    setLoading(true);
    try {
      const response = await api.get('/assets/my');
      if (response.data?.success) {
        setAssets(response.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyInventory();
  }, []);

  const openBlockModal = (asset) => {
    setSelectedAssetForBlock(asset);
    setBlockStartDate('');
    setBlockEndDate('');
    setBlockModalOpen(true);
  };

  const handleAddBlockDate = async () => {
    if (!blockStartDate || !blockEndDate) {
      Swal.fire("Vui lòng chọn cả ngày bắt đầu và kết thúc.");
      return;
    }
    if (new Date(blockStartDate) > new Date(blockEndDate)) {
      Swal.fire("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.");
      return;
    }
    try {
      const currentBlocks = selectedAssetForBlock.blockedDates || [];
      const updatedBlocks = [...currentBlocks, { startDate: blockStartDate, endDate: blockEndDate }];
      const res = await api.put(`/assets/${selectedAssetForBlock._id}/block-dates`, { blockedDates: updatedBlocks });
      if (res.data?.success) {
        setBlockStartDate('');
        setBlockEndDate('');
        setSelectedAssetForBlock({ ...selectedAssetForBlock, blockedDates: res.data.data });
        fetchMyInventory();
      }
    } catch (err) {
      Swal.fire(err.response?.data?.message || 'Có lỗi xảy ra.');
    }
  };

  const handleRemoveBlockDate = async (index) => {
    try {
      const updatedBlocks = [...selectedAssetForBlock.blockedDates];
      updatedBlocks.splice(index, 1);
      const res = await api.put(`/assets/${selectedAssetForBlock._id}/block-dates`, { blockedDates: updatedBlocks });
      if (res.data?.success) {
        setSelectedAssetForBlock({ ...selectedAssetForBlock, blockedDates: res.data.data });
        fetchMyInventory();
      }
    } catch (err) {
      Swal.fire(err.response?.data?.message || 'Có lỗi xảy ra.');
    }
  };

  const handleStatusUpdate = async (assetId, newStatus) => {
    try {
      const response = await api.put(`/assets/${assetId}/status`, { status: newStatus });
      if (response.data?.success) {
        Swal.fire(`Cập nhật trạng thái thành công sang: ${newStatus}`);
        fetchMyInventory();
      }
    } catch (err) {
      console.error(err);
      Swal.fire(err.response?.data?.message || 'Không thể cập nhật trạng thái thiết bị.');
    }
  };

  const formatCurrency = (val) => {
    return val.toLocaleString('vi-VN') + ' đ';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-slate-500 font-medium">Đang tải danh sách thiết bị...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Kho Thiết Bị Của Bạn</h2>
          <p className="text-sm text-slate-500">Quản lý trạng thái hiển thị và thông tin thiết bị cho thuê của bạn.</p>
        </div>
        <Link 
          to="/post-asset"
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm py-2.5 px-5 rounded-lg shadow transition-colors flex items-center gap-1.5 active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Thêm Thiết Bị Mới
        </Link>
      </div>

      {/* Grid List of Assets */}
      {assets.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">inventory_2</span>
          <h3 className="font-bold text-slate-700 text-lg mb-1">Kho hàng trống</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">Bạn chưa đăng bán hay cho thuê thiết bị nào. Hãy bắt đầu chia sẻ món đồ đầu tiên ngay hôm nay.</p>
          <Link 
            to="/post-asset"
            className="inline-flex bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm py-2.5 px-5 rounded-lg transition-colors shadow"
          >
            Đăng thiết bị ngay
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {assets.map(asset => {
            const imgUrl = asset.images && asset.images.length > 0 ? asset.images[0] : 'https://placehold.co/400x300?text=No+Image';
            
            return (
              <div 
                key={asset._id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full group"
              >
                {/* Image and Status Tag */}
                <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                  <img 
                    alt={asset.name} 
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" 
                    src={imgUrl} 
                  />
                  {/* Status Overlay Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow backdrop-blur-sm ${
                      asset.status === 'verified' ? 'bg-emerald-500/90 text-white' :
                      asset.status === 'pending_approval' ? 'bg-amber-500/90 text-white' :
                      asset.status === 'maintenance' ? 'bg-blue-500/90 text-white' :
                      asset.status === 'unavailable' ? 'bg-slate-500/90 text-white' :
                      asset.status === 'rejected' ? 'bg-red-500/90 text-white' :
                      'bg-slate-500/90 text-white'
                    }`}>
                      {asset.status === 'verified' && 'Sẵn sàng'}
                      {asset.status === 'pending_approval' && 'Chờ duyệt'}
                      {asset.status === 'maintenance' && 'Bảo trì'}
                      {asset.status === 'unavailable' && 'Tạm tắt'}
                      {asset.status === 'rejected' && 'Từ chối'}
                    </span>
                  </div>

                  {/* Trust Badges */}
                  {asset.badges && asset.badges.length > 0 && (
                    <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
                      {asset.badges.map((b, bi) => (
                        <span 
                          key={bi}
                          className="bg-teal-900/95 text-teal-300 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider shadow border border-teal-500/20"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Details Section */}
                <div className="p-4 flex flex-col flex-grow">
                  <span className="text-[10px] text-teal-600 font-bold uppercase tracking-wider block mb-1">
                    {asset.category}
                  </span>
                  <h3 className="font-bold text-slate-800 text-sm line-clamp-2 min-h-[40px] leading-tight mb-2">
                    {asset.name}
                  </h3>
                  
                  <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                    <div className="flex justify-between">
                      <span>Đơn giá thuê:</span>
                      <span className="font-semibold text-slate-700">{formatCurrency(asset.pricePerDay)}/ngày</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tiền đặt cọc:</span>
                      <span className="font-semibold text-slate-700">{formatCurrency(asset.depositAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Độ mới thiết bị:</span>
                      <span className="font-semibold text-slate-700">{asset.itemConditionRate || 95}%</span>
                    </div>
                  </div>

                  {/* Inspector Notes if rejected */}
                  {asset.status === 'rejected' && asset.verificationNotes && (
                    <div className="bg-red-50 border border-red-150 rounded-lg p-2 mb-4 text-[10px] text-red-600">
                      <strong>Lý do từ chối:</strong> {asset.verificationNotes}
                    </div>
                  )}

                  {/* Actions Toggle at Bottom */}
                  <div className="mt-auto pt-3 border-t border-slate-100 flex flex-col gap-2">
                    <Link
                      to={`/post-asset?id=${asset._id}`}
                      className="text-center text-xs font-bold text-slate-700 hover:bg-slate-50 border border-slate-200 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 active:scale-98"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      Chỉnh sửa thông tin
                    </Link>
                    
                    <button
                      onClick={() => openBlockModal(asset)}
                      className="text-center text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 active:scale-98"
                    >
                      <span className="material-symbols-outlined text-sm">event_busy</span>
                      Quản lý lịch bận
                    </button>

                    {asset.status === 'pending_approval' && (
                      <p className="text-[11px] text-slate-400 italic text-center py-1">
                        Thiết bị đang chờ Inspector kiểm duyệt.
                      </p>
                    )}

                    {asset.status === 'rejected' && (
                      <p className="text-[11px] text-red-400 italic text-center py-1">
                        Hồ sơ từ chối. Hãy bấm chỉnh sửa để cập nhật.
                      </p>
                    )}

                    {['verified', 'unavailable', 'maintenance'].includes(asset.status) && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đổi trạng thái nhanh:</label>
                        <div className="flex gap-1">
                          {asset.status !== 'verified' && (
                            <button
                              onClick={() => handleStatusUpdate(asset._id, 'verified')}
                              className="flex-1 text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-250 py-1.5 rounded hover:bg-emerald-100/50 transition-colors"
                            >
                              Sẵn sàng
                            </button>
                          )}
                          {asset.status !== 'maintenance' && (
                            <button
                              onClick={() => handleStatusUpdate(asset._id, 'maintenance')}
                              className="flex-1 text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-250 py-1.5 rounded hover:bg-blue-100/50 transition-colors"
                            >
                              Bảo trì
                            </button>
                          )}
                          {asset.status !== 'unavailable' && (
                            <button
                              onClick={() => handleStatusUpdate(asset._id, 'unavailable')}
                              className="flex-1 text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-250 py-1.5 rounded hover:bg-slate-100/50 transition-colors"
                            >
                              Tạm tắt
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Block Dates Modal */}
      {blockModalOpen && selectedAssetForBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">event_busy</span>
                Quản lý lịch bận
              </h3>
              <button onClick={() => setBlockModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Thiết lập các khoảng thời gian mà bạn không muốn cho thuê thiết bị <strong>{selectedAssetForBlock.name}</strong> (VD: bận việc cá nhân, đi bảo trì). Hệ thống sẽ tự động chặn Renter đặt vào những ngày này.
              </p>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex flex-col gap-3">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Từ ngày</label>
                    <input type="date" value={blockStartDate} onChange={(e) => setBlockStartDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full text-sm p-2 border border-slate-200 rounded-lg outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Đến ngày</label>
                    <input type="date" value={blockEndDate} onChange={(e) => setBlockEndDate(e.target.value)} min={blockStartDate || new Date().toISOString().split('T')[0]} className="w-full text-sm p-2 border border-slate-200 rounded-lg outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400" />
                  </div>
                  <button onClick={handleAddBlockDate} className="bg-amber-500 hover:bg-amber-600 text-white font-bold p-2 rounded-lg flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>

              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Danh sách ngày đã khóa</h4>
              {(!selectedAssetForBlock.blockedDates || selectedAssetForBlock.blockedDates.length === 0) ? (
                <p className="text-sm text-slate-400 italic text-center py-4">Chưa có lịch khóa nào được thiết lập.</p>
              ) : (
                <div className="space-y-2">
                  {selectedAssetForBlock.blockedDates.map((block, index) => (
                    <div key={index} className="flex justify-between items-center bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                      <div className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-sm">calendar_month</span>
                        {new Date(block.startDate).toLocaleDateString('vi-VN')} - {new Date(block.endDate).toLocaleDateString('vi-VN')}
                      </div>
                      {block.reason === 'manual' ? (
                        <button onClick={() => handleRemoveBlockDate(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors" title="Xóa lịch khóa">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      ) : (
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2 py-1 rounded border border-emerald-100">Đã có người thuê</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setBlockModalOpen(false)} className="px-5 py-2 bg-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-300 transition-colors">
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LenderInventory;
