import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, DollarSign, Activity, CreditCard } from 'lucide-react';

export default function ReportRevenueMonth() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const [invoicesRes, schedulesRes, staffRes, trainersRes, facilitiesRes] = await Promise.all([
        fetch('http://localhost:5079/api/hoadons'),
        fetch('http://localhost:5079/api/lichtaps'),
        fetch('http://localhost:5079/api/nhanviens'),
        fetch('http://localhost:5079/api/huanluyenviens'),
        fetch('http://localhost:5079/api/cosovatchats')
      ]);

      const invoices = invoicesRes.ok ? await invoicesRes.json() : [];
      const schedules = schedulesRes.ok ? await schedulesRes.json() : [];
      const staff = staffRes.ok ? await staffRes.json() : [];
      const trainers = trainersRes.ok ? await trainersRes.json() : [];
      const facilities = facilitiesRes.ok ? await facilitiesRes.json() : [];

      const prefix = `${year}-${month.toString().padStart(2, '0')}`;

      // 1. Doanh thu
      let doanhThuHoaDon = 0;
      let tongSoHoaDon = 0;
      invoices.forEach((inv: any) => {
        const date = inv.ngayThanhToan || inv.NgayThanhToan;
        if (date && date.startsWith(prefix)) {
          doanhThuHoaDon += Number(inv.soTien !== undefined ? inv.soTien : (inv.SoTien || 0));
          tongSoHoaDon++;
        }
      });

      let doanhThuTienTap = 0;
      schedules.forEach((sch: any) => {
        const date = sch.ngayTap || sch.NgayTap;
        const status = sch.trangThai || sch.TrangThai || sch.trangThaiLich || '';
        const isConfirmed = sch.xacNhan || sch.XacNhan || status === 'Tập';
        
        if (date && date.startsWith(prefix) && isConfirmed) {
          doanhThuTienTap += Number(sch.tienTap !== undefined ? sch.tienTap : (sch.TienTap || 0));
        }
      });

      const tongDoanhThuThang = doanhThuHoaDon + doanhThuTienTap;

      // Helper to calculate salary based on status and dates
      const calculateAdjustedSalary = (person: any, isStaff: boolean) => {
        const baseSalary = Number(isStaff 
          ? (person.luongNv !== undefined ? person.luongNv : (person.LuongNv || person.LuongNV || person.luong || person.Luong || 0))
          : (person.luong !== undefined ? person.luong : (person.Luong || 0))
        );
        
        const joinDateStr = isStaff ? (person.thoiGianVao || person.ThoiGianVao) : (person.ngayGiaNhap || person.NgayGiaNhap);
        if (!joinDateStr) return 0;

        const joinDate = new Date(joinDateStr);
        const joinY = joinDate.getFullYear();
        const joinM = joinDate.getMonth() + 1;

        // If joined after the selected month, salary is 0
        if (joinY > year || (joinY === year && joinM > month)) return 0;

        const status = person.trangThaidilam || person.TrangThaidilam || 'Đi làm';

        if (status === 'Đi làm') {
          return baseSalary;
        }

        if (status === 'Nghỉ việc') {
          const resignDateStr = person.nghiViec || person.NghiViec;
          if (!resignDateStr) return baseSalary;

          const resignDate = new Date(resignDateStr);
          const resignY = resignDate.getFullYear();
          const resignM = resignDate.getMonth() + 1;

          // If resigned before the selected month
          if (resignY < year || (resignY === year && resignM < month)) return 0;
          
          // If resigned during the selected month
          if (resignY === year && resignM === month) {
            const daysWorked = resignDate.getDate(); // Days worked before resignation
            return (baseSalary / 30) * daysWorked;
          }

          // If resigned after the selected month
          return baseSalary;
        }

        if (status === 'Nghỉ phép') {
          const startLeaveStr = person.ngayNghiPhep || person.NgayNghiPhep;
          const endLeaveStr = person.ngayHetPhep || person.NgayHetPhep;
          
          if (!startLeaveStr || !endLeaveStr) return baseSalary;

          const startLeave = new Date(startLeaveStr);
          const endLeave = new Date(endLeaveStr);
          
          const startY = startLeave.getFullYear();
          const startM = startLeave.getMonth() + 1;
          const endY = endLeave.getFullYear();
          const endM = endLeave.getMonth() + 1;

          // Check if leave overlaps with selected month
          const isOverlapping = (
            (startY < year || (startY === year && startM <= month)) &&
            (endY > year || (endY === year && endM >= month))
          );

          if (isOverlapping) {
            // Calculate leave days in this month
            // For simplicity and following user formula: Lương – (Lương/30 x (Ngày kết thúc nghỉ – Ngày bắt đầu nghỉ))
            // We calculate the difference in days
            const diffTime = Math.abs(endLeave.getTime() - startLeave.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            
            // Ensure we don't subtract more than the whole month if leave is long
            const leaveDaysInMonth = Math.min(diffDays, 30); 
            return baseSalary - ((baseSalary / 30) * leaveDaysInMonth);
          }

          return baseSalary;
        }

        return baseSalary;
      };

      // 2. Chi phí
      let chiPhiLuongNV = 0;
      staff.forEach((s: any) => {
        chiPhiLuongNV += calculateAdjustedSalary(s, true);
      });

      let chiPhiLuongHLV = 0;
      trainers.forEach((t: any) => {
        chiPhiLuongHLV += calculateAdjustedSalary(t, false);
      });

      const chiPhiLuong = chiPhiLuongNV + chiPhiLuongHLV;

      let chiPhiBaoTri = 0;
      let chiPhiMuaSam = 0;
      facilities.forEach((f: any) => {
        const date = f.ngayNhap || f.NgayNhap;
        if (date) {
          const joinYear = parseInt(date.split('-')[0], 10);
          const joinMonth = parseInt(date.split('-')[1], 10);
          
          // Chi phí bảo trì: ghi nhận nếu tháng lọc >= tháng nhập
          if (joinYear < year || (joinYear === year && joinMonth <= month)) {
            chiPhiBaoTri += Number(f.chiPhiBaoTri !== undefined ? f.chiPhiBaoTri : (f.ChiPhiBaoTri || 0));
          }
          
          // Chi phí mua sắm: chỉ ghi nhận đúng vào tháng nhập
          if (joinYear === year && joinMonth === month) {
            chiPhiMuaSam += Number(f.chiPhiMua !== undefined ? f.chiPhiMua : (f.ChiPhiMua || 0));
          }
        }
      });

      const tongChiPhi = chiPhiLuong + chiPhiBaoTri + chiPhiMuaSam;
      const loiNhuanThuan = tongDoanhThuThang - tongChiPhi;
      const giaTriTrungBinhHoaDon = tongSoHoaDon > 0 ? doanhThuHoaDon / tongSoHoaDon : 0;

      setData({
        tongDoanhThuThang,
        doanhThuHoaDon,
        doanhThuTienTap,
        tongChiPhi,
        chiPhiLuong,
        chiPhiLuongNV,
        chiPhiLuongHLV,
        chiPhiBaoTri,
        chiPhiMuaSam,
        loiNhuanThuan,
        tongSoHoaDon,
        giaTriTrungBinhHoaDon
      });
    } catch (error) {
      console.error('Lỗi fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Báo cáo Doanh thu & Lợi nhuận theo Tháng/Năm</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 items-end mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tháng</label>
            <select 
              className="w-full sm:w-32 p-2 border border-slate-300 rounded-md"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Năm</label>
            <input 
              type="number" 
              className="w-full sm:w-32 p-2 border border-slate-300 rounded-md"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
          <button 
            onClick={fetchReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Search size={18} />
            Xem báo cáo
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="text-blue-600" size={20} />
                  <p className="text-sm font-medium text-blue-600">Tổng doanh thu tháng</p>
                </div>
                <p className="text-3xl font-bold text-slate-900">{formatCurrency(data.tongDoanhThuThang)}</p>
                <div className="mt-2 text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between"><span>Tiền hoá đơn:</span> <span>{formatCurrency(data.doanhThuHoaDon)}</span></div>
                  <div className="flex justify-between"><span>Tiền lịch tập:</span> <span>{formatCurrency(data.doanhThuTienTap)}</span></div>
                </div>
              </div>
              
              <div className="bg-rose-50 p-6 rounded-lg border border-rose-100 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="text-rose-600" size={20} />
                  <p className="text-sm font-medium text-rose-600">Tổng chi phí phòng gym</p>
                </div>
                <p className="text-3xl font-bold text-slate-900">{formatCurrency(data.tongChiPhi)}</p>
                <div className="mt-2 text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between"><span>Lương NV & HLV:</span> <span>{formatCurrency(data.chiPhiLuong)}</span></div>
                  <div className="flex justify-between"><span>Bảo trì CSVC:</span> <span>{formatCurrency(data.chiPhiBaoTri)}</span></div>
                  <div className="flex justify-between"><span>Nhập mua CSVC:</span> <span>{formatCurrency(data.chiPhiMuaSam)}</span></div>
                </div>
              </div>

              <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-100 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="text-emerald-600" size={20} />
                  <p className="text-sm font-medium text-emerald-600">Lợi nhuận thuần</p>
                </div>
                <p className="text-3xl font-bold text-slate-900">{formatCurrency(data.loiNhuanThuan)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="text-slate-600" size={20} />
                  <p className="text-sm font-medium text-slate-600">Tổng số hóa đơn</p>
                </div>
                <p className="text-3xl font-bold text-slate-900">{data.tongSoHoaDon}</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="text-slate-600" size={20} />
                  <p className="text-sm font-medium text-slate-600">Giá trị trung bình/Hóa đơn</p>
                </div>
                <p className="text-3xl font-bold text-slate-900">{formatCurrency(data.giaTriTrungBinhHoaDon)}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
