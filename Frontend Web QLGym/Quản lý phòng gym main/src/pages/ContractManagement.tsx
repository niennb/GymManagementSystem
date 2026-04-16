import React, { useState, useEffect, useCallback, useMemo } from 'react';
import TableLayout from '../components/TableLayout';
import { Filter } from 'lucide-react';

import { updateRelatedStatuses } from '../lib/statusUpdater';

const COLUMNS = [
  { key: 'maHd', label: 'Mã HĐ', sortable: true },
  { key: 'maHv', label: 'Mã HV', sortable: true },
  { key: 'maGoiTap', label: 'Mã Gói', sortable: true },
  { key: 'ngayBd', label: 'Ngày bắt đầu', sortable: true },
  { key: 'ngayKt', label: 'Ngày kết thúc', sortable: true },
  { key: 'soLuong', label: 'Số lượng', sortable: true },
  { key: 'lyDoKhoa', label: 'Lý do khóa', sortable: true },
  { 
    key: 'trangThaiHd', 
    label: 'Trạng thái', 
    sortable: true,
    render: (value: string) => (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
        value === 'Active' ? 'bg-green-100 text-green-800' :
        value === 'Expired' ? 'bg-red-100 text-red-800' :
        'bg-slate-100 text-slate-800'
      }`}>
        {value}
      </span>
    )
  },
];

const TRANG_THAI_HD = ['Locked', 'Active', 'Expired'];

export default function ContractManagement({ user }: { user?: any }) {
  const [contracts, setContracts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom Modals State
  const [alertMessage, setAlertMessage] = useState('');
  const [contractToDelete, setContractToDelete] = useState<any>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Sorting
  const [sortKey, setSortKey] = useState<string>('maHd');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  // Filtering
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    trangThaiHd: '',
    soLuong: '',
    maHv: '',
    maGoiTap: '',
    ngayBd: '',
    ngayKt: ''
  });
  
  const [newContract, setNewContract] = useState({ 
    maHd: '', 
    maHv: '', 
    maGoiTap: '', 
    ngayBd: new Date().toISOString().split('T')[0], 
    ngayKt: '',
    soLuong: 1,
    trangThaiHd: 'Locked'
  });
  const [editingContract, setEditingContract] = useState<any>(null);

  const API_URL = 'http://localhost:5079/api/hopdongs';

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoadingProgress(10);
    try {
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => prev >= 90 ? 90 : prev + 15);
      }, 100);
      
      const [contractsRes, membersRes, packagesRes, invoicesRes] = await Promise.all([
        fetch(API_URL, { cache: 'no-store' }),
        fetch('http://localhost:5079/api/members'),
        fetch('http://localhost:5079/api/goitaps'),
        fetch('http://localhost:5079/api/hoadons')
      ]);

      const [contractsData, membersData, packagesData, invoicesData] = await Promise.all([
        contractsRes.ok ? contractsRes.json() : [],
        membersRes.ok ? membersRes.json() : [],
        packagesRes.ok ? packagesRes.json() : [],
        invoicesRes.ok ? invoicesRes.json() : []
      ]);
      
      clearInterval(progressInterval);
      setLoadingProgress(100);
      
      const today = new Date().toISOString().split('T')[0];

      // Map properties to camelCase
      const formattedContracts = contractsData.map((c: any) => {
        const maHd = c.maHd || c.MaHd || c.MaHD;
        let currentStatus = c.trangThaiHd || c.TrangThaiHd || c.TrangThaiHD || 'Locked';
        
        const hasInvoice = invoicesData.some((inv: any) => inv.maHd === maHd || inv.MaHd === maHd || inv.MaHD === maHd);
        const ngayKt = c.ngayKt || c.NgayKt || c.NgayKT;
        
        const lyDoKhoa = c.lyDoKhoa || c.LyDoKhoa || '';
        let newStatus = currentStatus;

        // Rule: If contract has a reason, it's locked. Otherwise follow invoice/date logic.
        if (lyDoKhoa) {
          newStatus = 'Locked';
        } else {
          if (hasInvoice) {
            if (ngayKt && ngayKt.split('T')[0] >= today) {
              newStatus = 'Active';
            } else {
              newStatus = 'Expired';
            }
          } else {
            newStatus = 'Locked';
          }
        }

        if (newStatus !== currentStatus) {
          currentStatus = newStatus;
          // Fire and forget update
          fetch(`${API_URL}/${maHd}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...c, TrangThaiHD: newStatus })
          }).then(() => updateRelatedStatuses(maHd)).catch(console.error);
        }

        return {
          maHd,
          maHv: c.maHv || c.MaHv || c.MaHV,
          maGoiTap: c.maGoiTap || c.MaGoiTap,
          ngayBd: c.ngayBd || c.NgayBd || c.NgayBD,
          ngayKt,
          soLuong: c.soLuong !== undefined ? c.soLuong : c.SoLuong,
          lyDoKhoa: c.lyDoKhoa || c.LyDoKhoa || '',
          trangThaiHd: currentStatus
        };
      });

      const formattedMembers = membersData.map((m: any) => ({
        maHv: m.maHv || m.MaHv,
        ho: m.ho || m.Ho,
        ten: m.ten || m.Ten
      }));

      const formattedPackages = packagesData.map((p: any) => ({
        maGoiTap: p.maGoiTap || p.MaGoiTap,
        tenGoi: p.tenGoi || p.TenGoi,
        loaiGoitap: p.loaiGoitap || p.LoaiGoitap,
        thoihan: p.thoihan !== undefined ? p.thoihan : p.Thoihan
      }));
      
      setContracts(formattedContracts);
      setMembers(formattedMembers);
      setPackages(formattedPackages);
      
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

  const generateMaHD = (loaiGoiTap: string, ngayBd: string, currentContracts: any[]) => {
    if (!loaiGoiTap || !ngayBd) return '';
    const year = new Date(ngayBd).getFullYear().toString().slice(-2);
    const prefix = `HD${loaiGoiTap.toUpperCase()}${year}`;
    
    const samePrefixContracts = currentContracts.filter(c => c.maHd && c.maHd.startsWith(prefix));
    const numbers = samePrefixContracts.map(c => {
      const numStr = c.maHd.replace(prefix, '');
      return parseInt(numStr, 10) || 0;
    });
    
    const maxNumber = Math.max(...numbers, 0);
    return `${prefix}${(maxNumber + 1).toString().padStart(2, '0')}`;
  };

  const calculateNgayKT = (ngayBd: string, thoihan: number, soLuong: number) => {
    if (!ngayBd || !thoihan || !soLuong) return '';
    const start = new Date(ngayBd);
    const totalDays = thoihan * soLuong;
    start.setDate(start.getDate() + totalDays);
    return start.toISOString().split('T')[0];
  };

  const handleAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    setNewContract({ 
      maHd: '', 
      maHv: '', 
      maGoiTap: '', 
      ngayBd: today, 
      ngayKt: '',
      soLuong: 1,
      trangThaiHd: 'Locked'
    });
    setShowAddModal(true);
  };

  const processedContracts = useMemo(() => {
    let result = [...contracts];

    // Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(c => 
        (c.maHd && c.maHd.toLowerCase().includes(lowerSearch)) || 
        (c.maHv && c.maHv.toLowerCase().includes(lowerSearch)) ||
        (c.maGoiTap && c.maGoiTap.toLowerCase().includes(lowerSearch))
      );
    }

    // Filters
    if (filters.trangThaiHd) result = result.filter(c => c.trangThaiHd === filters.trangThaiHd);
    if (filters.soLuong) result = result.filter(c => c.soLuong === parseInt(filters.soLuong));
    if (filters.maHv) result = result.filter(c => c.maHv === filters.maHv);
    if (filters.maGoiTap) result = result.filter(c => c.maGoiTap === filters.maGoiTap);
    if (filters.ngayBd) result = result.filter(c => c.ngayBd && c.ngayBd.startsWith(filters.ngayBd));
    if (filters.ngayKt) result = result.filter(c => c.ngayKt && c.ngayKt.startsWith(filters.ngayKt));

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        const valA = a[sortKey] || '';
        const valB = b[sortKey] || '';
        
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [contracts, filters, sortKey, sortDirection, searchTerm]);

  const totalPages = Math.ceil(processedContracts.length / ITEMS_PER_PAGE);
  const paginatedContracts = processedContracts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const displayData = paginatedContracts.map(c => ({
    ...c,
    ngayBd: formatDate(c.ngayBd),
    ngayKt: formatDate(c.ngayKt)
  }));

  const validateContract = (contract: any, isEdit = false) => {
    if (!contract.maHv) {
      setAlertMessage("Vui lòng chọn học viên!");
      return false;
    }
    if (!contract.maGoiTap) {
      setAlertMessage("Vui lòng chọn gói tập!");
      return false;
    }
    if (contract.soLuong < 1) {
      setAlertMessage("Số lượng phải lớn hơn hoặc bằng 1!");
      return false;
    }
    return true;
  };

  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateContract(newContract)) return;

    setShowAddModal(false);
    setIsLoading(true);

    const payload = {
      MaHD: newContract.maHd,
      MaHV: newContract.maHv,
      MaGoiTap: newContract.maGoiTap,
      NgayBD: newContract.ngayBd,
      NgayKT: newContract.ngayKt,
      SoLuong: newContract.soLuong,
      TrangThaiHD: newContract.trangThaiHd
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setAlertMessage("Thêm hợp đồng thành công!");
        fetchData();
      } else {
        const errData = await response.json().catch(() => ({}));
        setAlertMessage(errData.message || "Lỗi khi lưu hợp đồng!");
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
    if (!validateContract(editingContract, true)) return;

    setShowEditModal(false);
    setIsLoading(true);

    const payload = {
      MaHD: editingContract.maHd,
      MaHV: editingContract.maHv,
      MaGoiTap: editingContract.maGoiTap,
      NgayBD: editingContract.ngayBd,
      NgayKT: editingContract.ngayKt,
      SoLuong: editingContract.soLuong,
      TrangThaiHD: editingContract.trangThaiHd,
      LyDoKhoa: editingContract.trangThaiHd === 'Locked' ? editingContract.lyDoKhoa : ''
    };

    try {
      const response = await fetch(`${API_URL}/${editingContract.maHd}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        // Rule: Check all contracts of this member to update member status
        try {
          const [allContractsRes, invoicesRes, memberRes] = await Promise.all([
            fetch('http://localhost:5079/api/hopdongs'),
            fetch('http://localhost:5079/api/hoadons'),
            fetch(`http://localhost:5079/api/members/${payload.MaHV}`)
          ]);

          if (allContractsRes.ok && invoicesRes.ok && memberRes.ok) {
            const allContracts = await allContractsRes.json();
            const invoices = await invoicesRes.json();
            const member = await memberRes.json();
            const today = new Date().toISOString().split('T')[0];

            const memberContracts = allContracts.filter((c: any) => 
              (c.maHv === payload.MaHV || c.MaHv === payload.MaHV || c.MaHV === payload.MaHV)
            );

            let hasActive = false;
            let hasAnyInvoice = false;
            let allContractsLocked = memberContracts.length > 0;

            for (const c of memberContracts) {
              const cMaHd = c.maHd || c.MaHd || c.MaHD;
              const cStatus = c.trangThaiHd || c.TrangThaiHd || c.TrangThaiHD;
              
              if (cStatus !== 'Locked') {
                allContractsLocked = false;
              }

              const hasInv = invoices.some((i: any) => i.maHd === cMaHd || i.MaHD === cMaHd || i.MaHd === cMaHd);
              if (hasInv) {
                hasAnyInvoice = true;
                const cNgayKt = c.ngayKt || c.NgayKt || c.NgayKT;
                if (cNgayKt && cNgayKt.split('T')[0] >= today) {
                  hasActive = true;
                }
              }
            }

            let newMemberStatus = 'Locked';
            const currentMemberStatus = member.trangthai || member.Trangthai || member.TrangThai;
            const memberLyDoKhoa = member.lyDoKhoa || member.LyDoKhoa || '';

            // If member has a manual lock reason, they stay locked
            if (memberLyDoKhoa) {
              newMemberStatus = 'Locked';
            } else if (allContractsLocked) {
              newMemberStatus = 'Locked';
            } else {
              if (hasActive) {
                newMemberStatus = 'Active';
              } else if (hasAnyInvoice) {
                newMemberStatus = 'Expired';
              } else {
                newMemberStatus = 'Locked';
              }
            }

            if (currentMemberStatus !== newMemberStatus) {
              await fetch(`http://localhost:5079/api/members/${payload.MaHV}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...member, trangthai: newMemberStatus })
              });
            }
          }
        } catch (err) {
          console.error("Lỗi khi cập nhật trạng thái hội viên liên đới:", err);
        }

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

  const handleDelete = (contract: any) => {
    setContractToDelete(contract);
  };

  const executeDelete = async () => {
    if (!contractToDelete) return;
    
    const idToDelete = contractToDelete.maHd;
    setContractToDelete(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/${idToDelete}`, { method: 'DELETE' });
      if (response.ok) {
        setAlertMessage("Xóa hợp đồng thành công!");
        fetchData();
      } else {
        const errData = await response.json().catch(() => ({}));
        setAlertMessage(errData.message || "Không thể xóa hợp đồng này!");
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
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-20">
          <h3 className="font-medium text-slate-900 mb-3">Lọc dữ liệu</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Trạng thái HĐ</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-md text-sm"
                value={filters.trangThaiHd}
                onChange={(e) => setFilters({...filters, trangThaiHd: e.target.value})}
              >
                <option value="">Tất cả</option>
                {TRANG_THAI_HD.map(tt => <option key={tt} value={tt}>{tt}</option>)}
              </select>
            </div>
            
            <div className="col-span-2">
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
            
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Gói Tập</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-md text-sm"
                value={filters.maGoiTap} 
                onChange={(e) => setFilters({...filters, maGoiTap: e.target.value})}
              >
                <option value="">Tất cả</option>
                {packages.map((p: any) => (
                  <option key={p.maGoiTap} value={p.maGoiTap}>{p.maGoiTap} - {p.tenGoi}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Số lượng</label>
              <input type="number" className="w-full p-2 border border-slate-300 rounded-md text-sm"
                value={filters.soLuong} onChange={(e) => setFilters({...filters, soLuong: e.target.value})} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ngày BĐ</label>
              <input type="date" className="w-full p-2 border border-slate-300 rounded-md text-sm"
                value={filters.ngayBd} onChange={(e) => setFilters({...filters, ngayBd: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ngày KT</label>
              <input type="date" className="w-full p-2 border border-slate-300 rounded-md text-sm"
                value={filters.ngayKt} onChange={(e) => setFilters({...filters, ngayKt: e.target.value})} />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end gap-2">
            <button 
              onClick={() => {
                setFilters({ trangThaiHd: '', soLuong: '', maHv: '', maGoiTap: '', ngayBd: '', ngayKt: '' });
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
        title="Quản lý Hợp Đồng" 
        columns={COLUMNS} 
        data={displayData} 
        onAdd={handleAdd} 
        onEdit={(c) => { setEditingContract({ ...c, originalTrangThai: c.trangThaiHd }); setShowEditModal(true); }} 
        onDelete={handleDelete} 
        onSearch={handleSearch}
        searchPlaceholder="Tìm mã HĐ, mã HV, mã Gói..." 
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
        hideEdit={isReceptionist}
        hideDelete={isReceptionist}
      />

      {showAddModal && (
        <ContractFormModal 
          title="Thêm Hợp Đồng" 
          item={newContract} 
          setItem={setNewContract} 
          onSave={handleSaveNew} 
          onClose={() => setShowAddModal(false)} 
          isEdit={false} 
          members={members}
          packages={packages}
          contracts={contracts}
          generateMaHD={generateMaHD}
          calculateNgayKT={calculateNgayKT}
        />
      )}

      {showEditModal && (
        <ContractFormModal 
          title="Chỉnh sửa Hợp Đồng" 
          item={editingContract} 
          setItem={setEditingContract} 
          onSave={handleUpdate} 
          onClose={() => setShowEditModal(false)} 
          isEdit={true} 
          members={members}
          packages={packages}
          contracts={contracts}
          generateMaHD={generateMaHD}
          calculateNgayKT={calculateNgayKT}
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
      {contractToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm p-6 bg-white rounded-xl shadow-2xl text-center">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Xác nhận xóa</h3>
            <p className="text-slate-600 mb-6">Bạn có chắc muốn xoá hợp đồng {contractToDelete.maHd}?</p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setContractToDelete(null)}
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

function ContractFormModal({ title, item, setItem, onSave, onClose, isEdit, members, packages, contracts, generateMaHD, calculateNgayKT }: any) {
  
  const handlePackageChange = (maGoiTap: string) => {
    const pkg = packages.find((p: any) => p.maGoiTap === maGoiTap);
    if (!pkg) {
      setItem({ ...item, maGoiTap, maHd: '', ngayKt: '' });
      return;
    }

    let newMaHd = item.maHd;
    if (!isEdit) {
      newMaHd = generateMaHD(pkg.loaiGoitap, item.ngayBd, contracts);
    }
    
    const newNgayKt = calculateNgayKT(item.ngayBd, pkg.thoihan, item.soLuong);
    
    setItem({
      ...item,
      maGoiTap,
      maHd: newMaHd,
      ngayKt: newNgayKt
    });
  };

  const handleDateOrQuantityChange = (field: string, value: any) => {
    const newItem = { ...item, [field]: value };
    
    const pkg = packages.find((p: any) => p.maGoiTap === newItem.maGoiTap);
    
    if (field === 'ngayBd' && !isEdit && pkg) {
      newItem.maHd = generateMaHD(pkg.loaiGoitap, newItem.ngayBd, contracts);
    }

    if (pkg && newItem.ngayBd && newItem.soLuong) {
      newItem.ngayKt = calculateNgayKT(newItem.ngayBd, pkg.thoihan, newItem.soLuong);
    }

    setItem(newItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>
        <form onSubmit={onSave} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã Học Viên</label>
            <select 
              required 
              className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={item.maHv} 
              onChange={(e) => setItem({...item, maHv: e.target.value})}
            >
              <option value="">-- Chọn học viên --</option>
              {members.map((m: any) => (
                <option key={m.maHv} value={m.maHv}>{m.ho} {m.ten} - {m.maHv}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gói Tập</label>
            <select 
              required 
              className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={item.maGoiTap} 
              onChange={(e) => handlePackageChange(e.target.value)}
            >
              <option value="">-- Chọn gói tập --</option>
              {packages.map((p: any) => (
                <option key={p.maGoiTap} value={p.maGoiTap}>
                  {p.maGoiTap} - {p.tenGoi} ({p.loaiGoitap}) - {p.thoihan} ngày
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã HĐ</label>
              <input type="text" required disabled={true} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none bg-gray-100 cursor-not-allowed"
                value={item.maHd} placeholder="Tự động sinh" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trạng thái</label>
              <select 
                className={`w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${!isEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                value={item.trangThaiHd} 
                onChange={(e) => setItem({...item, trangThaiHd: e.target.value})}
                disabled={!isEdit}
              >
                {isEdit ? (
                  <>
                    {item.trangThaiHd === 'Active' && <option value="Active">Active</option>}
                    {item.trangThaiHd === 'Expired' && <option value="Expired">Expired</option>}
                    <option value="Locked">Locked</option>
                  </>
                ) : (
                  <option value="Locked">Locked</option>
                )}
              </select>
            </div>
          </div>

          {isEdit && item.trangThaiHd === 'Locked' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 text-red-500">Lý do khóa {item.originalTrangThai !== 'Locked' ? '(Bắt buộc)' : ''}</label>
              <input type="text" required={item.originalTrangThai !== 'Locked'} className="w-full p-2.5 border border-red-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                value={item.lyDoKhoa || ''} 
                onChange={(e) => setItem({...item, lyDoKhoa: e.target.value})} 
                placeholder="Nhập lý do khóa hợp đồng..." />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày bắt đầu</label>
              <input type="date" required className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={item.ngayBd?.split('T')[0] || ''} 
                onChange={(e) => handleDateOrQuantityChange('ngayBd', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số lượng</label>
              <input type="number" required min="1" 
                className={`w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${isEdit && ['Active', 'Expired', 'Locked'].includes(item.trangThaiHd) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                value={item.soLuong} 
                disabled={isEdit && ['Active', 'Expired', 'Locked'].includes(item.trangThaiHd)}
                onChange={(e) => handleDateOrQuantityChange('soLuong', parseInt(e.target.value) || 1)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày kết thúc</label>
            <input type="date" required disabled={true} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none bg-gray-100 cursor-not-allowed"
              value={item.ngayKt?.split('T')[0] || ''} placeholder="Tự động tính" />
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
