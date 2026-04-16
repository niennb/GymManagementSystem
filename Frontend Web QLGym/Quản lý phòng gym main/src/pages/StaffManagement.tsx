import React, { useState, useEffect, useCallback, useMemo } from 'react';
import TableLayout from '../components/TableLayout';
import { ChevronLeft, ChevronRight, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const COLUMNS = [
  { key: 'maNv', label: 'Mã NV' },
  { key: 'matkhau', label: 'Mật khẩu' },
  { key: 'hoNv', label: 'Họ NV' },
  { key: 'tenNv', label: 'Tên NV' },
  { key: 'chucvu', label: 'Chức vụ' },
  { key: 'sdtnv', label: 'SĐT' },
  { key: 'emailNv', label: 'Email' },
  { key: 'ngaySinhNvFormatted', label: 'Ngày sinh' },
  { key: 'thoiGianVaoFormatted', label: 'Ngày vào làm' },
  { key: 'luongFormatted', label: 'Lương (VNĐ)' },
  { key: 'trangThaidilam', label: 'Trạng thái' },
];

const POSITIONS = [
  { label: 'Lễ tân', value: 'Lễ tân', prefix: 'LT' },
  { label: 'Quản lý', value: 'Quản lý', prefix: 'QL' },
  { label: 'Admin', value: 'Admin', prefix: 'AD' },
  { label: 'Bảo vệ', value: 'Bảo vệ', prefix: 'BV' },
  { label: 'Tạp vụ', value: 'Tạp vụ', prefix: 'TV' },
];

function StaffManagement() {
  const [staff, setStaff] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sorting
  const [sortKey, setSortKey] = useState<string>('maNv');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  // Filtering
  const [filterRole, setFilterRole] = useState('All');
  const [filterSalary, setFilterSalary] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Custom Modals State
  const [alertMessage, setAlertMessage] = useState('');
  const [staffToDelete, setStaffToDelete] = useState<any>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const [newStaff, setNewStaff] = useState({ 
    maNv: '', 
    matkhau: '', 
    hoNv: '', 
    tenNv: '', 
    chucvu: 'Lễ tân', 
    sdtnv: '', 
    emailNv: '', 
    ngaySinhNv: '', 
    thoiGianVao: new Date(new Date().getTime() + (7 * 60 * 60 * 1000)).toISOString().split('T')[0],
    luong: 0,
    trangThaidilam: 'Đi làm',
    ngayNghiPhep: '',
    ngayHetPhep: '',
    nghiViec: ''
  });
  
  const [editingStaff, setEditingStaff] = useState<any>(null);

  const API_URL = 'http://localhost:5079/api/nhanviens';

  const formatCurrency = (amount: any) => {
    const value = Number(amount);
    if (isNaN(value)) return '0';
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const fetchStaff = useCallback(async (search = '') => {
    setIsLoading(true);
    setLoadingProgress(10);
    try {
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => prev >= 90 ? 90 : prev + 15);
      }, 100);

      const response = await fetch(`${API_URL}?search=${search}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      
      clearInterval(progressInterval);
      setLoadingProgress(100);
      
      const formattedData = data.map((s: any) => {
        const vnNow = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
        const today = vnNow.toISOString().split('T')[0];
        let currentStatus = s.trangThaidilam || s.TrangThaidilam || 'Đi làm';
        const ngayNghiPhep = s.ngayNghiPhep || s.NgayNghiPhep || '';
        const ngayHetPhep = s.ngayHetPhep || s.NgayHetPhep || '';
        const nghiViec = s.nghiViec || s.NghiViec || '';

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

        // Map everything to a consistent internal camelCase format
        const item = {
          maNv: s.maNv || s.MaNv,
          matkhau: s.matkhau || s.Matkhau,
          hoNv: s.hoNv || s.HoNv,
          tenNv: s.tenNv || s.TenNv,
          chucvu: s.chucvu || s.Chucvu,
          sdtnv: s.sdtnv || s.Sdtnv,
          emailNv: s.emailNv || s.EmailNv,
          ngaySinhNv: s.ngaySinhNv || s.NgaySinhNv,
          thoiGianVao: s.thoiGianVao || s.ThoiGianVao,
          luong: Number(s.luongNv !== undefined ? s.luongNv : (s.LuongNv || s.luong || s.Luong || 0)),
          trangThaidilam: currentStatus,
          ngayNghiPhep: ngayNghiPhep,
          ngayHetPhep: ngayHetPhep,
          nghiViec: nghiViec
        };
        return {
          ...item,
          luongFormatted: formatCurrency(item.luong),
          ngaySinhNvFormatted: formatDate(item.ngaySinhNv),
          thoiGianVaoFormatted: formatDate(item.thoiGianVao)
        };
      });
      
      setStaff(formattedData);

    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu NV:", error);
      setLoadingProgress(100);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setLoadingProgress(0);
      }, 300);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStaff(searchTerm);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchStaff]);

  // Auto-generate MaNV logic
  const generateMaNV = useCallback((role: string, dateStr: string) => {
    const prefix = POSITIONS.find(p => p.value === role)?.prefix || 'NV';
    const vnNow = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
    const year = dateStr ? new Date(dateStr).getFullYear().toString().slice(-2) : vnNow.getFullYear().toString().slice(-2);
    
    // Find highest sequence for this role and year
    const sameRoleYear = staff.filter(s => s.maNv.startsWith(`${prefix}${year}`));
    let nextSeq = 1;
    if (sameRoleYear.length > 0) {
      const sequences = sameRoleYear.map(s => {
        const seqStr = s.maNv.slice(4);
        return parseInt(seqStr);
      }).filter(n => !isNaN(n));
      
      if (sequences.length > 0) {
        nextSeq = Math.max(...sequences) + 1;
      }
    }
    
    return `${prefix}${year}${nextSeq.toString().padStart(2, '0')}`;
  }, [staff]);

  useEffect(() => {
    if (showAddModal && !newStaff.maNv) {
      setNewStaff(prev => ({ ...prev, maNv: generateMaNV(prev.chucvu, prev.thoiGianVao) }));
    }
  }, [showAddModal, newStaff.chucvu, newStaff.thoiGianVao, generateMaNV, newStaff.maNv]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const validateStaff = (member: any, isEdit = false) => {
    if (member.sdtnv.length !== 10 || !/^\d+$/.test(member.sdtnv)) {
      setAlertMessage("Lỗi: Số điện thoại phải có đúng 10 chữ số!");
      return false;
    }
    if (!member.emailNv.includes('@')) {
      setAlertMessage("Lỗi: Email không hợp lệ (thiếu ký tự @)!");
      return false;
    }
    return true;
  };

  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStaff(newStaff)) return;

    // Map to PascalCase for .NET Backend
    const payload = {
      MaNv: newStaff.maNv,
      Matkhau: newStaff.matkhau,
      HoNv: newStaff.hoNv,
      TenNv: newStaff.tenNv,
      Chucvu: newStaff.chucvu,
      Sdtnv: newStaff.sdtnv,
      EmailNv: newStaff.emailNv,
      NgaySinhNv: newStaff.ngaySinhNv,
      ThoiGianVao: newStaff.thoiGianVao,
      LuongNv: newStaff.luong,
      TrangThaidilam: newStaff.trangThaidilam,
      NgayNghiPhep: newStaff.ngayNghiPhep || null,
      NgayHetPhep: newStaff.ngayHetPhep || null,
      NghiViec: newStaff.nghiViec || null
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setAlertMessage("Thêm nhân viên thành công!");
        setShowAddModal(false);
        setNewStaff({ 
          maNv: '', 
          matkhau: '', 
          hoNv: '', 
          tenNv: '', 
          chucvu: 'Lễ tân', 
          sdtnv: '', 
          emailNv: '', 
          ngaySinhNv: '', 
          thoiGianVao: new Date(new Date().getTime() + (7 * 60 * 60 * 1000)).toISOString().split('T')[0],
          luong: 0,
          trangThaidilam: 'Đi làm',
          ngayNghiPhep: '',
          ngayHetPhep: '',
          nghiViec: ''
        });
        fetchStaff();
      } else {
        const errorMsg = await response.text();
        setAlertMessage(errorMsg || "Lỗi khi lưu nhân viên!");
      }
    } catch (error) { 
      console.error(error); 
      setAlertMessage("Lỗi kết nối đến máy chủ!");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStaff(editingStaff, true)) return;

    // Map to PascalCase for .NET Backend
    const payload = {
      MaNv: editingStaff.maNv,
      Matkhau: editingStaff.matkhau,
      HoNv: editingStaff.hoNv,
      TenNv: editingStaff.tenNv,
      Chucvu: editingStaff.chucvu,
      Sdtnv: editingStaff.sdtnv,
      EmailNv: editingStaff.emailNv,
      NgaySinhNv: editingStaff.ngaySinhNv,
      ThoiGianVao: editingStaff.thoiGianVao,
      LuongNv: editingStaff.luong,
      TrangThaidilam: editingStaff.trangThaidilam,
      NgayNghiPhep: editingStaff.ngayNghiPhep || null,
      NgayHetPhep: editingStaff.ngayHetPhep || null,
      NghiViec: editingStaff.nghiViec || null
    };

    try {
      const response = await fetch(`${API_URL}/${editingStaff.maNv}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setAlertMessage("Cập nhật thành công!");
        setShowEditModal(false);
        fetchStaff();
      } else {
        const errorMsg = await response.text();
        setAlertMessage(errorMsg || "Lỗi khi cập nhật!");
      }
    } catch (error) { 
      console.error(error); 
      setAlertMessage("Lỗi kết nối đến máy chủ!");
    }
  };

  const handleDelete = (member: any) => {
    setStaffToDelete(member);
  };

  const executeDelete = async () => {
    if (!staffToDelete) return;
    
    const idToDelete = staffToDelete.maNv;
    setStaffToDelete(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/${idToDelete}`, { method: 'DELETE' });
      if (response.ok) {
        setAlertMessage("Xóa nhân viên thành công!");
        fetchStaff();
      } else {
        const errorMsg = await response.text();
        // Cố gắng parse JSON nếu backend trả về JSON (như lỗi khoá ngoại)
        try {
          const errData = JSON.parse(errorMsg);
          setAlertMessage(errData.message || "Không thể xóa nhân viên này vì có dữ liệu liên kết!");
        } catch {
          setAlertMessage(errorMsg || "Không thể xóa nhân viên này vì có dữ liệu liên kết!");
        }
      }
    } catch (error) { 
      console.error(error); 
      setAlertMessage("Lỗi kết nối đến máy chủ!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const processedStaff = useMemo(() => {
    let result = [...staff];

    // Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.maNv.toLowerCase().includes(lowerSearch) || 
        (s.hoNv && s.hoNv.toLowerCase().includes(lowerSearch)) ||
        (s.tenNv && s.tenNv.toLowerCase().includes(lowerSearch)) ||
        (s.sdtnv && s.sdtnv.includes(lowerSearch))
      );
    }

    // Filter by Role
    if (filterRole !== 'All') {
      result = result.filter(s => s.chucvu === filterRole);
    }

    // Filter by Salary
    if (filterSalary) {
      if (filterSalary === '<5M') {
        result = result.filter(s => s.luong < 5000000);
      } else if (filterSalary === '5M-10M') {
        result = result.filter(s => s.luong >= 5000000 && s.luong <= 10000000);
      } else if (filterSalary === '>10M') {
        result = result.filter(s => s.luong > 10000000);
      }
    }

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];

        // Handle formatted columns for sorting
        if (sortKey === 'luongFormatted') {
          valA = a.luong;
          valB = b.luong;
        } else if (sortKey === 'ngaySinhNvFormatted') {
          valA = a.ngaySinhNv ? new Date(a.ngaySinhNv).getTime() : 0;
          valB = b.ngaySinhNv ? new Date(b.ngaySinhNv).getTime() : 0;
        } else if (sortKey === 'thoiGianVaoFormatted') {
          valA = a.thoiGianVao ? new Date(a.thoiGianVao).getTime() : 0;
          valB = b.thoiGianVao ? new Date(b.thoiGianVao).getTime() : 0;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [staff, filterRole, filterSalary, sortKey, sortDirection, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(processedStaff.length / itemsPerPage);
  const paginatedStaff = processedStaff.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(s => ({
    ...s,
    trangThaidilam: (
      <div className="relative group inline-block">
        <div className={`px-2 py-1 rounded-full text-xs font-bold text-white cursor-help ${
          s.trangThaidilam === 'Đi làm' ? 'bg-green-500' : 
          s.trangThaidilam === 'Nghỉ việc' ? 'bg-red-500' : 'bg-yellow-500'
        }`}>
          {s.trangThaidilam}
        </div>
        {s.trangThaidilam !== 'Đi làm' && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            <div className="font-bold border-b border-slate-600 mb-1 pb-1">Chi tiết {s.trangThaidilam}</div>
            {s.trangThaidilam === 'Nghỉ phép' && (
              <>
                <div>Bắt đầu: {formatDate(s.ngayNghiPhep)}</div>
                <div>Kết thúc: {formatDate(s.ngayHetPhep)}</div>
              </>
            )}
            {s.trangThaidilam === 'Nghỉ việc' && (
              <div>Ngày nghỉ: {formatDate(s.nghiViec)}</div>
            )}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
          </div>
        )}
      </div>
    )
  }));

  const FilterContent = (
    <div className="relative">
      <button 
        onClick={() => setShowFilters(!showFilters)}
        className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 rounded-md bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Filter className="h-4 w-4 mr-2" />
        Lọc
      </button>
      
      {showFilters && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-20">
          <h3 className="font-medium text-slate-900 mb-3">Lọc dữ liệu</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Chức vụ</label>
              <select 
                value={filterRole} 
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="All">Tất cả</option>
                {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Mức lương</label>
              <select 
                value={filterSalary} 
                onChange={(e) => setFilterSalary(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="">Tất cả</option>
                <option value="<5M">Dưới 5 triệu</option>
                <option value="5M-10M">5 - 10 triệu</option>
                <option value=">10M">Trên 10 triệu</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end gap-2">
            <button 
              onClick={() => {
                setFilterRole('All');
                setFilterSalary('');
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md"
            >
              Xóa lọc
            </button>
            <button 
              onClick={() => {
                setShowFilters(false);
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
        title="Quản lý Nhân Viên" 
        columns={COLUMNS.map(col => ({ ...col, sortable: true }))} 
        data={paginatedStaff} 
        onAdd={() => setShowAddModal(true)} 
        onEdit={(s) => { setEditingStaff(s); setShowEditModal(true); }} 
        onDelete={handleDelete} 
        onSearch={handleSearch}
        searchPlaceholder="Tìm mã, tên, SĐT NV..." 
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
        <StaffFormModal title="Đăng ký tài khoản Nhân Viên" member={newStaff} setMember={setNewStaff} onSave={handleSaveNew} onClose={() => setShowAddModal(false)} isEdit={false} />
      )}

      {showEditModal && (
        <StaffFormModal title="Chỉnh sửa thông tin Nhân Viên" member={editingStaff} setMember={setEditingStaff} onSave={handleUpdate} onClose={() => setShowEditModal(false)} isEdit={true} />
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
      {staffToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm p-6 bg-white rounded-xl shadow-2xl text-center">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Xác nhận xóa</h3>
            <p className="text-slate-600 mb-6">Bạn có chắc muốn xoá nhân viên {staffToDelete.hoNv} {staffToDelete.tenNv}?</p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setStaffToDelete(null)}
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

function StaffFormModal({ title, member, setMember, onSave, onClose, isEdit }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl p-6 bg-white rounded-xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>
        <form onSubmit={onSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">Thông tin tài khoản</h3>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã NV (Tự động)</label>
                <input type="text" disabled className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg outline-none font-mono text-blue-700 font-bold"
                  value={member.maNv} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mật khẩu</label>
                <input type={isEdit ? "text" : "password"} required className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={member.matkhau} onChange={(e) => setMember({...member, matkhau: e.target.value})} />
              </div>
              
              {/* Work Status Section */}
              <div className="pt-4 border-t space-y-4">
                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">Trạng thái đi làm</h3>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trạng thái</label>
                  <select 
                    className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
                    value={member.trangThaidilam}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMember({
                        ...member, 
                        trangThaidilam: val,
                        ngayNghiPhep: val === 'Nghỉ phép' ? member.ngayNghiPhep : '',
                        ngayHetPhep: val === 'Nghỉ phép' ? member.ngayHetPhep : '',
                        nghiViec: val === 'Nghỉ việc' ? member.nghiViec : ''
                      });
                    }}
                  >
                    <option value="Đi làm">Đi làm</option>
                    <option value="Nghỉ phép">Nghỉ phép</option>
                    <option value="Nghỉ việc">Nghỉ việc</option>
                  </select>
                </div>

                {member.trangThaidilam === 'Nghỉ phép' && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bắt đầu nghỉ</label>
                      <input type="date" required className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
                        value={member.ngayNghiPhep?.split('T')[0] || ''} 
                        onChange={(e) => setMember({...member, ngayNghiPhep: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kết thúc nghỉ</label>
                      <input type="date" required min={member.ngayNghiPhep?.split('T')[0]} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
                        value={member.ngayHetPhep?.split('T')[0] || ''} 
                        onChange={(e) => setMember({...member, ngayHetPhep: e.target.value})} />
                    </div>
                  </div>
                )}

                {member.trangThaidilam === 'Nghỉ việc' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày bắt đầu nghỉ việc</label>
                    <input type="date" required className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
                      value={member.nghiViec?.split('T')[0] || ''} 
                      onChange={(e) => setMember({...member, nghiViec: e.target.value})} />
                  </div>
                )}
              </div>
            </div>

            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">Thông tin cá nhân</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Họ nhân viên</label>
                  <input type="text" required className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
                    value={member.hoNv} onChange={(e) => setMember({...member, hoNv: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên nhân viên</label>
                  <input type="text" required className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
                    value={member.tenNv} onChange={(e) => setMember({...member, tenNv: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chức vụ</label>
                  <select 
                    disabled={isEdit}
                    className={`w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition ${isEdit ? 'bg-slate-100' : ''}`}
                    value={member.chucvu} 
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setMember({ ...member, chucvu: newRole, maNv: '' }); // Trigger re-gen
                    }}
                  >
                    {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">SĐT (10 số)</label>
                  <input type="text" required maxLength={10} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
                    value={member.sdtnv} onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setMember({...member, sdtnv: value});
                    }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                <input type="email" required className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={member.emailNv} onChange={(e) => setMember({...member, emailNv: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày sinh</label>
              <input type="date" required className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={member.ngaySinhNv?.split('T')[0] || ''} onChange={(e) => setMember({...member, ngaySinhNv: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày vào làm</label>
              <input type="date" required className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={member.thoiGianVao?.split('T')[0] || ''} 
                onChange={(e) => {
                  const newDate = e.target.value;
                  setMember({...member, thoiGianVao: newDate, maNv: ''}); // Trigger re-gen
                }} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lương (VNĐ)</label>
              <input type="number" required min="0" className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={member.luong} onChange={(e) => setMember({...member, luong: Number(e.target.value)})} />
              <p className="text-xs text-blue-600 mt-1 italic">Định dạng: {new Intl.NumberFormat('vi-VN').format(member.luong)} VNĐ</p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8 border-t pt-6">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition">Hủy</button>
            <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition">
              {isEdit ? 'Cập nhật thông tin' : 'Đăng ký tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StaffManagement;

