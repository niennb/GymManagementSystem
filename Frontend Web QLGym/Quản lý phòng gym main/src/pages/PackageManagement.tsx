import React, { useState, useEffect, useCallback, useMemo } from 'react';
import TableLayout from '../components/TableLayout';
import { Filter } from 'lucide-react';

const COLUMNS = [
  { key: 'maGoiTap', label: 'Mã Gói', sortable: true },
  { key: 'tenGoi', label: 'Tên Gói Tập', sortable: true },
  { key: 'loaiGoitap', label: 'Loại Gói', sortable: true },
  { key: 'giaTien', label: 'Giá Tiền (VNĐ)', sortable: true },
  { key: 'thoihan', label: 'Thời Hạn (Ngày)', sortable: true },
];

const LOAI_GOI_TAP = ['Basic', 'Standard', 'Premium', 'VIP'];

export default function PackageManagement() {
  const [packages, setPackages] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom Modals State
  const [alertMessage, setAlertMessage] = useState('');
  const [packageToDelete, setPackageToDelete] = useState<any>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Sorting
  const [sortKey, setSortKey] = useState<string>('maGoiTap');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filtering
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    loaiGoitap: '',
    giaTien: ''
  });
  
  // State cho gói tập mới và gói tập đang sửa
  const [newPackage, setNewPackage] = useState({ maGoiTap: '', tenGoi: '', loaiGoitap: 'Basic', giaTien: 0, thoihan: 0 });
  const [editingPackage, setEditingPackage] = useState<any>(null);

  const API_URL = 'http://localhost:5079/api/goitaps';

  const fetchPackages = useCallback(async () => {
    setIsLoading(true);
    setLoadingProgress(10);
    try {
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => prev >= 90 ? 90 : prev + 15);
      }, 100);
      
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      
      clearInterval(progressInterval);
      setLoadingProgress(100);
      
      // Map properties if needed (e.g. from PascalCase to camelCase)
      const formattedData = data.map((p: any) => ({
        maGoiTap: p.maGoiTap || p.MaGoiTap,
        tenGoi: p.tenGoi || p.TenGoi,
        loaiGoitap: p.loaiGoitap || p.LoaiGoitap,
        giaTien: p.giaTien !== undefined ? p.giaTien : p.GiaTien,
        thoihan: p.thoihan !== undefined ? p.thoihan : p.Thoihan
      }));
      
      setPackages(formattedData);
      
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
    fetchPackages();
  }, [fetchPackages]);

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

  const generateMaGoiTap = (loai: string) => {
    if (!loai) return '';
    const prefix = `GT${loai.toUpperCase()}`;
    const sameTypePkgs = packages.filter(p => p.maGoiTap.startsWith(prefix));
    const numbers = sameTypePkgs.map(p => {
      const numStr = p.maGoiTap.replace(prefix, '');
      return parseInt(numStr, 10) || 0;
    });
    const maxNumber = Math.max(...numbers, 0);
    return `${prefix}${(maxNumber + 1).toString().padStart(2, '0')}`;
  };

  const handleAdd = () => {
    const defaultLoai = 'Basic';
    setNewPackage({ 
      maGoiTap: generateMaGoiTap(defaultLoai), 
      tenGoi: '', 
      loaiGoitap: defaultLoai, 
      giaTien: 0, 
      thoihan: 0 
    });
    setShowAddModal(true);
  };

  const processedPackages = useMemo(() => {
    let result = [...packages];

    // Áp dụng tìm kiếm
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.maGoiTap.toLowerCase().includes(lowerSearch) || 
        p.tenGoi.toLowerCase().includes(lowerSearch)
      );
    }

    if (filters.loaiGoitap) {
      result = result.filter(p => p.loaiGoitap === filters.loaiGoitap);
    }
    
    if (filters.giaTien) {
      if (filters.giaTien === '<5M') {
        result = result.filter(p => p.giaTien < 5000000);
      } else if (filters.giaTien === '5M-10M') {
        result = result.filter(p => p.giaTien >= 5000000 && p.giaTien <= 10000000);
      } else if (filters.giaTien === '>10M') {
        result = result.filter(p => p.giaTien > 10000000);
      }
    }

    if (sortKey) {
      result.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [packages, filters, sortKey, sortDirection]);

  const totalPages = Math.ceil(processedPackages.length / ITEMS_PER_PAGE);
  const paginatedPackages = processedPackages.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const validatePackage = (pkg: any, isEdit = false) => {
    const otherPkgs = isEdit ? packages.filter(p => p.maGoiTap !== pkg.maGoiTap) : packages;
    
    if (!isEdit && packages.some(p => p.maGoiTap.toLowerCase() === pkg.maGoiTap.toLowerCase())) {
      setAlertMessage("Lỗi: Mã gói tập này đã tồn tại!");
      return false;
    }
    if (otherPkgs.some(p => p.tenGoi.toLowerCase() === pkg.tenGoi.toLowerCase())) {
      setAlertMessage("Lỗi: Tên gói tập này đã tồn tại!");
      return false;
    }
    if (pkg.giaTien <= 0) {
      setAlertMessage("Lỗi: Giá tiền phải lớn hơn 0!");
      return false;
    }
    if (pkg.thoihan <= 0) {
      setAlertMessage("Lỗi: Thời hạn phải lớn hơn 0!");
      return false;
    }
    return true;
  };

  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePackage(newPackage)) return;

    setShowAddModal(false);
    setIsLoading(true);
    
    const payload = {
      MaGoiTap: newPackage.maGoiTap,
      TenGoi: newPackage.tenGoi,
      LoaiGoitap: newPackage.loaiGoitap,
      GiaTien: newPackage.giaTien,
      Thoihan: newPackage.thoihan
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setAlertMessage("Thêm gói tập thành công!");
        fetchPackages();
      } else {
        const errData = await response.json().catch(() => ({}));
        setAlertMessage(errData.message || "Lỗi khi lưu gói tập!");
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
    if (!validatePackage(editingPackage, true)) return;

    setShowEditModal(false);
    setIsLoading(true);

    const payload = {
      MaGoiTap: editingPackage.maGoiTap,
      TenGoi: editingPackage.tenGoi,
      LoaiGoitap: editingPackage.loaiGoitap,
      GiaTien: editingPackage.giaTien,
      Thoihan: editingPackage.thoihan
    };

    try {
      const response = await fetch(`${API_URL}/${editingPackage.maGoiTap}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setAlertMessage("Cập nhật thành công!");
        fetchPackages();
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

  const handleDelete = (pkg: any) => {
    setPackageToDelete(pkg);
  };

  const executeDelete = async () => {
    if (!packageToDelete) return;
    
    const idToDelete = packageToDelete.maGoiTap;
    setPackageToDelete(null);
    setIsLoading(true);

    try {
      // Kiểm tra khoá ngoại từ bảng hợp đồng trước khi gửi request xoá
      const contractsResponse = await fetch('http://localhost:5079/api/hopdongs');
      if (contractsResponse.ok) {
        const contracts = await contractsResponse.json();
        const isUsed = contracts.some((c: any) => 
          (c.maGoiTap || c.MaGoiTap) === idToDelete
        );
        
        if (isUsed) {
          setAlertMessage("Không thể xoá gói tập do có hợp đồng sử dụng gói này (liên kết khoá ngoại)");
          setIsLoading(false);
          return; // Dừng việc xoá, không gọi API DELETE
        }
      }

      const response = await fetch(`${API_URL}/${idToDelete}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setAlertMessage("Xóa thành công!");
        fetchPackages();
      } else {
        const errData = await response.json().catch(() => ({}));
        setAlertMessage(errData.message || "Lỗi khi xoá gói tập!");
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      setAlertMessage("Lỗi kết nối đến máy chủ!");
      setIsLoading(false);
    }
  };

  const handleEdit = (pkg: any) => {
    setEditingPackage(pkg);
    setShowEditModal(true);
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Loại gói tập</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-md text-sm"
                value={filters.loaiGoitap}
                onChange={(e) => setFilters({...filters, loaiGoitap: e.target.value})}
              >
                <option value="">Tất cả</option>
                {LOAI_GOI_TAP.map(loai => (
                  <option key={loai} value={loai}>{loai}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Giá tiền</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-md text-sm"
                value={filters.giaTien}
                onChange={(e) => setFilters({...filters, giaTien: e.target.value})}
              >
                <option value="">Tất cả</option>
                <option value="<5M">Dưới 5.000.000 VNĐ</option>
                <option value="5M-10M">5.000.000 - 10.000.000 VNĐ</option>
                <option value=">10M">Trên 10.000.000 VNĐ</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end gap-2">
            <button 
              onClick={() => {
                setFilters({ loaiGoitap: '', giaTien: '' });
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

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const displayData = paginatedPackages.map(pkg => ({
    ...pkg,
    giaTien: formatCurrency(pkg.giaTien)
  }));

  return (
    <div className="relative space-y-6">
      <TableLayout 
        title="Quản lý gói tập" 
        columns={COLUMNS} 
        data={displayData} 
        onAdd={handleAdd} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
        onSearch={handleSearch} 
        searchPlaceholder="Tìm theo mã, tên gói..."
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
        <PackageFormModal 
          title="Thêm gói tập mới" 
          pkg={newPackage} 
          setPkg={setNewPackage} 
          onSave={handleSaveNew} 
          onClose={() => setShowAddModal(false)} 
          isEdit={false} 
          generateMaGoiTap={generateMaGoiTap}
        />
      )}

      {showEditModal && (
        <PackageFormModal 
          title="Chỉnh sửa gói tập" 
          pkg={editingPackage} 
          setPkg={setEditingPackage} 
          onSave={handleUpdate} 
          onClose={() => setShowEditModal(false)} 
          isEdit={true} 
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
      {packageToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm p-6 bg-white rounded-xl shadow-2xl text-center">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Xác nhận xóa</h3>
            <p className="text-slate-600 mb-6">Bạn có chắc muốn xoá gói tập {packageToDelete.tenGoi}?</p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setPackageToDelete(null)}
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

function PackageFormModal({ title, pkg, setPkg, onSave, onClose, isEdit, generateMaGoiTap }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>
        <form onSubmit={onSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Loại Gói Tập</label>
              <select 
                required 
                className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={pkg.loaiGoitap} 
                onChange={(e) => {
                  const newLoai = e.target.value;
                  if (!isEdit && generateMaGoiTap) {
                    setPkg({...pkg, loaiGoitap: newLoai, maGoiTap: generateMaGoiTap(newLoai)});
                  } else {
                    setPkg({...pkg, loaiGoitap: newLoai});
                  }
                }}
              >
                {LOAI_GOI_TAP.map(loai => (
                  <option key={loai} value={loai}>{loai}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Mã Gói Tập</label>
              <input type="text" required disabled={true} className="w-full p-2 border rounded-lg outline-none bg-gray-100 cursor-not-allowed"
                value={pkg.maGoiTap} onChange={(e) => setPkg({...pkg, maGoiTap: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">Tên Gói Tập</label>
            <input type="text" required className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={pkg.tenGoi} onChange={(e) => setPkg({...pkg, tenGoi: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Giá Tiền (VNĐ)</label>
              <input type="number" required min="0" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={pkg.giaTien} onChange={(e) => setPkg({...pkg, giaTien: Number(e.target.value)})} />
              <p className="text-xs text-blue-600 mt-1 italic">Định dạng: {new Intl.NumberFormat('vi-VN').format(pkg.giaTien)} VNĐ</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Thời Hạn (Ngày)</label>
              <input type="number" required min="1" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={pkg.thoihan} onChange={(e) => setPkg({...pkg, thoihan: Number(e.target.value)})} />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Lưu thông tin</button>
          </div>
        </form>
      </div>
    </div>
  );
}
