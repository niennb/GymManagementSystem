import React, { useState, useEffect } from 'react';
import TableLayout from '../../components/TableLayout';

const COLUMNS = [
  { key: 'maHLV', label: 'Mã HLV', sortable: true },
  { key: 'tenDayDu', label: 'Tên Đầy Đủ', sortable: true },
  { key: 'chuyenmon', label: 'Chuyên Môn', sortable: true },
  { key: 'tongSoBuoiDay', label: 'Tổng Số Buổi Dạy', sortable: true },
  { key: 'tongThoiGianDay', label: 'Tổng Thời Gian Dạy (Tiếng)', sortable: true },
  { key: 'luongCoBanFormatted', label: 'Lương Cơ Bản', sortable: true },
  { key: 'tongTienKiemDuocFormatted', label: 'Tổng Tiền Kiếm Được', sortable: true },
];

export default function ReportTrainerPerformance() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const fetchData = async () => {
    setIsLoading(true);
    setLoadingProgress(30);
    try {
      const [trainersRes, schedulesRes] = await Promise.all([
        fetch('http://localhost:5079/api/huanluyenviens'),
        fetch('http://localhost:5079/api/lichtaps')
      ]);

      const trainers = trainersRes.ok ? await trainersRes.json() : [];
      const schedules = schedulesRes.ok ? await schedulesRes.json() : [];

      setLoadingProgress(70);

      const reportData: Record<string, any> = {};

      trainers.forEach((t: any) => {
        const maHlv = t.maHlv || t.MaHlv || t.MaHLV;
        const ngayGiaNhap = t.ngayGiaNhap || t.NgayGiaNhap;

        // Check if trainer joined after the selected filter
        if (ngayGiaNhap && selectedYear) {
          const joinYear = parseInt(ngayGiaNhap.split('-')[0], 10);
          const joinMonth = parseInt(ngayGiaNhap.split('-')[1], 10);
          
          if (joinYear > parseInt(selectedYear, 10)) return;
          if (joinYear === parseInt(selectedYear, 10) && selectedMonth && joinMonth > parseInt(selectedMonth, 10)) return;
        }

        reportData[maHlv] = {
          maHLV: maHlv,
          tenDayDu: `${t.hoHlv || t.HoHlv || t.HoHLV || ''} ${t.nameofHlv || t.NameofHlv || t.NameofHLV || t.tenHlv || t.TenHlv || ''}`.trim(),
          chuyenmon: t.chuyenmon || t.Chuyenmon,
          luongCoBan: t.luong || t.Luong || 0,
          tongSoBuoiDay: 0,
          tongThoiGianDay: 0,
          tongTienKiemDuoc: 0
        };
      });

      schedules.forEach((s: any) => {
        const maHlv = s.maHlv || s.MaHlv || s.MaHLV;
        if (!reportData[maHlv]) return;

        // Only count sessions with status "Tập"
        const status = s.trangThai || s.TrangThai || s.trangThaiLich || '';
        const isConfirmed = s.xacNhan || s.XacNhan || status === 'Tập';
        if (!isConfirmed) return;

        const date = s.ngayTap || s.NgayTap;
        if (!date) return;

        const schYear = date.split('-')[0];
        const schMonth = date.split('-')[1];

        if (selectedYear && schYear !== selectedYear) return;
        if (selectedMonth && parseInt(schMonth, 10).toString() !== selectedMonth) return;

        reportData[maHlv].tongSoBuoiDay += 1;
        
        const tienTap = Number(s.tienTap !== undefined ? s.tienTap : (s.TienTap || 0));
        reportData[maHlv].tongTienKiemDuoc += tienTap;

        const khungGio = s.khungGioTap || s.KhungGioTap || s.gioTap || s.GioTap || '';
        if (khungGio && khungGio.includes('-')) {
          const [start, end] = khungGio.split('-');
          const startTime = new Date(`1970-01-01T${start.trim()}:00`);
          const endTime = new Date(`1970-01-01T${end.trim()}:00`);
          let diffHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          if (diffHours < 0) diffHours += 24;
          reportData[maHlv].tongThoiGianDay += diffHours;
        }
      });

      const formattedData = Object.values(reportData).map((item: any) => ({
        ...item,
        tongThoiGianDay: Number(item.tongThoiGianDay.toFixed(2)),
        luongCoBanFormatted: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.luongCoBan),
        tongTienKiemDuocFormatted: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.tongTienKiemDuoc)
      }));
      
      setData(formattedData);
      setLoadingProgress(100);
    } catch (error) {
      console.error('Lỗi fetch data:', error);
    } finally {
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const filterContent = (
    <div className="flex gap-2">
      <select 
        className="border border-slate-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
      >
        <option value="">Tất cả tháng</option>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
          <option key={m} value={m}>Tháng {m}</option>
        ))}
      </select>
      <select 
        className="border border-slate-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        value={selectedYear}
        onChange={(e) => setSelectedYear(e.target.value)}
      >
        <option value="">Tất cả năm</option>
        <option value="2026">2026</option>
        <option value="2025">2025</option>
        <option value="2024">2024</option>
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      <TableLayout 
        title="Báo cáo Hiệu suất Huấn luyện viên" 
        columns={COLUMNS} 
        data={data} 
        isLoading={isLoading}
        loadingProgress={loadingProgress}
        searchPlaceholder="Tìm mã, tên HLV..."
        filterContent={filterContent}
      />
    </div>
  );
}
