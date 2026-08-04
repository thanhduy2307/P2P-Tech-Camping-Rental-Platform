import React, { useEffect, useState } from 'react';
import api from '../../configs/axios';

const LenderTopAssets = () => {
  const [topAssets, setTopAssets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const formatCurrency = (val = 0) => {
    return val.toLocaleString('vi-VN') + ' đ';
  };

  useEffect(() => {
    const fetchTopAssets = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/orders/top-assets');
        if (response.data?.success) {
          setTopAssets(response.data.data);
        }
      } catch (err) {
        console.error('Failed to load lender top assets', err);
        setError('Không thể tải thống kê sản phẩm nổi bật. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchTopAssets();
  }, []);

  const topItems = topAssets?.topAssets || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-slate-500 font-medium">Đang tải thống kê sản phẩm nổi bật...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="bg-slate-900 text-white rounded-xl border border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 relative">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[150px]">leaderboard</span>
          </div>
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-teal-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-300 border border-teal-300/20">
              <span className="material-symbols-outlined text-[16px]">analytics</span>
              Lender analytics
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight">Sản phẩm nổi bật</h2>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Theo dõi thiết bị được thuê nhiều nhất, doanh thu cao nhất và bảng xếp hạng hiệu quả cho thuê của kho thiết bị.
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {topItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-10 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300">leaderboard</span>
          <h3 className="mt-4 text-lg font-bold text-slate-800">Chưa có dữ liệu sản phẩm nổi bật</h3>
          <p className="mt-2 text-sm text-slate-500">
            Khi thiết bị của bạn được thuê, thống kê sản phẩm nổi bật sẽ hiển thị tại đây.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl shadow-lg p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <span className="material-symbols-outlined text-[90px]">local_fire_department</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-amber-100 text-lg">emoji_events</span>
                <span className="text-xs uppercase font-bold tracking-wider text-amber-100">Được thuê nhiều nhất</span>
              </div>
              <h3 className="text-2xl font-extrabold mt-1 tracking-tight truncate">
                {topAssets.mostRented?.asset?.name || 'Chưa xác định'}
              </h3>
              <p className="mt-4 text-amber-50 font-semibold">
                {topAssets.mostRented?.rentalCount || 0} lượt thuê
              </p>
              <p className="mt-1 text-xs text-amber-100">
                Doanh thu: {formatCurrency(topAssets.mostRented?.totalRevenue ?? 0)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-xl shadow-lg p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <span className="material-symbols-outlined text-[90px]">payments</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-emerald-100 text-lg">monitoring</span>
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-100">Doanh thu cao nhất</span>
              </div>
              <h3 className="text-2xl font-extrabold mt-1 tracking-tight truncate">
                {topAssets.mostRevenue?.asset?.name || 'Chưa xác định'}
              </h3>
              <p className="mt-4 text-emerald-50 font-semibold">
                {formatCurrency(topAssets.mostRevenue?.totalRevenue ?? 0)}
              </p>
              <p className="mt-1 text-xs text-emerald-100">
                {topAssets.mostRevenue?.rentalCount || 0} lượt thuê
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-600">format_list_numbered</span>
                Bảng xếp hạng sản phẩm
              </h3>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{topItems.length} sản phẩm</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 text-xs uppercase">
                    <th className="px-6 py-3 w-16">#</th>
                    <th className="px-6 py-3">Sản phẩm</th>
                    <th className="px-6 py-3 text-center">Số lượt thuê</th>
                    <th className="px-6 py-3 text-right">Doanh thu sau phí</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topItems.map((item, idx) => (
                    <tr key={item.asset._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-extrabold text-slate-500">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800">{item.asset.name}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600">
                          {item.rentalCount} lượt
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">
                        {formatCurrency(item.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LenderTopAssets;
