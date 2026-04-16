import React, { useState, useEffect, useCallback, useMemo } from 'react';
import TableLayout from '../components/TableLayout';
import { Filter } from 'lucide-react';

const COLUMNS = [
  { key: 'maLich', label: 'Mã Lịch', sortable: true },
  { key: 'maHv', label: 'Mã HV', sortable: true },
  { key: 'maHlv', label: 'Mã HLV', sortable: true },
  { key: 'ngayTap', label: 'Ngày tập', sortable: true },
  { key: 'khungGioTap', label: 'Khung giờ', sortable: true },
  { key: 'trangThaiLich', label: 'Trạng thái', sortable: true },
  { key: 'tienTapFormatted', label: 'Tiền tập (VNĐ)', sortable: true },
  { key: 'ghiChu', label: 'Ghi chú', sortable: false },
];

export default function ScheduleManagement() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom Modals State
  const [alertMessage, setAlertMessage] = useState('');
  const [scheduleToDelete, setScheduleToDelete] = useState<any>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Sorting
  const [sortKey, setSortKey] = useState<string>('maLich');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  // Filtering
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    maHv: '',
    maHlv: '',
    ngayTap: ''
  });
  
  const [newSchedule, setNewSchedule] = useState({ 
    maLich: '', 
    maHv: '', 
    maHlv: '', 
    ngayTap: new Date().toISOString().split('T')[0], 
    khungGioTap: '08:00 - 09:00',
    tienTap: 0,
    ghiChu: ''
  });
  const [editingSchedule, setEditingSchedule] = useState<any>(null);

  const API_URL = 'http://localhost:5079/api/lichtaps';

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoadingProgress(10);
    try {
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => prev >= 90 ? 90 : prev + 15);
      }, 100);
      
      const [schedulesRes, membersRes, trainersRes, contractsRes] = await Promise.all([
        fetch(API_URL),
        fetch('http://localhost:5079/api/members'),
        fetch('http://localhost:5079/api/huanluyenviens'),
        fetch('http://localhost:5079/api/hopdongs')
      ]);

      const [schedulesData, membersData, trainersData, contractsData] = await Promise.all([
        schedulesRes.ok ? schedulesRes.json() : [],
        membersRes.ok ? membersRes.json() : [],
        trainersRes.ok ? trainersRes.json() : [],
        contractsRes.ok ? contractsRes.json() : []
      ]);
      
      clearInterval(progressInterval);
      setLoadingProgress(100);
      
      // Map properties to camelCase
      const formattedSchedules = schedulesData.map((s: any) => ({
        maLich: s.maLich || s.MaLich,
        maHv: s.maHv || s.MaHv || s.MaHV,
        maHlv: s.maHlv || s.MaHlv || s.MaHLV,
        ngayTap: s.ngayTap || s.NgayTap,
        khungGioTap: s.khungGioTap || s.KhungGioTap || s.gioTap || s.GioTap || '',
        tienTap: s.tienTap !== undefined ? s.tienTap : (s.TienTap || 0),
        ghiChu: s.ghiChu || s.GhiChu || '',
        xacNhan: s.xacNhan || s.XacNhan || false,
        trangThai: s.trangThai || s.TrangThai || ''
      }));

      const formattedMembers = membersData.map((m: any) => {
        const maHv = m.maHv || m.MaHv;
        // Check if member has any Active contract
        const memberContracts = contractsData.filter((c: any) => (c.maHv || c.MaHv || c.MaHV) === maHv);
        const hasActive = memberContracts.some((c: any) => (c.trangThaiHd || c.TrangThaiHd || c.TrangThaiHD) === 'Active');
        
        return {
          maHv: maHv,
          ho: m.ho || m.Ho,
          ten: m.ten || m.Ten,
          trangThai: hasActive ? 'Active' : (m.trangThai || m.TrangThai || '')
        };
      });

      const formattedTrainers = trainersData.map((t: any) => ({
        maHlv: t.maHlv || t.MaHlv || t.MaHLV,
        hoHlv: t.hoHlv || t.HoHlv || t.HoHLV || '',
        nameofHlv: t.nameofHlv || t.NameofHlv || t.NameofHLV || t.tenHlv || t.TenHlv || '',
        tien1TiengTap: t.tien1TiengTap !== undefined ? t.tien1TiengTap : (t.Tien1TiengTap || 0),
        trangThaidilam: t.trangThaidilam || t.TrangThaidilam || 'Đi làm',
        ngayNghiPhep: t.ngayNghiPhep || t.NgayNghiPhep,
        ngayHetPhep: t.ngayHetPhep || t.NgayHetPhep,
        nghiViec: t.nghiViec || t.NghiViec
      }));
      
      setSchedules(formattedSchedules);
      setMembers(formattedMembers);
      setTrainers(formattedTrainers);
      
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
      setLoadingProgress(100);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setLoadingProgress(0);
      }, 300);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const generateMaLich = (ngayTap: string, currentSchedules: any[]) => {
    if (!ngayTap) return '';
    const dateObj = new Date(ngayTap);
    const dd = dateObj.getDate().toString().padStart(2, '0');
    const mm = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const yy = dateObj.getFullYear().toString().slice(-2);
    
    const prefix = `SCH${dd}${mm}${yy}`;
    
    const samePrefixSchedules = currentSchedules.filter(s => s.maLich && s.maLich.startsWith(prefix));
    const numbers = samePrefixSchedules.map(s => {
      const numStr = s.maLich.replace(prefix, '');
      return parseInt(numStr, 10) || 0;
    });
    
    const maxNumber = Math.max(...numbers, 0);
    return `${prefix}${(maxNumber + 1).toString().padStart(2, '0')}`;
  };

  const handleAdd = () => {
    // Get current date in Vietnam (GMT+7)
    const now = new Date();
    const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const today = vnTime.toISOString().split('T')[0];
    
    setNewSchedule({ 
      maLich: generateMaLich(today, schedules), 
      maHv: '', 
      maHlv: '', 
      ngayTap: today, 
      khungGioTap: '08:00 - 09:00',
      tienTap: 0,
      ghiChu: ''
    });
    setShowAddModal(true);
  };

  const processedSchedules = useMemo(() => {
    let result = [...schedules];

    // Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(s => 
        (s.maLich && s.maLich.toLowerCase().includes(lowerSearch)) || 
        (s.maHv && s.maHv.toLowerCase().includes(lowerSearch)) ||
        (s.maHlv && s.maHlv.toLowerCase().includes(lowerSearch))
      );
    }

    // Filters
    if (filters.maHv) result = result.filter(s => s.maHv && s.maHv.toLowerCase().includes(filters.maHv.toLowerCase()));
    if (filters.maHlv) result = result.filter(s => s.maHlv && s.maHlv.toLowerCase().includes(filters.maHlv.toLowerCase()));
    if (filters.ngayTap) result = result.filter(s => s.ngayTap && s.ngayTap.startsWith(filters.ngayTap));

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        let valA = a[sortKey] || '';
        let valB = b[sortKey] || '';
        if (sortKey === 'tienTapFormatted') { valA = a.tienTap; valB = b.tienTap; }
        
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [schedules, filters, sortKey, sortDirection, searchTerm]);

  const totalPages = Math.ceil(processedSchedules.length / ITEMS_PER_PAGE);
  const paginatedSchedules = processedSchedules.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const calculateScheduleStatus = (s: any) => {
    if (s.xacNhan || s.trangThai === 'Tập') return 'Tập';
    
    // Get current time in Vietnam (GMT+7)
    const now = new Date();
    const vnNow = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const todayStr = vnNow.toISOString().split('T')[0];
    const scheduleDateStr = (s.ngayTap || '').split('T')[0];

    if (scheduleDateStr > todayStr) return 'Chờ';
    if (scheduleDateStr < todayStr) return 'Huỷ';

    // Same day: Compare current Vietnam time with schedule end time
    const currentMinutes = vnNow.getUTCHours() * 60 + vnNow.getUTCMinutes();
    try {
      const endTimeStr = s.khungGioTap.split('-')[1]?.trim();
      if (endTimeStr) {
        // Handle both HH:mm and HH:mm AM/PM if browser sends it
        const [time, period] = endTimeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        
        if (period === 'PM' || period === 'CH') {
          if (hours < 12) hours += 12;
        } else if (period === 'AM' || period === 'SA') {
          if (hours === 12) hours = 0;
        }
        
        const endMinutes = hours * 60 + minutes;
        if (currentMinutes > endMinutes) return 'Huỷ';
      }
    } catch (e) {}

    return 'Chờ';
  };

  const displayData = paginatedSchedules.map(s => {
    const status = calculateScheduleStatus(s);
    return {
      ...s,
      ngayTap: formatDate(s.ngayTap),
      tienTapFormatted: formatCurrency(s.tienTap),
      trangThaiLich: (
        <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${
          status === 'Tập' ? 'bg-green-500' : 
          status === 'Huỷ' ? 'bg-red-500' : 'bg-yellow-500'
        }`}>
          {status}
        </span>
      )
    };
  });

  const checkTimeOverlap = (time1: string, time2: string) => {
    if (!time1 || !time2) return false;
    try {
      const [start1, end1] = time1.split('-').map(t => t.trim());
      const [start2, end2] = time2.split('-').map(t => t.trim());
      
      if (!start1 || !end1 || !start2 || !end2) return time1 === time2;

      return start1 < end2 && start2 < end1;
    } catch (e) {
      return time1 === time2;
    }
  };

  const validateSchedule = (schedule: any, isEdit = false) => {
    if (!schedule.maHv) {
      setAlertMessage("Vui lòng chọn học viên!");
      return false;
    }
    if (!schedule.maHlv) {
      setAlertMessage("Vui lòng chọn huấn luyện viên!");
      return false;
    }
    if (!schedule.khungGioTap) {
      setAlertMessage("Vui lòng nhập khung giờ tập!");
      return false;
    }

    // Check for conflicts
    const otherSchedules = isEdit ? schedules.filter(s => s.maLich !== schedule.maLich) : schedules;
    
    for (const other of otherSchedules) {
      if (other.ngayTap && schedule.ngayTap && other.ngayTap.split('T')[0] === schedule.ngayTap.split('T')[0]) {
        if (checkTimeOverlap(schedule.khungGioTap, other.khungGioTap)) {
          // 1. Member conflict
          if (other.maHv === schedule.maHv) {
            setAlertMessage(`Lỗi trùng lịch: Học viên này đã có lịch tập vào khung giờ ${other.khungGioTap} ngày ${formatDate(schedule.ngayTap)}!`);
            return false;
          }
          // 2. Trainer conflict
          if (other.maHlv === schedule.maHlv) {
            setAlertMessage(`Lỗi trùng lịch: Huấn luyện viên này đã có lịch dạy học viên khác vào khung giờ ${other.khungGioTap} ngày ${formatDate(schedule.ngayTap)}!`);
            return false;
          }
        }
      }
    }

    return true;
  };

  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSchedule(newSchedule)) return;

    setShowAddModal(false);
    setIsLoading(true);

    const payload = {
      MaLich: newSchedule.maLich,
      MaHV: newSchedule.maHv,
      MaHLV: newSchedule.maHlv,
      NgayTap: newSchedule.ngayTap,
      KhungGioTap: newSchedule.khungGioTap,
      TienTap: newSchedule.tienTap,
      GhiChu: newSchedule.ghiChu
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setAlertMessage("Thêm lịch tập thành công!");
        fetchData();
      } else {
        const errData = await response.json().catch(() => ({}));
        setAlertMessage(errData.message || "Lỗi khi lưu lịch tập!");
        setIsLoading(false);
      }
    } catch (error) { 
      console.error(error); 
      setAlertMessage("Lỗi kết nối đến máy chủ!");
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSchedule(editingSchedule, true)) return;

    setShowEditModal(false);
    setIsLoading(true);

    const payload = {
      MaLich: editingSchedule.maLich,
      MaHV: editingSchedule.maHv,
      MaHLV: editingSchedule.maHlv,
      NgayTap: editingSchedule.ngayTap,
      KhungGioTap: editingSchedule.khungGioTap,
      TienTap: editingSchedule.tienTap,
      GhiChu: editingSchedule.ghiChu
    };

    try {
      const response = await fetch(`${API_URL}/${editingSchedule.maLich}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setAlertMessage("Cập nhật thành công!");
        fetchData();
      } else {
        const errData = await response.json().catch(() => ({}));
        setAlertMessage(errData.message || "Lỗi khi cập nhật!");
        setIsLoading(false);
      }
    } catch (error) { 
      console.error(error); 
      setAlertMessage("Lỗi kết nối đến máy chủ!");
      setIsLoading(false);
    }
  };

  const handleDelete = (schedule: any) => {
    setScheduleToDelete(schedule);
  };

  const executeDelete = async () => {
    if (!scheduleToDelete) return;
    
    const idToDelete = scheduleToDelete.maLich;
    setScheduleToDelete(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/${idToDelete}`, { method: 'DELETE' });
      if (response.ok) {
        setAlertMessage("Xóa lịch tập thành công!");
        fetchData();
      } else {
        const errData = await response.json().catch(() => ({}));
        setAlertMessage(errData.message || "Không thể xóa lịch tập này!");
        setIsLoading(false);
      }
    } catch (error) { 
      console.error(error); 
      setAlertMessage("Lỗi kết nối đến máy chủ!");
      setIsLoading(false);
    }
  };

  const FilterContent = (
    <div className="relative">
      <button 
        onClick={() => setShowFilter(!showFilter)}
        className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 rounded-md bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Filter className="h-4 w-4 mr-2" />
        Lọc
      </button>
      
      {showFilter && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-20">
          <h3 className="font-medium text-slate-900 mb-3">Lọc dữ liệu</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Học Viên</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-md text-sm"
                value={filters.maHv} 
                onChange={(e) => setFilters({...filters, maHv: e.target.value})}
              >
                <option value="">Tất cả</option>
                {members.map((m: any) => (
                  <option key={m.maHv} value={m.maHv}>{m.maHv} - {m.ho} {m.ten}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Huấn Luyện Viên</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-md text-sm"
                value={filters.maHlv} 
                onChange={(e) => setFilters({...filters, maHlv: e.target.value})}
              >
                <option value="">Tất cả</option>
                {trainers.map((t: any) => (
                  <option key={t.maHlv} value={t.maHlv}>{t.maHlv} - {t.hoHlv} {t.nameofHlv}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ngày tập</label>
              <input type="date" className="w-full p-2 border border-slate-300 rounded-md text-sm"
                value={filters.ngayTap} onChange={(e) => setFilters({...filters, ngayTap: e.target.value})} />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end gap-2">
            <button 
              onClick={() => {
                setFilters({ maHv: '', maHlv: '', ngayTap: '' });
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md"
            >
              Xóa lọc
            </button>
            <button 
              onClick={() => {
                setShowFilter(false);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative space-y-6">
      <TableLayout 
        title="Quản lý Lịch Tập" 
        columns={COLUMNS} 
        data={displayData} 
        onAdd={handleAdd} 
        onEdit={(s) => { setEditingSchedule(s); setShowEditModal(true); }} 
        onDelete={handleDelete} 
        isLoading={isLoading}
        loadingProgress={loadingProgress}
        onSort={handleSort}
        sortKey={sortKey}
        sortDirection={sortDirection}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        filterContent={FilterContent}
      />

      {showAddModal && (
        <ScheduleFormModal 
          title="Thêm Lịch Tập" 
          item={newSchedule} 
          setItem={setNewSchedule} 
          onSave={handleSaveNew} 
          onClose={() => setShowAddModal(false)} 
          isEdit={false} 
          members={members}
          trainers={trainers}
          schedules={schedules}
          generateMaLich={generateMaLich}
        />
      )}

      {showEditModal && (
        <ScheduleFormModal 
          title="Chỉnh sửa Lịch Tập" 
          item={editingSchedule} 
          setItem={setEditingSchedule} 
          onSave={handleUpdate} 
          onClose={() => setShowEditModal(false)} 
          isEdit={true} 
          members={members}
          trainers={trainers}
          schedules={schedules}
          generateMaLich={generateMaLich}
        />
      )}

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

      {/* Confirm Delete Modal */}
      {scheduleToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm p-6 bg-white rounded-xl shadow-2xl text-center">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Xác nhận xóa</h3>
            <p className="text-slate-600 mb-6">Bạn có chắc muốn xoá lịch tập {scheduleToDelete.maLich}?</p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setScheduleToDelete(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Hủy
              </button>
              <button 
                onClick={executeDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleFormModal({ title, item, setItem, onSave, onClose, isEdit, members, trainers, schedules, generateMaLich }: any) {
  
  const handleDateChange = (dateStr: string) => {
    let newMaLich = item.maLich;
    if (!isEdit) {
      newMaLich = generateMaLich(dateStr, schedules);
    }
    setItem({ ...item, ngayTap: dateStr, maLich: newMaLich });
  };

  const [startTime, setStartTime] = useState(item.khungGioTap?.split(' - ')[0] || '08:00');
  const [endTime, setEndTime] = useState(item.khungGioTap?.split(' - ')[1] || '09:00');

  useEffect(() => {
    setItem((prev: any) => ({ ...prev, khungGioTap: `${startTime} - ${endTime}` }));
  }, [startTime, endTime]);

  useEffect(() => {
    if (item.maHlv && startTime && endTime) {
      const trainer = trainers.find((t: any) => t.maHlv === item.maHlv);
      if (trainer) {
        const start = new Date(`1970-01-01T${startTime}:00`);
        const end = new Date(`1970-01-01T${endTime}:00`);
        let diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        if (diffHours < 0) diffHours += 24; // Handle overnight shifts if any
        const calculatedTienTap = diffHours > 0 ? diffHours * trainer.tien1TiengTap : 0;
        setItem((prev: any) => ({ ...prev, tienTap: calculatedTienTap }));
      }
    }
  }, [item.maHlv, startTime, endTime, trainers]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl p-6 bg-white rounded-xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>
        <form onSubmit={onSave} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã Lịch</label>
              <input type="text" required disabled={true} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none bg-gray-100 cursor-not-allowed"
                value={item.maLich} placeholder="Tự động sinh" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày tập</label>
              <input type="date" required className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={item.ngayTap?.split('T')[0] || ''} 
                onChange={(e) => handleDateChange(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Học Viên (Chỉ hiện Active)</label>
              <select 
                required 
                className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={item.maHv} 
                onChange={(e) => setItem({...item, maHv: e.target.value})}
              >
                <option value="">-- Chọn học viên --</option>
                {members.filter((m: any) => m.trangThai === 'Active' || m.maHv === item.maHv).map((m: any) => (
                  <option key={m.maHv} value={m.maHv}>{m.ho} {m.ten} - {m.maHv}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Huấn Luyện Viên (Chỉ hiện Đi làm)</label>
              <select 
                required 
                className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={item.maHlv} 
                onChange={(e) => setItem({...item, maHlv: e.target.value})}
              >
                <option value="">-- Chọn HLV --</option>
                {trainers.filter((t: any) => {
                  // Always allow current selection
                  if (t.maHlv === item.maHlv) return true;
                  
                  // Exclude if resigned
                  if (t.trangThaidilam === 'Nghỉ việc') return false;
                  
                  // If on leave, check if schedule date is within leave period
                  if (t.trangThaidilam === 'Nghỉ phép' && t.ngayNghiPhep && t.ngayHetPhep && item.ngayTap) {
                    const scheduleDate = new Date(item.ngayTap).getTime();
                    const leaveStart = new Date(t.ngayNghiPhep).getTime();
                    const leaveEnd = new Date(t.ngayHetPhep).getTime();
                    
                    if (scheduleDate >= leaveStart && scheduleDate <= leaveEnd) {
                      return false; // Trainer is on leave during this time
                    }
                  }
                  
                  return true; // Available
                }).map((t: any) => (
                  <option key={t.maHlv} value={t.maHlv}>{t.hoHlv} {t.nameofHlv} - {t.maHlv}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Giờ bắt đầu</label>
              <input type="time" required className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Giờ kết thúc</label>
              <input type="time" required className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tiền tập (VNĐ)</label>
            <input type="text" disabled className="w-full p-2.5 border border-slate-300 rounded-lg outline-none bg-blue-50 text-blue-700 font-medium cursor-not-allowed"
              value={new Intl.NumberFormat('vi-VN').format(item.tienTap || 0) + ' VNĐ'} />
            <p className="text-xs text-slate-500 mt-1 italic">Tự động tính dựa trên số giờ tập và mức giá của HLV</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ghi chú</label>
            <textarea 
              className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
              value={item.ghiChu} 
              onChange={(e) => setItem({...item, ghiChu: e.target.value})}
              placeholder="Nhập ghi chú thêm..."
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Lưu thông tin</button>
          </div>
        </form>
      </div>
    </div>
  );
}
