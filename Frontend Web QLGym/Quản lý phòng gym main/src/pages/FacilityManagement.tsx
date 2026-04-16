import React, { useState, useEffect, useCallback, useMemo } from 'react';
import TableLayout from '../components/TableLayout';
import { Filter } from 'lucide-react';

const COLUMNS = [
  { key: 'maSp', label: 'Mã SP', sortable: true },
  { key: 'tenSp', label: 'Tên SP', sortable: true },
  { key: 'ngayNhapFormatted', label: 'Ngày nhập', sortable: true },
  { key: 'soLuongCsvc', label: 'Số lượng', sortable: true },
  { key: 'tinhTrangCsvc', label: 'Tình trạng', sortable: true },
  { key: 'chiPhiMuaFormatted', label: 'Chi phí mua', sortable: true },
  { key: 'chiPhiBaoTriFormatted', label: 'Chi phí bảo trì', sortable: true },
  { key: 'soNgayConBaoHanh', label: 'Số ngày còn BH', sortable: true },
];

const TINH_TRANG_CSVC = ['Hoạt động', 'Hỏng', 'Đang bảo trì'];

export default function FacilityManagement({ user }: { user?: any }) {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom Modals State
  const [alertMessage, setAlertMessage] = useState('');
  const [facilityToDelete, setFacilityToDelete] = useState<any>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Sorting
  const [sortKey, setSortKey] = useState<string>('maSp');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  // Filtering
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    namNhap: '',
    soLuongCsvc: '',
    tinhTrangCsvc: ''
  });
  
  const [newFacility, setNewFacility] = useState({ 
    maSp: '', 
    tenSp: '', 
    ngayNhap: new Date().toISOString().split('T')[0], 
    soLuongCsvc: 1, 
    tinhTrangCsvc: 'Hoạt động',
    chiPhiMua: 0,
    chiPhiBaoTri: 0,
    ngayHetHanBaoHanh: '',
    ngayBaoTriCuoi: '',
    chiTietBaoTri: ''
  });
  const [editingFacility, setEditingFacility] = useState<any>(null);

  const API_URL = 'http://localhost:5079/api/cosovatchats';

  const fetchFacilities = useCallback(async () => {
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
      
      // Map properties to camelCase
      const formattedData = data.map((f: any) => {
        const ngayHetHan = f.ngayHetHanBaoHanh || f.NgayHetHanBaoHanh;
        let soNgayConBaoHanh = 0;
        if (ngayHetHan) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const expDate = new Date(ngayHetHan);
          expDate.setHours(0, 0, 0, 0);
          const diffTime = expDate.getTime() - today.getTime();
          soNgayConBaoHanh = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (soNgayConBaoHanh < 0) soNgayConBaoHanh = 0;
        }

        return {
          maSp: f.maSp || f.MaSp || f.maCsvc || f.MaCsvc,
          tenSp: f.tenSp || f.TenSp || f.tenCsvc || f.TenCsvc,
          ngayNhap: f.ngayNhap || f.NgayNhap,
          soLuongCsvc: f.soLuongCsvc !== undefined ? f.soLuongCsvc : (f.SoLuongCsvc || f.soluong || f.Soluong || 0),
          tinhTrangCsvc: f.tinhTrangCsvc || f.TinhTrangCsvc || f.tinhtrang || f.Tinhtrang || 'Hoạt động',
          chiPhiMua: f.chiPhiMua !== undefined ? f.chiPhiMua : (f.ChiPhiMua || 0),
          chiPhiBaoTri: f.chiPhiBaoTri !== undefined ? f.chiPhiBaoTri : (f.ChiPhiBaoTri || 0),
          ngayHetHanBaoHanh: ngayHetHan,
          ngayBaoTriCuoi: f.ngayBaoTriCuoi || f.NgayBaoTriCuoi,
          chiTietBaoTri: f.chiTietBaoTri || f.ChiTietBaoTri || '',
          soNgayConBaoHanh
        };
      });
      
      setFacilities(formattedData);
      
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu CSVC:", error);
      setLoadingProgress(100);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setLoadingProgress(0);
      }, 300);
    }
  }, []);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

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

  const generateMaSP = (ngayNhap: string, currentFacilities: any[]) => {
    if (!ngayNhap) return '';
    const year = new Date(ngayNhap).getFullYear().toString().slice(-2);
    const prefix = `CSVC${year}`;
    
    const samePrefixFacilities = currentFacilities.filter(f => f.maSp && f.maSp.startsWith(prefix));
    const numbers = samePrefixFacilities.map(f => {
      const numStr = f.maSp.replace(prefix, '');
      return parseInt(numStr, 10) || 0;
    });
    
    const maxNumber = Math.max(...numbers, 0);
    return `${prefix}${(maxNumber + 1).toString().padStart(2, '0')}`;
  };

  const handleAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    setNewFacility({ 
      maSp: generateMaSP(today, facilities), 
      tenSp: '', 
      ngayNhap: today, 
      soLuongCsvc: 1, 
      tinhTrangCsvc: 'Hoạt động',
      chiPhiMua: 0,
      chiPhiBaoTri: 0,
      ngayHetHanBaoHanh: '',
      ngayBaoTriCuoi: '',
      chiTietBaoTri: ''
    });
    setShowAddModal(true);
  };

  const processedFacilities = useMemo(() => {
    let result = [...facilities];

    // Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(f => 
        (f.maSp && f.maSp.toLowerCase().includes(lowerSearch)) || 
        (f.tenSp && f.tenSp.toLowerCase().includes(lowerSearch))
      );
    }

    // Filters
    if (filters.tinhTrangCsvc) result = result.filter(f => f.tinhTrangCsvc === filters.tinhTrangCsvc);
    if (filters.soLuongCsvc) result = result.filter(f => f.soLuongCsvc === parseInt(filters.soLuongCsvc));
    if (filters.namNhap) result = result.filter(f => f.ngayNhap && f.ngayNhap.startsWith(filters.namNhap));

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        let valA = a[sortKey] || '';
        let valB = b[sortKey] || '';
        
        if (sortKey === 'ngayNhapFormatted') {
          valA = a.ngayNhap ? new Date(a.ngayNhap).getTime() : 0;
          valB = b.ngayNhap ? new Date(b.ngayNhap).getTime() : 0;
        } else if (sortKey === 'chiPhiMuaFormatted') {
          valA = a.chiPhiMua;
          valB = b.chiPhiMua;
        } else if (sortKey === 'chiPhiBaoTriFormatted') {
          valA = a.chiPhiBaoTri;
          valB = b.chiPhiBaoTri;
        } else if (sortKey === 'soNgayConBaoHanh') {
          valA = a.soNgayConBaoHanh;
          valB = b.soNgayConBaoHanh;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [facilities, filters, sortKey, sortDirection, searchTerm]);

  const totalPages = Math.ceil(processedFacilities.length / ITEMS_PER_PAGE);
  const paginatedFacilities = processedFacilities.slice(
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

  const displayData = paginatedFacilities.map(f => ({
    ...f,
    ngayNhapFormatted: formatDate(f.ngayNhap),
    chiPhiMuaFormatted: formatCurrency(f.chiPhiMua),
    chiPhiBaoTriFormatted: formatCurrency(f.chiPhiBaoTri)
  }));

  const validateFacility = (facility: any, isEdit = false) => {
    if (!facility.tenSp) {
      setAlertMessage("Vui lòng nhập tên sản phẩm!");
      return false;
    }
    if (facility.soLuongCsvc < 0) {
      setAlertMessage("Số lượng không được âm!");
      return false;
    }
    if (facility.chiPhiMua < 0 || facility.chiPhiBaoTri < 0) {
      setAlertMessage("Chi phí không được âm!");
      return false;
    }
    return true;
  };

  const calculateDaysRemaining = (expDateStr: string) => {
    if (!expDateStr) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expDateStr);
    expDate.setHours(0, 0, 0, 0);
    const diffTime = expDate.getTime() - today.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFacility(newFacility)) return;

    setShowAddModal(false);
    setIsLoading(true);

    const payload = {
      MaSP: newFacility.maSp,
      TenSP: newFacility.tenSp,
      NgayNhap: newFacility.ngayNhap,
      SoLuongCSVC: newFacility.soLuongCsvc,
      TinhTrangCSVC: newFacility.tinhTrangCsvc,
      ChiPhiMua: newFacility.chiPhiMua,
      ChiPhiBaoTri: newFacility.chiPhiBaoTri,
      NgayHetHanBaoHanh: newFacility.ngayHetHanBaoHanh || null,
      NgayBaoTriCuoi: newFacility.ngayBaoTriCuoi || null,
      ChiTietBaoTri: newFacility.chiTietBaoTri,
      SoNgayConBaoHanh: calculateDaysRemaining(newFacility.ngayHetHanBaoHanh)
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setAlertMessage("Thêm CSVC thành công!");
        fetchFacilities();
      } else {
        const errData = await response.json().catch(() => ({}));
        setAlertMessage(errData.message || "Lỗi khi lưu CSVC!");
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
    if (!validateFacility(editingFacility, true)) return;

    setShowEditModal(false);
    setIsLoading(true);

    const payload = {
      MaSP: editingFacility.maSp,
      TenSP: editingFacility.tenSp,
      NgayNhap: editingFacility.ngayNhap,
      SoLuongCSVC: editingFacility.soLuongCsvc,
      TinhTrangCSVC: editingFacility.tinhTrangCsvc,
      ChiPhiMua: editingFacility.chiPhiMua,
      ChiPhiBaoTri: editingFacility.chiPhiBaoTri,
      NgayHetHanBaoHanh: editingFacility.ngayHetHanBaoHanh || null,
      NgayBaoTriCuoi: editingFacility.ngayBaoTriCuoi || null,
      ChiTietBaoTri: editingFacility.chiTietBaoTri,
      SoNgayConBaoHanh: calculateDaysRemaining(editingFacility.ngayHetHanBaoHanh)
    };

    try {
      const response = await fetch(`${API_URL}/${editingFacility.maSp}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setAlertMessage("Cập nhật thành công!");
        fetchFacilities();
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

  const handleDelete = (facility: any) => {
    setFacilityToDelete(facility);
  };

  const executeDelete = async () => {
    if (!facilityToDelete) return;
    
    const idToDelete = facilityToDelete.maSp;
    setFacilityToDelete(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/${idToDelete}`, { method: 'DELETE' });
      if (response.ok) {
        setAlertMessage("Xóa CSVC thành công!");
        fetchFacilities();
      } else {
        const errData = await response.json().catch(() => ({}));
        setAlertMessage(errData.message || "Không thể xóa CSVC này!");
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Tình trạng</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-md text-sm"
                value={filters.tinhTrangCsvc}
                onChange={(e) => setFilters({...filters, tinhTrangCsvc: e.target.value})}
              >
                <option value="">Tất cả</option>
                {TINH_TRANG_CSVC.map(tt => <option key={tt} value={tt}>{tt}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Số lượng</label>
              <input type="number" className="w-full p-2 border border-slate-300 rounded-md text-sm"
                value={filters.soLuongCsvc} onChange={(e) => setFilters({...filters, soLuongCsvc: e.target.value})} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Năm nhập</label>
              <input type="number" placeholder="VD: 2026" className="w-full p-2 border border-slate-300 rounded-md text-sm"
                value={filters.namNhap} onChange={(e) => setFilters({...filters, namNhap: e.target.value})} />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end gap-2">
            <button 
              onClick={() => {
                setFilters({ tinhTrangCsvc: '', soLuongCsvc: '', namNhap: '' });
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

  const isReceptionist = user?.role === 'receptionist';

  return (
    <div className="relative space-y-6">
      <TableLayout 
        title="Quản lý Cơ Sở Vật Chất" 
        columns={COLUMNS} 
        data={displayData} 
        onAdd={handleAdd} 
        onEdit={(f) => { setEditingFacility(f); setShowEditModal(true); }} 
        onDelete={handleDelete} 
        onSearch={handleSearch}
        searchPlaceholder="Tìm mã, tên CSVC..." 
        isLoading={isLoading}
        loadingProgress={loadingProgress}
        onSort={handleSort}
        sortKey={sortKey}
        sortDirection={sortDirection}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        filterContent={FilterContent}
        hideAdd={isReceptionist}
        hideDelete={isReceptionist}
      />

      {showAddModal && (
        <FacilityFormModal 
          title="Thêm CSVC" 
          item={newFacility} 
          setItem={setNewFacility} 
          onSave={handleSaveNew} 
          onClose={() => setShowAddModal(false)} 
          isEdit={false} 
          facilities={facilities}
          generateMaSP={generateMaSP}
        />
      )}

      {showEditModal && (
        <FacilityFormModal 
          title="Chỉnh sửa CSVC" 
          item={editingFacility} 
          setItem={setEditingFacility} 
          onSave={handleUpdate} 
          onClose={() => setShowEditModal(false)} 
          isEdit={true} 
          facilities={facilities}
          generateMaSP={generateMaSP}
          isReceptionist={isReceptionist}
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
      {facilityToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm p-6 bg-white rounded-xl shadow-2xl text-center">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Xác nhận xóa</h3>
            <p className="text-slate-600 mb-6">Bạn có chắc muốn xoá CSVC {facilityToDelete.tenSp}?</p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setFacilityToDelete(null)}
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

function FacilityFormModal({ title, item, setItem, onSave, onClose, isEdit, facilities, generateMaSP, isReceptionist }: any) {
  
  const handleDateChange = (dateStr: string) => {
    let newMaSp = item.maSp;
    if (!isEdit) {
      newMaSp = generateMaSP(dateStr, facilities);
    }
    setItem({ ...item, ngayNhap: dateStr, maSp: newMaSp });
  };

  const handleExpDateChange = (dateStr: string) => {
    let soNgay = 0;
    if (dateStr) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expDate = new Date(dateStr);
      expDate.setHours(0, 0, 0, 0);
      const diffTime = expDate.getTime() - today.getTime();
      soNgay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (soNgay < 0) soNgay = 0;
    }
    setItem({ ...item, ngayHetHanBaoHanh: dateStr, soNgayConBaoHanh: soNgay });
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
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã Sản Phẩm</label>
              <input type="text" required disabled={true} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none bg-gray-100 cursor-not-allowed"
                value={item.maSp} placeholder="Tự động sinh" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên Sản Phẩm</label>
              <input type="text" required disabled={isReceptionist} className={`w-full p-2.5 border border-slate-300 rounded-lg outline-none ${isReceptionist ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`}
                value={item.tenSp} onChange={(e) => setItem({...item, tenSp: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày nhập</label>
              <input type="date" required disabled={isReceptionist} className={`w-full p-2.5 border border-slate-300 rounded-lg outline-none ${isReceptionist ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`}
                value={item.ngayNhap?.split('T')[0] || ''} 
                onChange={(e) => handleDateChange(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số lượng</label>
              <input type="number" required min="0" disabled={isReceptionist} className={`w-full p-2.5 border border-slate-300 rounded-lg outline-none ${isReceptionist ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`}
                value={item.soLuongCsvc} 
                onChange={(e) => setItem({...item, soLuongCsvc: parseInt(e.target.value) || 0})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tình trạng</label>
              <select 
                className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={item.tinhTrangCsvc} 
                onChange={(e) => setItem({...item, tinhTrangCsvc: e.target.value})}
              >
                {TINH_TRANG_CSVC.map(tt => <option key={tt} value={tt}>{tt}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chi phí mua (VNĐ)</label>
              <input type="number" required min="0" disabled={isReceptionist} className={`w-full p-2.5 border border-slate-300 rounded-lg outline-none ${isReceptionist ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`}
                value={item.chiPhiMua} 
                onChange={(e) => setItem({...item, chiPhiMua: Number(e.target.value)})} />
              <p className="text-xs text-blue-600 mt-1 italic">{new Intl.NumberFormat('vi-VN').format(item.chiPhiMua)} VNĐ</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chi phí bảo trì (VNĐ)</label>
              <input type="number" required min="0" disabled={isReceptionist} className={`w-full p-2.5 border border-slate-300 rounded-lg outline-none ${isReceptionist ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`}
                value={item.chiPhiBaoTri} 
                onChange={(e) => setItem({...item, chiPhiBaoTri: Number(e.target.value)})} />
              <p className="text-xs text-blue-600 mt-1 italic">{new Intl.NumberFormat('vi-VN').format(item.chiPhiBaoTri)} VNĐ</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày hết hạn bảo hành</label>
              <input type="date" disabled={isReceptionist} className={`w-full p-2.5 border border-slate-300 rounded-lg outline-none ${isReceptionist ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`}
                value={item.ngayHetHanBaoHanh?.split('T')[0] || ''} 
                onChange={(e) => handleExpDateChange(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày bảo trì cuối</label>
              <input type="date" disabled={isReceptionist} className={`w-full p-2.5 border border-slate-300 rounded-lg outline-none ${isReceptionist ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`}
                value={item.ngayBaoTriCuoi?.split('T')[0] || ''} 
                onChange={(e) => setItem({...item, ngayBaoTriCuoi: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số ngày còn bảo hành</label>
              <input type="text" disabled className="w-full p-2.5 border border-slate-300 rounded-lg outline-none bg-gray-100 cursor-not-allowed"
                value={item.soNgayConBaoHanh !== undefined ? item.soNgayConBaoHanh : ''} 
                placeholder="Tự động tính" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chi tiết bảo trì</label>
            <textarea 
              disabled={isReceptionist}
              className={`w-full p-2.5 border border-slate-300 rounded-lg outline-none min-h-[80px] ${isReceptionist ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`}
              value={item.chiTietBaoTri} 
              onChange={(e) => setItem({...item, chiTietBaoTri: e.target.value})}
              placeholder="Nhập chi tiết bảo trì..."
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
