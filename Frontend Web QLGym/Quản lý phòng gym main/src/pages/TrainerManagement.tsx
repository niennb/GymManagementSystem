import React, { useState, useEffect, useCallback, useMemo } from 'react';
import TableLayout from '../components/TableLayout';
import { Filter } from 'lucide-react';

const COLUMNS = [
  { key: 'maHlv', label: 'Mã HLV', sortable: true },
  { key: 'hoHlv', label: 'Họ HLV', sortable: true },
  { key: 'nameofHlv', label: 'Tên HLV', sortable: true },
  { key: 'chuyenmon', label: 'Chuyên Môn', sortable: true },
  { key: 'sdthlv', label: 'Số Điện Thoại', sortable: true },
  { key: 'ngayGiaNhap', label: 'Ngày Gia Nhập', sortable: true },
  { key: 'luongFormatted', label: 'Lương (VNĐ)', sortable: true },
  { key: 'tien1TiengTapFormatted', label: 'Tiền/1h Tập (VNĐ)', sortable: true },
  { key: 'trangThaidilam', label: 'Trạng thái', sortable: true },
];

export default function TrainerManagement() {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom Modals State
  const [alertMessage, setAlertMessage] = useState('');
  const [trainerToDelete, setTrainerToDelete] = useState<any>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Sorting
  const [sortKey, setSortKey] = useState<string>('maHlv');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  // Filtering
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    chuyenmon: '',
    luongRange: '' // '', '<10M', '>10M'
  });
  
  const [newTrainer, setNewTrainer] = useState({ 
    maHlv: '', 
    hoHlv: '', 
    nameofHlv: '', 
    chuyenmon: '', 
    sdthlv: '', 
    ngayGiaNhap: new Date(new Date().getTime() + (7 * 60 * 60 * 1000)).toISOString().split('T')[0],
    luong: 0,
    tien1TiengTap: 0,
    trangThaidilam: 'Đi làm',
    ngayNghiPhep: '',
    ngayHetPhep: '',
    nghiViec: ''
  });
  const [editingTrainer, setEditingTrainer] = useState<any>(null);

  const API_URL = 'http://localhost:5079/api/huanluyenviens';

  const fetchTrainers = useCallback(async () => {
    setIsLoading(true);
    setLoadingProgress(10);
    try {
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => prev >= 90 ? 90 : prev + 15);
      }, 100);
      
      const response = await fetch(API_URL);
      const data = await response.ok ? await response.json() : [];
      
      clearInterval(progressInterval);
      setLoadingProgress(100);
      
      const formattedData = data.map((t: any) => {
        const vnNow = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
        const today = vnNow.toISOString().split('T')[0];
        let currentStatus = t.trangThaidilam || t.TrangThaidilam || 'Đi làm';
        const ngayNghiPhep = t.ngayNghiPhep || t.NgayNghiPhep || '';
        const ngayHetPhep = t.ngayHetPhep || t.NgayHetPhep || '';
        const nghiViec = t.nghiViec || t.NghiViec || '';

        // Rule: Nghỉ việc logic
        if (nghiViec) {
          if (today >= nghiViec.split('T')[0]) {
            currentStatus = 'Nghỉ việc';
          } else {
            currentStatus = 'Đi làm';
          }
        } 
        // Rule: Nghỉ phép logic
        else if (ngayNghiPhep && ngayHetPhep) {
          const start = ngayNghiPhep.split('T')[0];
          const end = ngayHetPhep.split('T')[0];
          if (today >= start && today <= end) {
            currentStatus = 'Nghỉ phép';
          } else {
            currentStatus = 'Đi làm';
          }
        }

        return {
          maHlv: t.maHlv || t.MaHlv || t.MaHLV,
          hoHlv: t.hoHlv || t.HoHlv || t.HoHLV || '',
          nameofHlv: t.nameofHlv || t.NameofHlv || t.NameofHLV || t.tenHlv || t.TenHlv || '',
          chuyenmon: t.chuyenmon || t.Chuyenmon || '',
          sdthlv: t.sdthlv || t.Sdthlv || t.SDTHLV || '',
          ngayGiaNhap: t.ngayGiaNhap || t.NgayGiaNhap || '',
          luong: t.luong !== undefined ? t.luong : (t.Luong || 0),
          tien1TiengTap: t.tien1TiengTap !== undefined ? t.tien1TiengTap : (t.Tien1TiengTap || 0),
          trangThaidilam: currentStatus,
          ngayNghiPhep: ngayNghiPhep,
          ngayHetPhep: ngayHetPhep,
          nghiViec: nghiViec
        };
      });
      
      setTrainers(formattedData);
      
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu HLV:", error);
      setLoadingProgress(100);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setLoadingProgress(0);
      }, 300);
    }
  }, []);

  useEffect(() => {
    fetchTrainers();
  }, [fetchTrainers]);

  const uniqueChuyenMon = useMemo(() => {
    const cmSet = new Set(trainers.map(t => t.chuyenmon).filter(Boolean));
    return Array.from(cmSet);
  }, [trainers]);

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

  const generateMaHLV = (chuyenmon: string, currentTrainers: any[]) => {
    if (!chuyenmon) return '';
    const cleanStr = chuyenmon.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z]/g, '');
    const prefix = `HLV${cleanStr.substring(0, 3).toUpperCase()}`;
    
    const samePrefixTrainers = currentTrainers.filter(t => t.maHlv && t.maHlv.startsWith(prefix));
    const numbers = samePrefixTrainers.map(t => {
      const numStr = t.maHlv.replace(prefix, '');
      return parseInt(numStr, 10) || 0;
    });
    
    const maxNumber = Math.max(...numbers, 0);
    return `${prefix}${(maxNumber + 1).toString().padStart(2, '0')}`;
  };

  const handleAdd = () => {
    setNewTrainer({ 
      maHlv: '', 
      hoHlv: '', 
      nameofHlv: '', 
      chuyenmon: '', 
      sdthlv: '', 
      ngayGiaNhap: new Date(new Date().getTime() + (7 * 60 * 60 * 1000)).toISOString().split('T')[0],
      luong: 0,
      tien1TiengTap: 0,
      trangThaidilam: 'Đi làm',
      ngayNghiPhep: '',
      ngayHetPhep: '',
      nghiViec: ''
    });
    setShowAddModal(true);
  };

  const processedTrainers = useMemo(() => {
    let result = [...trainers];

    // Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(t => 
        (t.maHlv && t.maHlv.toLowerCase().includes(lowerSearch)) || 
        (t.hoHlv && t.hoHlv.toLowerCase().includes(lowerSearch)) ||
        (t.nameofHlv && t.nameofHlv.toLowerCase().includes(lowerSearch)) ||
        (t.sdthlv && t.sdthlv.includes(lowerSearch))
      );
    }

    // Filters
    if (filters.chuyenmon) result = result.filter(t => t.chuyenmon === filters.chuyenmon);
    if (filters.luongRange) {
      if (filters.luongRange === '<10M') result = result.filter(t => t.luong < 10000000);
      if (filters.luongRange === '>=10M') result = result.filter(t => t.luong >= 10000000);
    }

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        let valA = a[sortKey] || '';
        let valB = b[sortKey] || '';
        if (sortKey === 'luongFormatted') { valA = a.luong; valB = b.luong; }
        if (sortKey === 'tien1TiengTapFormatted') { valA = a.tien1TiengTap; valB = b.tien1TiengTap; }
        
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [trainers, filters, sortKey, sortDirection, searchTerm]);

  const totalPages = Math.ceil(processedTrainers.length / ITEMS_PER_PAGE);
  const paginatedTrainers = processedTrainers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const displayData = paginatedTrainers.map(t => ({
    ...t,
    ngayGiaNhap: t.ngayGiaNhap ? new Date(t.ngayGiaNhap).toLocaleDateString('vi-VN') : '',
    luongFormatted: formatCurrency(t.luong),
    tien1TiengTapFormatted: formatCurrency(t.tien1TiengTap),
    trangThaidilam: (
      <div className="relative group inline-block">
        <div className={`px-2 py-1 rounded-full text-xs font-bold text-white cursor-help ${
          t.trangThaidilam === 'Đi làm' ? 'bg-green-500' : 
          t.trangThaidilam === 'Nghỉ việc' ? 'bg-red-500' : 'bg-yellow-500'
        }`}>
          {t.trangThaidilam}
        </div>
        {t.trangThaidilam !== 'Đi làm' && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            <div className="font-bold border-b border-slate-600 mb-1 pb-1">Chi tiết {t.trangThaidilam}</div>
            {t.trangThaidilam === 'Nghỉ phép' && (
              <>
                <div>Bắt đầu: {new Date(t.ngayNghiPhep).toLocaleDateString('vi-VN')}</div>
                <div>Kết thúc: {new Date(t.ngayHetPhep).toLocaleDateString('vi-VN')}</div>
              </>
            )}
            {t.trangThaidilam === 'Nghỉ việc' && (
              <div>Ngày nghỉ: {new Date(t.nghiViec).toLocaleDateString('vi-VN')}</div>
            )}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
          </div>
        )}
      </div>
    )
  }));

  const validateTrainer = (trainer: any, isEdit = false) => {
    if (!trainer.hoHlv || !trainer.nameofHlv) {
      setAlertMessage("Vui lòng nhập đầy đủ họ và tên HLV!");
      return false;
    }
    
    // Validate SDT: exactly 10 digits
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(trainer.sdthlv)) {
      setAlertMessage("Số điện thoại phải bao gồm đúng 10 chữ số!");
      return false;
    }

    // Check unique SDT
    const otherTrainers = isEdit ? trainers.filter(t => t.maHlv !== trainer.maHlv) : trainers;
    if (otherTrainers.some(t => t.sdthlv === trainer.sdthlv)) {
      setAlertMessage("Số điện thoại này đã được đăng ký bởi HLV khác!");
      return false;
    }

    if (trainer.luong < 0) {
      setAlertMessage("Lương không được âm!");
      return false;
    }
    if (trainer.tien1TiengTap < 0) {
      setAlertMessage("Số tiền mỗi tiếng tập không được âm!");
      return false;
    }
    return true;
  };

  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTrainer(newTrainer)) return;

    setShowAddModal(false);
    setIsLoading(true);

    const payload = {
      MaHLV: newTrainer.maHlv,
      hoHLV: newTrainer.hoHlv,
      nameofHLV: newTrainer.nameofHlv,
      Chuyenmon: newTrainer.chuyenmon,
      SDTHLV: newTrainer.sdthlv,
      NgayGiaNhap: newTrainer.ngayGiaNhap,
      Luong: newTrainer.luong,
      Tien1TiengTap: newTrainer.tien1TiengTap,
      TrangThaidilam: newTrainer.trangThaidilam,
      NgayNghiPhep: newTrainer.ngayNghiPhep || null,
      NgayHetPhep: newTrainer.ngayHetPhep || null,
      NghiViec: newTrainer.nghiViec || null
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setAlertMessage("Thêm HLV thành công!");
        fetchTrainers();
      } else {
        const errData = await response.json().catch(() => ({}));
        setAlertMessage(errData.message || "Lỗi khi lưu HLV!");
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
    if (!validateTrainer(editingTrainer, true)) return;

    setShowEditModal(false);
    setIsLoading(true);

    const payload = {
      MaHLV: editingTrainer.maHlv,
      hoHLV: editingTrainer.hoHlv,
      nameofHLV: editingTrainer.nameofHlv,
      Chuyenmon: editingTrainer.chuyenmon,
      SDTHLV: editingTrainer.sdthlv,
      NgayGiaNhap: editingTrainer.ngayGiaNhap,
      Luong: editingTrainer.luong,
      Tien1TiengTap: editingTrainer.tien1TiengTap,
      TrangThaidilam: editingTrainer.trangThaidilam,
      NgayNghiPhep: editingTrainer.ngayNghiPhep || null,
      NgayHetPhep: editingTrainer.ngayHetPhep || null,
      NghiViec: editingTrainer.nghiViec || null
    };

    try {
      const response = await fetch(`${API_URL}/${editingTrainer.maHlv}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setAlertMessage("Cập nhật thành công!");
        fetchTrainers();
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

  const handleDelete = (trainer: any) => {
    setTrainerToDelete(trainer);
  };

  const executeDelete = async () => {
    if (!trainerToDelete) return;
    
    const idToDelete = trainerToDelete.maHlv;
    setTrainerToDelete(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/${idToDelete}`, { method: 'DELETE' });
      if (response.ok) {
        setAlertMessage("Xóa HLV thành công!");
        fetchTrainers();
      } else {
        const errData = await response.json().catch(() => ({}));
        setAlertMessage(errData.message || "Không thể xóa HLV này vì có dữ liệu liên kết!");
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
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-20">
          <h3 className="font-medium text-slate-900 mb-3">Lọc dữ liệu</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Chuyên môn</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-md text-sm"
                value={filters.chuyenmon}
                onChange={(e) => setFilters({...filters, chuyenmon: e.target.value})}
              >
                <option value="">Tất cả</option>
                {uniqueChuyenMon.map(cm => <option key={cm as string} value={cm as string}>{cm as string}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Mức lương</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-md text-sm"
                value={filters.luongRange}
                onChange={(e) => setFilters({...filters, luongRange: e.target.value})}
              >
                <option value="">Tất cả</option>
                <option value="<10M">Dưới 10.000.000 VNĐ</option>
                <option value=">=10M">Từ 10.000.000 VNĐ trở lên</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end gap-2">
            <button 
              onClick={() => {
                setFilters({ chuyenmon: '', luongRange: '' });
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
        title="Quản lý Huấn Luyện Viên" 
        columns={COLUMNS} 
        data={displayData} 
        onAdd={handleAdd} 
        onEdit={(t) => { setEditingTrainer(t); setShowEditModal(true); }} 
        onDelete={handleDelete} 
        onSearch={handleSearch}
        searchPlaceholder="Tìm mã, tên, SĐT..." 
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
        <TrainerFormModal 
          title="Thêm Huấn Luyện Viên" 
          item={newTrainer} 
          setItem={setNewTrainer} 
          onSave={handleSaveNew} 
          onClose={() => setShowAddModal(false)} 
          isEdit={false} 
          trainers={trainers}
          generateMaHLV={generateMaHLV}
        />
      )}

      {showEditModal && (
        <TrainerFormModal 
          title="Chỉnh sửa Huấn Luyện Viên" 
          item={editingTrainer} 
          setItem={setEditingTrainer} 
          onSave={handleUpdate} 
          onClose={() => setShowEditModal(false)} 
          isEdit={true} 
          trainers={trainers}
          generateMaHLV={generateMaHLV}
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
      {trainerToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm p-6 bg-white rounded-xl shadow-2xl text-center">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Xác nhận xóa</h3>
            <p className="text-slate-600 mb-6">Bạn có chắc muốn xoá HLV {trainerToDelete.hoHlv} {trainerToDelete.nameofHlv}?</p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setTrainerToDelete(null)}
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

function TrainerFormModal({ title, item, setItem, onSave, onClose, isEdit, trainers, generateMaHLV }: any) {
  
  const handleChuyenmonChange = (chuyenmon: string) => {
    let newMaHlv = item.maHlv;
    if (!isEdit) {
      newMaHlv = generateMaHLV(chuyenmon, trainers);
    }
    setItem({ ...item, chuyenmon, maHlv: newMaHlv });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    setItem({ ...item, sdthlv: value });
  };

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
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chuyên môn</label>
              <input 
                type="text"
                required
                className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={item.chuyenmon} 
                onChange={(e) => handleChuyenmonChange(e.target.value)}
                placeholder="Nhập chuyên môn"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã HLV</label>
              <input type="text" required disabled={true} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none bg-gray-100 cursor-not-allowed"
                value={item.maHlv} placeholder="Tự động sinh" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Họ HLV</label>
              <input type="text" required className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={item.hoHlv} onChange={(e) => setItem({...item, hoHlv: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên HLV</label>
              <input type="text" required className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={item.nameofHlv} onChange={(e) => setItem({...item, nameofHlv: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số điện thoại</label>
              <input type="text" required className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={item.sdthlv} onChange={handlePhoneChange} placeholder="Nhập 10 chữ số" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày gia nhập</label>
              <input type="date" required className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={item.ngayGiaNhap?.split('T')[0] || ''} onChange={(e) => setItem({...item, ngayGiaNhap: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số tiền mỗi tiếng tập (VNĐ)</label>
              <input type="number" required min="0" className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={item.tien1TiengTap} onChange={(e) => setItem({...item, tien1TiengTap: Number(e.target.value)})} />
              <p className="text-xs text-blue-600 mt-1 italic">{new Intl.NumberFormat('vi-VN').format(item.tien1TiengTap)} VNĐ</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trạng thái đi làm</label>
              <select 
                className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={item.trangThaidilam}
                onChange={(e) => {
                  const val = e.target.value;
                  setItem({
                    ...item, 
                    trangThaidilam: val,
                    ngayNghiPhep: val === 'Nghỉ phép' ? item.ngayNghiPhep : '',
                    ngayHetPhep: val === 'Nghỉ phép' ? item.ngayHetPhep : '',
                    nghiViec: val === 'Nghỉ việc' ? item.nghiViec : ''
                  });
                }}
              >
                <option value="Đi làm">Đi làm</option>
                <option value="Nghỉ phép">Nghỉ phép</option>
                <option value="Nghỉ việc">Nghỉ việc</option>
              </select>
            </div>
          </div>

          {item.trangThaidilam === 'Nghỉ phép' && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bắt đầu nghỉ</label>
                <input type="date" required className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={item.ngayNghiPhep?.split('T')[0] || ''} 
                  onChange={(e) => setItem({...item, ngayNghiPhep: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kết thúc nghỉ</label>
                <input type="date" required min={item.ngayNghiPhep?.split('T')[0]} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={item.ngayHetPhep?.split('T')[0] || ''} 
                  onChange={(e) => setItem({...item, ngayHetPhep: e.target.value})} />
              </div>
            </div>
          )}

          {item.trangThaidilam === 'Nghỉ việc' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày bắt đầu nghỉ việc</label>
              <input type="date" required className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={item.nghiViec?.split('T')[0] || ''} 
                onChange={(e) => setItem({...item, nghiViec: e.target.value})} />
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Lưu thông tin</button>
          </div>
        </form>
      </div>
    </div>
  );
}
