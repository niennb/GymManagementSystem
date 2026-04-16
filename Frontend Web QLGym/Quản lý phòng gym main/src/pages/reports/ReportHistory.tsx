import React, { useState, useEffect, useMemo } from 'react';
import TableLayout from '../../components/TableLayout';
import { Filter } from 'lucide-react';

const COLUMNS = [
  { key: 'maBaoCao', label: 'Mã BC', sortable: true },
  { key: 'tenBaoCao', label: 'Tên Báo Cáo', sortable: true },
  { key: 'nguoiXuat', label: 'Người Xuất', sortable: true },
  { key: 'ngayXuatFormatted', label: 'Ngày Xuất', sortable: true },
  { key: 'noiDungTomTat', label: 'Nội Dung Tóm Tắt', sortable: false },
];

export default function ReportHistory() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Sorting
  const [sortKey, setSortKey] = useState<string>('ngayXuat');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    tenBaoCao: '',
    nguoiXuat: '',
    ngayXuat: ''
  });

  // Modals
  const [alertMessage, setAlertMessage] = useState('');
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setLoadingProgress(30);
    try {
      const response = await fetch('http://localhost:5079/api/lichsuxuatbaocaos');
      if (!response.ok) throw new Error('Lỗi khi tải dữ liệu');
      
      const result = await response.json();
      setLoadingProgress(70);

      const formattedData = result.map((item: any) => ({
        maBaoCao: item.maBaoCao || item.MaBaoCao,
        tenBaoCao: item.tenBaoCao || item.TenBaoCao,
        nguoiXuat: item.nguoiXuat || item.NguoiXuat,
        ngayXuat: item.ngayXuat || item.NgayXuat,
        noiDungTomTat: item.noiDungTomTat || item.NoiDungTomTat || ''
      }));
      
      setData(formattedData);
      setLoadingProgress(100);
    } catch (error) {
      console.error('Lỗi fetch data:', error);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setLoadingProgress(0);
      }, 300);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleDelete = (item: any) => {
    setItemToDelete(item);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    
    const idToDelete = itemToDelete.maBaoCao;
    setItemToDelete(null);
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:5079/api/lichsuxuatbaocaos/${idToDelete}`, { method: 'DELETE' });
      if (response.ok) {
        setAlertMessage("Xóa lịch sử báo cáo thành công!");
        fetchData();
      } else {
        const errData = await response.json().catch(() => ({}));
        setAlertMessage(errData.message || "Không thể xóa lịch sử báo cáo này!");
        setIsLoading(false);
      }
    } catch (error) { 
      console.error(error); 
      setAlertMessage("Lỗi kết nối đến máy chủ!");
      setIsLoading(false);
    }
  };

  const processedData = useMemo(() => {
    let result = [...data];

    // Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(item => 
        (item.tenBaoCao && item.tenBaoCao.toLowerCase().includes(lowerSearch)) || 
        (item.nguoiXuat && item.nguoiXuat.toLowerCase().includes(lowerSearch)) ||
        (item.maBaoCao && item.maBaoCao.toLowerCase().includes(lowerSearch))
      );
    }

    // Filters
    if (filters.tenBaoCao) {
      result = result.filter(item => item.tenBaoCao && item.tenBaoCao.toLowerCase().includes(filters.tenBaoCao.toLowerCase()));
    }
    if (filters.nguoiXuat) {
      result = result.filter(item => item.nguoiXuat && item.nguoiXuat.toLowerCase().includes(filters.nguoiXuat.toLowerCase()));
    }
    if (filters.ngayXuat) {
      result = result.filter(item => item.ngayXuat && item.ngayXuat.startsWith(filters.ngayXuat));
    }

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        let valA = a[sortKey] || '';
        let valB = b[sortKey] || '';
        
        if (sortKey === 'ngayXuatFormatted' || sortKey === 'ngayXuat') {
          valA = a.ngayXuat ? new Date(a.ngayXuat).getTime() : 0;
          valB = b.ngayXuat ? new Date(b.ngayXuat).getTime() : 0;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, filters, sortKey, sortDirection, searchTerm]);

  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const paginatedData = processedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const displayData = paginatedData.map(item => ({
    ...item,
    ngayXuatFormatted: item.ngayXuat ? new Date(item.ngayXuat).toLocaleString('vi-VN') : ''
  }));

  const filterContent = (
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Tên báo cáo</label>
              <input type="text" placeholder="Nhập tên báo cáo..." className="w-full p-2 border border-slate-300 rounded-md text-sm"
                value={filters.tenBaoCao} onChange={(e) => setFilters({...filters, tenBaoCao: e.target.value})} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Người xuất</label>
              <input type="text" placeholder="Nhập người xuất..." className="w-full p-2 border border-slate-300 rounded-md text-sm"
                value={filters.nguoiXuat} onChange={(e) => setFilters({...filters, nguoiXuat: e.target.value})} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Thời gian xuất (Ngày)</label>
              <input type="date" className="w-full p-2 border border-slate-300 rounded-md text-sm"
                value={filters.ngayXuat} onChange={(e) => setFilters({...filters, ngayXuat: e.target.value})} />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end gap-2">
            <button 
              onClick={() => {
                setFilters({ tenBaoCao: '', nguoiXuat: '', ngayXuat: '' });
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
        title="Lịch sử Xuất Báo Cáo" 
        columns={COLUMNS} 
        data={displayData} 
        isLoading={isLoading}
        loadingProgress={loadingProgress}
        searchPlaceholder="Tìm tên báo cáo, người xuất..."
        filterContent={filterContent}
        onSearch={handleSearch}
        onSort={handleSort}
        sortKey={sortKey}
        sortDirection={sortDirection}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onDelete={handleDelete}
        hideAdd={true}
        hideEdit={true}
      />

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
      {itemToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm p-6 bg-white rounded-xl shadow-2xl text-center">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Xác nhận xóa</h3>
            <p className="text-slate-600 mb-6">Bạn có chắc muốn xoá lịch sử báo cáo {itemToDelete.maBaoCao}?</p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setItemToDelete(null)}
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
