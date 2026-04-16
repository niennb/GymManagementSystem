import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ExportReport({ user }: { user?: any }) {
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [historyList, setHistoryList] = useState<any[]>([]);

  const getLocalTime = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 19);
  };

  const [formData, setFormData] = useState({
    maBaoCao: '',
    tenBaoCao: '',
    nguoiXuat: user?.maNv || '',
    ngayXuat: getLocalTime(),
    noiDungTomTat: ''
  });

  const [reportType, setReportType] = useState('Báo cáo Tổng quan');
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());

  const REPORT_TYPES = [
    'Báo cáo Tổng quan',
    'Báo cáo Doanh thu gói tập',
    'Báo cáo Hiệu suất HLV',
    'Báo cáo Doanh thu theo tháng/năm'
  ];

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [staffRes, historyRes] = await Promise.all([
          fetch('http://localhost:5079/api/nhanviens'),
          fetch('http://localhost:5079/api/lichsuxuatbaocaos')
        ]);
        
        if (staffRes.ok) {
          const staff = await staffRes.json();
          setStaffList(staff);
        }
        
        if (historyRes.ok) {
          const history = await historyRes.json();
          setHistoryList(history);
        }
      } catch (error) {
        console.error('Lỗi fetch data:', error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    // Generate MaBaoCao
    const prefix = 'BC';
    const numbers = historyList.map(h => {
      const ma = h.maBaoCao || h.MaBaoCao || '';
      if (ma.startsWith(prefix)) {
        return parseInt(ma.replace(prefix, ''), 10) || 0;
      }
      return 0;
    });
    const maxNumber = Math.max(...numbers, 0);
    const newMa = `${prefix}${(maxNumber + 1).toString().padStart(2, '0')}`;
    
    // Generate TenBaoCao
    const monthStr = reportMonth.toString().padStart(2, '0');
    const tenBC = `${reportType} ${monthStr}/${reportYear}`;

    setFormData(prev => ({
      ...prev,
      maBaoCao: newMa,
      tenBaoCao: tenBC
    }));
  }, [historyList, reportType, reportMonth, reportYear]);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nguoiXuat) {
      setAlertMessage('Vui lòng chọn người xuất báo cáo');
      return;
    }

    setIsLoading(true);

    try {
      const currentTime = getLocalTime();
      
      // 1. Save to database
      const payload = {
        MaBaoCao: formData.maBaoCao,
        TenBaoCao: formData.tenBaoCao,
        NguoiXuat: formData.nguoiXuat,
        NgayXuat: currentTime,
        NoiDungTomTat: formData.noiDungTomTat
      };

      const response = await fetch('http://localhost:5079/api/lichsuxuatbaocaos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Không thể lưu lịch sử xuất báo cáo');
      }

      // Refresh history list for next ID generation
      const historyRes = await fetch('http://localhost:5079/api/lichsuxuatbaocaos');
      if (historyRes.ok) {
        setHistoryList(await historyRes.json());
      }

      // 2. Generate Excel file
      const wb = XLSX.utils.book_new();
      
      const wsData: any[][] = [
        ['THÔNG TIN BÁO CÁO'],
        ['Mã Báo Cáo', formData.maBaoCao],
        ['Tên Báo Cáo', formData.tenBaoCao],
        ['Người Xuất', staffList.find(s => (s.maNv || s.MaNv) === formData.nguoiXuat)?.tenNv || formData.nguoiXuat],
        ['Ngày Xuất', new Date(currentTime).toLocaleString('vi-VN')],
        ['Nội Dung Tóm Tắt', formData.noiDungTomTat],
        [],
        ['DỮ LIỆU CHI TIẾT']
      ];

      // Fetch actual data based on report type
      if (reportType === 'Báo cáo Doanh thu gói tập') {
        const [packagesRes, contractsRes] = await Promise.all([
          fetch('http://localhost:5079/api/goitaps'),
          fetch('http://localhost:5079/api/hopdongs')
        ]);
        const packages = packagesRes.ok ? await packagesRes.json() : [];
        const contracts = contractsRes.ok ? await contractsRes.json() : [];
        
        const reportData: Record<string, any> = {};
        packages.forEach((p: any) => {
          const maGoi = p.maGoiTap || p.MaGoiTap;
          reportData[maGoi] = {
            maGoiTap: maGoi,
            tenGoi: p.tenGoi || p.TenGoi,
            soLuongDangKy: 0,
            soGoiActive: 0,
            soGoiLocked: 0,
            tongDoanhThu: 0,
            giaTien: p.giaTien !== undefined ? p.giaTien : (p.GiaTien || 0)
          };
        });

        contracts.forEach((c: any) => {
          const date = c.ngayBd || c.NgayBd || c.NgayBD;
          if (!date) return;
          const contractYear = date.split('-')[0];
          const contractMonth = date.split('-')[1];
          if (reportYear.toString() && contractYear !== reportYear.toString()) return;
          if (reportMonth.toString() && parseInt(contractMonth, 10).toString() !== reportMonth.toString()) return;

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

        wsData.push(['Mã Gói Tập', 'Tên Gói Tập', 'Số Lượng Đăng Ký', 'Số Gói Active', 'Số Gói Locked', 'Tổng Doanh Thu']);
        Object.values(reportData).forEach((item: any) => {
          wsData.push([item.maGoiTap, item.tenGoi, item.soLuongDangKy, item.soGoiActive, item.soGoiLocked, item.tongDoanhThu]);
        });
      } else if (reportType === 'Báo cáo Hiệu suất HLV') {
        const [trainersRes, schedulesRes] = await Promise.all([
          fetch('http://localhost:5079/api/huanluyenviens'),
          fetch('http://localhost:5079/api/lichtaps')
        ]);
        const trainers = trainersRes.ok ? await trainersRes.json() : [];
        const schedules = schedulesRes.ok ? await schedulesRes.json() : [];

        const reportData: Record<string, any> = {};
        trainers.forEach((t: any) => {
          const maHlv = t.maHlv || t.MaHlv || t.MaHLV;
          const ngayGiaNhap = t.ngayGiaNhap || t.NgayGiaNhap;
          if (ngayGiaNhap && reportYear) {
            const joinYear = parseInt(ngayGiaNhap.split('-')[0], 10);
            const joinMonth = parseInt(ngayGiaNhap.split('-')[1], 10);
            if (joinYear > reportYear) return;
            if (joinYear === reportYear && reportMonth && joinMonth > reportMonth) return;
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
          const date = s.ngayTap || s.NgayTap;
          if (!date) return;
          const schYear = date.split('-')[0];
          const schMonth = date.split('-')[1];
          if (reportYear.toString() && schYear !== reportYear.toString()) return;
          if (reportMonth.toString() && parseInt(schMonth, 10).toString() !== reportMonth.toString()) return;

          reportData[maHlv].tongSoBuoiDay += 1;
          const tienTap = s.tienTap !== undefined ? s.tienTap : (s.TienTap || 0);
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

        wsData.push(['Mã HLV', 'Tên Đầy Đủ', 'Chuyên Môn', 'Tổng Số Buổi Dạy', 'Tổng Thời Gian Dạy (Tiếng)', 'Lương Cơ Bản', 'Tổng Tiền Kiếm Được']);
        Object.values(reportData).forEach((item: any) => {
          wsData.push([item.maHLV, item.tenDayDu, item.chuyenmon, item.tongSoBuoiDay, Number(item.tongThoiGianDay.toFixed(2)), item.luongCoBan, item.tongTienKiemDuoc]);
        });
      } else if (reportType === 'Báo cáo Doanh thu theo tháng/năm') {
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

        const prefix = `${reportYear}-${reportMonth.toString().padStart(2, '0')}`;

        let doanhThuHoaDon = 0;
        let tongSoHoaDon = 0;
        invoices.forEach((inv: any) => {
          const date = inv.ngayThanhToan || inv.NgayThanhToan;
          if (date && date.startsWith(prefix)) {
            doanhThuHoaDon += (inv.soTien !== undefined ? inv.soTien : (inv.SoTien || 0));
            tongSoHoaDon++;
          }
        });

        let doanhThuTienTap = 0;
        schedules.forEach((sch: any) => {
          const date = sch.ngayTap || sch.NgayTap;
          if (date && date.startsWith(prefix)) {
            doanhThuTienTap += (sch.tienTap !== undefined ? sch.tienTap : (sch.TienTap || 0));
          }
        });

        const tongDoanhThuThang = doanhThuHoaDon + doanhThuTienTap;

        let chiPhiLuongNV = 0;
        staff.forEach((s: any) => {
          const date = s.thoiGianVao || s.ThoiGianVao;
          if (date) {
            const joinYear = parseInt(date.split('-')[0], 10);
            const joinMonth = parseInt(date.split('-')[1], 10);
            if (joinYear < reportYear || (joinYear === reportYear && joinMonth <= reportMonth)) {
              chiPhiLuongNV += (s.luongNv !== undefined ? s.luongNv : (s.LuongNv || s.LuongNV || 0));
            }
          }
        });

        let chiPhiLuongHLV = 0;
        trainers.forEach((t: any) => {
          const date = t.ngayGiaNhap || t.NgayGiaNhap;
          if (date) {
            const joinYear = parseInt(date.split('-')[0], 10);
            const joinMonth = parseInt(date.split('-')[1], 10);
            if (joinYear < reportYear || (joinYear === reportYear && joinMonth <= reportMonth)) {
              chiPhiLuongHLV += (t.luong !== undefined ? t.luong : (t.Luong || 0));
            }
          }
        });

        const chiPhiLuong = chiPhiLuongNV + chiPhiLuongHLV;

        let chiPhiBaoTri = 0;
        let chiPhiMuaSam = 0;
        facilities.forEach((f: any) => {
          const date = f.ngayNhap || f.NgayNhap;
          if (date) {
            const joinYear = parseInt(date.split('-')[0], 10);
            const joinMonth = parseInt(date.split('-')[1], 10);
            if (joinYear < reportYear || (joinYear === reportYear && joinMonth <= reportMonth)) {
              chiPhiBaoTri += (f.chiPhiBaoTri !== undefined ? f.chiPhiBaoTri : (f.ChiPhiBaoTri || 0));
            }
            if (joinYear === reportYear && joinMonth === reportMonth) {
              chiPhiMuaSam += (f.chiPhiMua !== undefined ? f.chiPhiMua : (f.ChiPhiMua || 0));
            }
          }
        });

        const tongChiPhi = chiPhiLuong + chiPhiBaoTri + chiPhiMuaSam;
        const loiNhuanThuan = tongDoanhThuThang - tongChiPhi;
        const giaTriTrungBinhHoaDon = tongSoHoaDon > 0 ? doanhThuHoaDon / tongSoHoaDon : 0;

        wsData.push(['Chỉ Tiêu', 'Giá Trị']);
        wsData.push(['Tổng Doanh Thu Tháng', tongDoanhThuThang]);
        wsData.push(['- Doanh thu hóa đơn', doanhThuHoaDon]);
        wsData.push(['- Doanh thu tiền tập', doanhThuTienTap]);
        wsData.push(['Tổng Chi Phí', tongChiPhi]);
        wsData.push(['- Chi phí lương (NV & HLV)', chiPhiLuong]);
        wsData.push(['- Chi phí bảo trì CSVC', chiPhiBaoTri]);
        wsData.push(['- Chi phí mua sắm CSVC', chiPhiMuaSam]);
        wsData.push(['Lợi Nhuận Thuần', loiNhuanThuan]);
        wsData.push(['Tổng Số Hóa Đơn', tongSoHoaDon]);
        wsData.push(['Giá Trị Trung Bình/Hóa Đơn', giaTriTrungBinhHoaDon]);
      } else {
        wsData.push(['(Dữ liệu chi tiết sẽ được xuất tại đây tùy theo loại báo cáo)']);
      }
      
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Style columns
      ws['!cols'] = [{ wch: 20 }, { wch: 50 }];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Báo Cáo');
      
      // Download file
      const fileName = `${formData.tenBaoCao.replace(/[\/\\]/g, '-')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      setAlertMessage('Xuất báo cáo thành công! File Excel đã được tải về.');
      
      // Reset form summary
      setFormData(prev => ({
        ...prev,
        noiDungTomTat: '',
        ngayXuat: new Date().toISOString().slice(0, 19)
      }));

    } catch (error: any) {
      console.error(error);
      setAlertMessage(error.message || 'Có lỗi xảy ra khi xuất báo cáo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Xuất Báo Cáo</h2>
            <p className="text-sm text-slate-500">Điền thông tin và tải xuống file Excel báo cáo</p>
          </div>
        </div>

        <form onSubmit={handleExport} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã Báo Cáo</label>
              <input 
                type="text" 
                disabled 
                className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                value={formData.maBaoCao}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Thời Gian Xuất</label>
              <input 
                type="datetime-local" 
                disabled
                className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                value={formData.ngayXuat}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="md:col-span-3">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Tùy chọn Báo Cáo</h3>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Loại Báo Cáo</label>
              <select 
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                {REPORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tháng</label>
              <select 
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={reportMonth}
                onChange={(e) => setReportMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Năm</label>
              <input 
                type="number" 
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={reportYear}
                onChange={(e) => setReportYear(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên Báo Cáo (Tự động)</label>
            <input 
              type="text" 
              disabled
              className="w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium cursor-not-allowed"
              value={formData.tenBaoCao}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Người Xuất</label>
            <select 
              required
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.nguoiXuat}
              onChange={(e) => setFormData({...formData, nguoiXuat: e.target.value})}
            >
              <option value="">-- Chọn nhân viên --</option>
              {staffList.map(s => (
                <option key={s.maNv || s.MaNv} value={s.maNv || s.MaNv}>
                  {(s.tenNv || s.TenNv) ? `${s.hoNv || s.HoNv || ''} ${s.tenNv || s.TenNv} - ${s.maNv || s.MaNv}` : (s.maNv || s.MaNv)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nội Dung Tóm Tắt</label>
            <textarea 
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
              placeholder="Nhập nội dung tóm tắt cho báo cáo này..."
              value={formData.noiDungTomTat}
              onChange={(e) => setFormData({...formData, noiDungTomTat: e.target.value})}
            ></textarea>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button 
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Download size={20} />
              )}
              Xuất File Excel
            </button>
          </div>
        </form>
      </div>

      {/* Alert Modal */}
      {alertMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm p-6 bg-white rounded-xl shadow-2xl text-center">
            <h3 className="text-lg font-medium text-slate-900 mb-4">{alertMessage}</h3>
            <button 
              onClick={() => setAlertMessage('')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
