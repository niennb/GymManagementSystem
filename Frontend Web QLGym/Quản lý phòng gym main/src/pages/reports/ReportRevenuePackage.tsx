import React, { useState, useEffect } from 'react';
import TableLayout from '../../components/TableLayout';

const COLUMNS = [
  { key: 'maGoiTap', label: 'Mã Gói Tập', sortable: true },
  { key: 'tenGoi', label: 'Tên Gói Tập', sortable: true },
  { key: 'soLuongDangKy', label: 'Số Lượng Đăng Ký', sortable: true },
  { key: 'soGoiActive', label: 'Số Gói Active', sortable: true },
  { key: 'soGoiLocked', label: 'Số Gói Locked', sortable: true },
  { key: 'tongDoanhThuFormatted', label: 'Tổng Doanh Thu', sortable: true },
];

export default function ReportRevenuePackage() {
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
      const [packagesRes, contractsRes] = await Promise.all([
        fetch('http://localhost:5079/api/goitaps'),
        fetch('http://localhost:5079/api/hopdongs')
      ]);

      const packages = packagesRes.ok ? await packagesRes.json() : [];
      const contracts = contractsRes.ok ? await contractsRes.json() : [];

      setLoadingProgress(70);

      const reportData: Record<string, any> = {};

      packages.forEach((p: any) => {
        const maGoi = p.maGoiTap || p.MaGoiTap;
        reportData[maGoi] = {
          maGoiTap: maGoi,
          tenGoi: p.tenGoi || p.TenGoi,
          giaTien: p.giaTien !== undefined ? p.giaTien : (p.GiaTien || 0),
          soLuongDangKy: 0,
          soGoiActive: 0,
          soGoiLocked: 0,
          tongDoanhThu: 0
        };
      });

      contracts.forEach((c: any) => {
        const date = c.ngayBd || c.NgayBd || c.NgayBD;
        if (!date) return;

        const contractYear = date.split('-')[0];
        const contractMonth = date.split('-')[1];

        if (selectedYear && contractYear !== selectedYear) return;
        if (selectedMonth && parseInt(contractMonth, 10).toString() !== selectedMonth) return;

        const maGoi = c.maGoiTap || c.MaGoiTap;
        if (reportData[maGoi]) {
          const soLuong = c.soLuong !== undefined ? c.soLuong : (c.SoLuong || 1);
          reportData[maGoi].soLuongDangKy += soLuong;

          const status = c.trangThaiHd || c.TrangThaiHd || c.TrangThaiHD;
          if (status === 'Active') {
            reportData[maGoi].soGoiActive += soLuong;
            reportData[maGoi].tongDoanhThu += (soLuong * reportData[maGoi].giaTien);
          } else if (status === 'Locked') {
            reportData[maGoi].soGoiLocked += soLuong;
          }
        }
      });

      const formattedData = Object.values(reportData).map((item: any) => ({
        ...item,
        tongDoanhThuFormatted: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.tongDoanhThu)
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
        title="Báo cáo Doanh thu theo Gói tập" 
        columns={COLUMNS} 
        data={data} 
        isLoading={isLoading}
        loadingProgress={loadingProgress}
        searchPlaceholder="Tìm tên gói tập..."
        filterContent={filterContent}
      />
    </div>
  );
}
