import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../configs/axios';

const LenderInventory = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleStatusUpdate = async (assetId, newStatus) => {
    try {
      const response = await api.put(`/assets/${assetId}/status`, { status: newStatus });
      if (response.data?.success) {
        alert(`Cập nhật trạng thái thành công sang: ${newStatus}`);
        fetchMyInventory();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Không thể cập nhật trạng thái thiết bị.');
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
                    {asset.status === 'pending_approval' && (
                      <p className="text-[11px] text-slate-400 italic text-center py-1">
                        Thiết bị đang chờ Inspector kiểm duyệt. Vui lòng quay lại sau.
                      </p>
                    )}

                    {asset.status === 'rejected' && (
                      <p className="text-[11px] text-red-400 italic text-center py-1">
                        Hồ sơ từ chối. Hãy cập nhật lại thông tin.
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
    </div>
  );
};

export default LenderInventory;
