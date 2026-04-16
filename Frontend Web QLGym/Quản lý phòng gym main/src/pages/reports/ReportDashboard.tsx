import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Package, Activity, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ReportDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [summaryStats, setSummaryStats] = useState<any>(null);
  
  // Chart filter state
  const [filterType, setFilterType] = useState<'month' | 'year'>('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startMonth, setStartMonth] = useState(1);
  const [endMonth, setEndMonth] = useState(12);
  const [startYear, setStartYear] = useState(new Date().getFullYear() - 2);
  const [endYear, setEndYear] = useState(new Date().getFullYear());

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [contractsRes, schedulesRes, invoicesRes] = await Promise.all([
        fetch('http://localhost:5079/api/hopdongs'),
        fetch('http://localhost:5079/api/lichtaps'),
        fetch('http://localhost:5079/api/hoadons')
      ]);

      const contracts = contractsRes.ok ? await contractsRes.json() : [];
      const schedules = schedulesRes.ok ? await schedulesRes.json() : [];
      const invoices = invoicesRes.ok ? await invoicesRes.json() : [];

      // Generate Chart Data
      let newChartData = [];
      
      // Get current and previous month strings
      const now = new Date();
      const vnNow = new Date(now.getTime() + (7 * 60 * 60 * 1000));
      const currentYear = vnNow.getFullYear();
      const currentMonth = vnNow.getMonth() + 1;
      
      const prevMonthDate = new Date(vnNow);
      prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
      const prevYear = prevMonthDate.getFullYear();
      const prevMonth = prevMonthDate.getMonth() + 1;

      const currentPrefix = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
      const prevPrefix = `${prevYear}-${prevMonth.toString().padStart(2, '0')}`;

      // Summary Stats calculation
      const calculateMonthStats = (prefix: string) => {
        let revenue = 0;
        let contractsCount = 0;
        let sessionsCount = 0;

        invoices.forEach((inv: any) => {
          const date = inv.ngayThanhToan || inv.NgayThanhToan;
          if (date && date.startsWith(prefix)) {
            revenue += Number(inv.soTien !== undefined ? inv.soTien : (inv.SoTien || 0));
          }
        });

        schedules.forEach((sch: any) => {
          const date = sch.ngayTap || sch.NgayTap;
          const status = sch.trangThai || sch.TrangThai || sch.trangThaiLich || '';
          const isConfirmed = sch.xacNhan || sch.XacNhan || status === 'Tập';
          
          if (date && date.startsWith(prefix) && isConfirmed) {
            revenue += Number(sch.tienTap !== undefined ? sch.tienTap : (sch.TienTap || 0));
            sessionsCount++;
          }
        });

        contracts.forEach((c: any) => {
          const date = c.ngayBd || c.NgayBd || c.NgayBD;
          if (date && date.startsWith(prefix)) {
            contractsCount++;
          }
        });

        return { revenue, contractsCount, sessionsCount };
      };

      const currentStats = calculateMonthStats(currentPrefix);
      const prevStats = calculateMonthStats(prevPrefix);

      const calculateTrend = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? "+100%" : "0%";
        const diff = ((curr - prev) / prev) * 100;
        return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
      };

      if (filterType === 'month') {
        for (let m = startMonth; m <= endMonth; m++) {
          const monthStr = m.toString().padStart(2, '0');
          const prefix = `${selectedYear}-${monthStr}`;
          
          let doanhThu = 0;
          let soLuong = 0;

          invoices.forEach((inv: any) => {
            const date = inv.ngayThanhToan || inv.NgayThanhToan;
            if (date && date.startsWith(prefix)) {
              doanhThu += Number(inv.soTien !== undefined ? inv.soTien : (inv.SoTien || 0));
            }
          });

          schedules.forEach((sch: any) => {
            const date = sch.ngayTap || sch.NgayTap;
            const status = sch.trangThai || sch.TrangThai || sch.trangThaiLich || '';
            const isConfirmed = sch.xacNhan || sch.XacNhan || status === 'Tập';
            if (date && date.startsWith(prefix) && isConfirmed) {
              doanhThu += Number(sch.tienTap !== undefined ? sch.tienTap : (sch.TienTap || 0));
            }
          });

          contracts.forEach((c: any) => {
            const date = c.ngayBd || c.NgayBd || c.NgayBD;
            if (date && date.startsWith(prefix)) {
              soLuong++;
            }
          });

          newChartData.push({
            name: `T${m}`,
            doanhThu,
            soLuong
          });
        }
      } else {
        for (let y = startYear; y <= endYear; y++) {
          const prefix = `${y}`;
          
          let doanhThu = 0;
          let soLuong = 0;

          invoices.forEach((inv: any) => {
            const date = inv.ngayThanhToan || inv.NgayThanhToan;
            if (date && date.startsWith(prefix)) {
              doanhThu += Number(inv.soTien !== undefined ? inv.soTien : (inv.SoTien || 0));
            }
          });

          schedules.forEach((sch: any) => {
            const date = sch.ngayTap || sch.NgayTap;
            const status = sch.trangThai || sch.TrangThai || sch.trangThaiLich || '';
            const isConfirmed = sch.xacNhan || sch.XacNhan || status === 'Tập';
            if (date && date.startsWith(prefix) && isConfirmed) {
              doanhThu += Number(sch.tienTap !== undefined ? sch.tienTap : (sch.TienTap || 0));
            }
          });

          contracts.forEach((c: any) => {
            const date = c.ngayBd || c.NgayBd || c.NgayBD;
            if (date && date.startsWith(prefix)) {
              soLuong++;
            }
          });

          newChartData.push({
            name: `${y}`,
            doanhThu,
            soLuong
          });
        }
      }

      setChartData(newChartData);
      setSummaryStats({
        tongDoanhThuThang: currentStats.revenue,
        goiTapMoi: currentStats.contractsCount,
        tongBuoiDay: currentStats.sessionsCount,
        doanhThuTrend: calculateTrend(currentStats.revenue, prevStats.revenue),
        goiTapTrend: calculateTrend(currentStats.contractsCount, prevStats.contractsCount),
        buoiDayTrend: calculateTrend(currentStats.sessionsCount, prevStats.sessionsCount)
      });

    } catch (error) {
      console.error('Lỗi fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading && chartData.length === 0 && !summaryStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-blue-600 font-medium">Đang tải dữ liệu tổng quan...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Tổng quan Báo cáo & Thống kê</h2>
      </div>

      {/* Quick Stats */}
      {summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Tổng doanh thu tháng này" 
            value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(summaryStats.tongDoanhThuThang || 0)} 
            trend={summaryStats.doanhThuTrend || "0%"} 
            isPositive={(summaryStats.doanhThuTrend || "").startsWith("+")} 
            icon={<DollarSign className="h-6 w-6 text-blue-600" />} 
            color="bg-blue-100"
          />
          <StatCard 
            title="Gói tập mới tháng này" 
            value={summaryStats.goiTapMoi || 0} 
            trend={summaryStats.goiTapTrend || "0%"} 
            isPositive={(summaryStats.goiTapTrend || "").startsWith("+")} 
            icon={<Package className="h-6 w-6 text-emerald-600" />} 
            color="bg-emerald-100"
          />
          <StatCard 
            title="Số buổi dạy HLV tháng này" 
            value={summaryStats.tongBuoiDay || 0} 
            trend={summaryStats.buoiDayTrend || "0%"} 
            isPositive={(summaryStats.buoiDayTrend || "").startsWith("+")} 
            icon={<Activity className="h-6 w-6 text-amber-600" />} 
            color="bg-amber-100"
          />
        </div>
      )}

      {/* Chart Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Loại biểu đồ</label>
          <select 
            className="w-full sm:w-40 p-2 border border-slate-300 rounded-md text-sm"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'month' | 'year')}
          >
            <option value="month">Theo tháng</option>
            <option value="year">Theo năm</option>
          </select>
        </div>

        {filterType === 'month' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Năm</label>
              <input 
                type="number" 
                className="w-full sm:w-24 p-2 border border-slate-300 rounded-md text-sm"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Từ tháng</label>
              <select 
                className="w-full sm:w-28 p-2 border border-slate-300 rounded-md text-sm"
                value={startMonth}
                onChange={(e) => setStartMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Đến tháng</label>
              <select 
                className="w-full sm:w-28 p-2 border border-slate-300 rounded-md text-sm"
                value={endMonth}
                onChange={(e) => setEndMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Từ năm</label>
              <input 
                type="number" 
                className="w-full sm:w-28 p-2 border border-slate-300 rounded-md text-sm"
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Đến năm</label>
              <input 
                type="number" 
                className="w-full sm:w-28 p-2 border border-slate-300 rounded-md text-sm"
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
              />
            </div>
          </>
        )}

        <button 
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm disabled:opacity-50"
        >
          <Calendar size={16} />
          Cập nhật biểu đồ
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Biểu đồ Doanh thu</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip formatter={(value: any) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)} />
                <Legend />
                <Line type="monotone" dataKey="doanhThu" name="Doanh thu" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Biểu đồ Lượt đăng ký gói tập</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="soLuong" name="Lượt đăng ký" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, isPositive, icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
          {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>{trend}</span>
        </div>
      </div>
      <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
  );
}
