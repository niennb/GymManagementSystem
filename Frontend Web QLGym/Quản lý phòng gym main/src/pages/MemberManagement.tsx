import React, { useState, useEffect, useCallback, useMemo } from 'react';
import TableLayout from '../components/TableLayout';
import { Filter } from 'lucide-react';

import { updateRelatedStatuses } from '../lib/statusUpdater';

const COLUMNS = [
  { key: 'maHv', label: 'Mã HV', sortable: true },
  { key: 'ho', label: 'Họ', sortable: true },
  { key: 'ten', label: 'Tên', sortable: true },
  { key: 'ngaysinh', label: 'Ngày sinh', sortable: true },
  { key: 'sdt', label: 'Số điện thoại', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'gioitinh', label: 'Giới tính', sortable: true },
  { key: 'cccd', label: 'CCCD', sortable: true },
  { key: 'diaChi', label: 'Địa chỉ', sortable: true },
  { key: 'lyDoKhoa', label: 'Lý do khóa', sortable: true },
  { 
    key: 'trangthai', 
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

export default function MemberManagement() {
  const [members, setMembers] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom Modals State
  const [alertMessage, setAlertMessage] = useState('');
  const [memberToDelete, setMemberToDelete] = useState<any>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Sorting
  const [sortKey, setSortKey] = useState<string>('maHv');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filtering
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    gioitinh: '',
    trangthai: '',
    namSinh: ''
  });
  
  // State cho hội viên mới và hội viên đang sửa
  const [newMember, setNewMember] = useState({ 
    maHv: '', 
    ho: '',
    ten: '', 
    sdt: '', 
    email: '', 
    gioitinh: 'Nam', 
    ngaysinh: '', 
    cccd: '',
    diaChi: '',
    trangthai: 'Locked',
    ngaygianhap: new Date().toISOString().split('T')[0]
  });
  const [editingMember, setEditingMember] = useState<any>(null);

  const API_URL = 'http://localhost:5079/api/members';

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setLoadingProgress(10);
    try {
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => prev >= 90 ? 90 : prev + 15);
      }, 100);
      
      const [membersRes, contractsRes, invoicesRes] = await Promise.all([
        fetch(API_URL, { cache: 'no-store' }),
        fetch('http://localhost:5079/api/hopdongs'),
        fetch('http://localhost:5079/api/hoadons')
      ]);
      
      const [membersData, contractsData, invoicesData] = await Promise.all([
        membersRes.ok ? membersRes.json() : [],
        contractsRes.ok ? contractsRes.json() : [],
        invoicesRes.ok ? invoicesRes.json() : []
      ]);
      
      clearInterval(progressInterval);
      setLoadingProgress(100);
      
      const today = new Date().toISOString().split('T')[0];

      const processedData = membersData.map((item: any) => {
        let ho = item.ho || item.Ho || '';
        let ten = item.ten || item.Ten || '';
        if (!ho && ten) {
          const parts = ten.split(' ');
          ten = parts.pop() || '';
          ho = parts.join(' ') || '';
        }
        
        const maHv = item.maHv || item.MaHv || item.MaHV;
        let currentStatus = item.trangthai || item.Trangthai || item.TrangThai || 'Locked';

        // Time-based check for members
        const memberContracts = contractsData.filter((c: any) => (c.maHv || c.MaHv || c.MaHV) === maHv);
        let hasActive = false;
        let hasAnyInvoice = false;

        for (const c of memberContracts) {
          const cMaHd = c.maHd || c.MaHd || c.MaHD;
          const hasInv = invoicesData.some((i: any) => i.maHd === cMaHd || i.MaHD === cMaHd || i.MaHd === cMaHd);
          if (hasInv) {
            hasAnyInvoice = true;
            const cNgayKt = c.ngayKt || c.NgayKt || c.NgayKT;
            if (cNgayKt && cNgayKt.split('T')[0] >= today) {
              hasActive = true;
              break;
            }
          }
        }

        const lyDoKhoa = item.lyDoKhoa || item.LyDoKhoa || '';
        let newStatus = currentStatus;

        // Rule: If all contracts are locked, member is locked
        const allContractsLocked = memberContracts.length > 0 && memberContracts.every((c: any) => {
          const cStatus = c.trangThaiHd || c.TrangThaiHd || c.TrangThaiHD;
          return cStatus === 'Locked';
        });

        if (lyDoKhoa || allContractsLocked) {
          newStatus = 'Locked';
        } else {
          if (hasActive) {
            newStatus = 'Active';
          } else if (hasAnyInvoice) {
            newStatus = 'Expired';
          } else {
            newStatus = 'Locked';
          }
        }

        if (newStatus !== currentStatus) {
          currentStatus = newStatus;
          // Fire and forget update
          fetch(`${API_URL}/${maHv}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...item, trangthai: newStatus })
          }).catch(console.error);
        }

        return { 
          ...item, 
          ho, 
          ten, 
          cccd: item.cccd || item.Cccd || item.CCCD || '',
          diaChi: item.diaChi || item.DiaChi || '',
          lyDoKhoa: item.lyDoKhoa || item.LyDoKhoa || '',
          trangthai: currentStatus 
        };
      });

      setMembers(processedData);
      
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
    fetchMembers();
  }, [fetchMembers]);

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

  const generateMaHv = () => {
    if (members.length === 0) return 'HV01';
    
    const numbers = members.map(m => {
      const match = m.maHv?.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    
    const maxNumber = Math.max(...numbers, 0);
    const nextNumber = maxNumber + 1;
    return `HV${nextNumber.toString().padStart(2, '0')}`;
  };

  const handleAdd = () => {
    setNewMember({ 
      maHv: generateMaHv(), 
      ho: '',
      ten: '', 
      sdt: '', 
      email: '', 
      gioitinh: 'Nam', 
      ngaysinh: '', 
      trangthai: 'Locked',
      ngaygianhap: new Date().toISOString().split('T')[0],
      cccd: '',
      diaChi: ''
    });
    setShowAddModal(true);
  };

  const processedMembers = useMemo(() => {
    let result = [...members];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(m => 
        (m.ten && m.ten.toLowerCase().includes(lowerSearch)) ||
        (m.ho && m.ho.toLowerCase().includes(lowerSearch)) ||
        (m.ho && m.ten && `${m.ho} ${m.ten}`.toLowerCase().includes(lowerSearch)) ||
        (m.maHv && m.maHv.toLowerCase().includes(lowerSearch)) ||
        (m.sdt && m.sdt.includes(searchTerm))
      );
    }

    if (filters.gioitinh) {
      result = result.filter(m => m.gioitinh === filters.gioitinh);
    }
    if (filters.trangthai) {
      result = result.filter(m => m.trangthai === filters.trangthai);
    }
    if (filters.namSinh) {
      result = result.filter(m => m.ngaysinh && m.ngaysinh.startsWith(filters.namSinh));
    }

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
  }, [members, searchTerm, filters, sortKey, sortDirection]);

  const totalPages = Math.ceil(processedMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = processedMembers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const validateMember = (member: any, isEdit = false) => {
    const otherMembers = isEdit ? members.filter(m => m.maHv !== member.maHv) : members;
    
    if (!isEdit && members.some(m => m.maHv.toLowerCase() === member.maHv.toLowerCase())) {
      setAlertMessage("Lỗi: Mã hội viên này đã tồn tại!");
      return false;
    }
    if (!/^\d{10}$/.test(member.sdt)) {
      setAlertMessage("Lỗi: Số điện thoại phải gồm đúng 10 chữ số!");
      return false;
    }
    if (otherMembers.some(m => m.sdt === member.sdt)) {
      setAlertMessage("Lỗi: Số điện thoại này đã được đăng ký bởi hội viên khác!");
      return false;
    }
    if (otherMembers.some(m => m.email?.toLowerCase() === member.email?.toLowerCase())) {
      setAlertMessage("Lỗi: Email này đã được đăng ký bởi hội viên khác!");
      return false;
    }
    if (member.cccd && otherMembers.some(m => m.cccd === member.cccd)) {
      setAlertMessage("Lỗi: CCCD này đã được đăng ký bởi hội viên khác!");
      return false;
    }
    return true;
  };

  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateMember(newMember)) return;

    setShowAddModal(false);
    setIsLoading(true);

    const payload = {
      ...newMember
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setAlertMessage("Thêm hội viên thành công!");
        fetchMembers();
      } else {
        const errData = await response.json().catch(() => ({}));
        setAlertMessage(errData.message || "Lỗi: Không thể lưu. Có thể dữ liệu bị trùng trong SQL Server!");
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
    if (!validateMember(editingMember, true)) return;

    setShowEditModal(false);
    setIsLoading(true);

    const payload = {
      ...editingMember
    };

    if (payload.trangthai !== 'Locked') {
      payload.lyDoKhoa = '';
      payload.LyDoKhoa = '';
    }

    try {
      const response = await fetch(`${API_URL}/${editingMember.maHv}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        // Cascading lock: if member is locked, lock all their contracts with the same reason
        if (payload.trangthai === 'Locked') {
          try {
            const contractsRes = await fetch('http://localhost:5079/api/hopdongs');
            if (contractsRes.ok) {
              const contractsData = await contractsRes.json();
              const memberContracts = contractsData.filter((c: any) => 
                (c.maHv === payload.maHv || c.MaHv === payload.maHv || c.MaHV === payload.maHv)
              );
              
              for (const contract of memberContracts) {
                const maHd = contract.maHd || contract.MaHd || contract.MaHD;
                const currentCStatus = contract.trangThaiHd || contract.TrangThaiHd || contract.TrangThaiHD;
                
                // Only update if not already locked with the same reason
                if (currentCStatus !== 'Locked' || (contract.lyDoKhoa || contract.LyDoKhoa) !== payload.lyDoKhoa) {
                  await fetch(`http://localhost:5079/api/hopdongs/${maHd}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      ...contract, 
                      TrangThaiHD: 'Locked', 
                      trangThaiHd: 'Locked',
                      LyDoKhoa: payload.lyDoKhoa,
                      lyDoKhoa: payload.lyDoKhoa
                    })
                  });
                }
              }
            }
          } catch (err) {
            console.error("Lỗi khi khóa hợp đồng của hội viên:", err);
          }
        }

        setAlertMessage("Cập nhật thành công!");
        fetchMembers();
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

  const handleDelete = (member: any) => {
    setMemberToDelete(member);
  };

  const executeDelete = async () => {
    if (!memberToDelete) return;
    
    setMemberToDelete(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/${memberToDelete.maHv}`, { 
        method: 'DELETE' 
      });
      
      if (response.ok) {
        setAlertMessage("Xóa thành công!");
        fetchMembers();
      } else {
        const errData = await response.json().catch(() => ({}));
        setAlertMessage(errData.message || "Không thể xóa hội viên này!");
        setIsLoading(false);
      }
    } catch (error) { 
      console.error(error); 
      setAlertMessage("Lỗi kết nối đến máy chủ!");
      setIsLoading(false); 
    }
  };

  const handleEdit = (member: any) => {
    setEditingMember({
      ...member,
      originalTrangthai: member.trangthai
    });
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Giới tính</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-md text-sm"
                value={filters.gioitinh}
                onChange={(e) => setFilters({...filters, gioitinh: e.target.value})}
              >
                <option value="">Tất cả</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Trạng thái</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-md text-sm"
                value={filters.trangthai}
                onChange={(e) => setFilters({...filters, trangthai: e.target.value})}
              >
                <option value="">Tất cả</option>
                <option value="Active">Active</option>
                <option value="Locked">Locked</option>
                <option value="Expired">Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Năm sinh</label>
              <input 
                type="number" 
                placeholder="VD: 1990"
                className="w-full p-2 border border-slate-300 rounded-md text-sm"
                value={filters.namSinh}
                onChange={(e) => setFilters({...filters, namSinh: e.target.value})}
              />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end gap-2">
            <button 
              onClick={() => {
                setFilters({ gioitinh: '', trangthai: '', namSinh: '' });
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
        title="Danh sách hội viên" 
        columns={COLUMNS} 
        data={paginatedMembers} 
        onAdd={handleAdd} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
        onSearch={handleSearch} 
        searchPlaceholder="Tìm theo tên, họ và tên, SĐT..."
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
        <MemberFormModal title="Thêm hội viên mới" member={newMember} setMember={setNewMember} onSave={handleSaveNew} onClose={() => setShowAddModal(false)} isEdit={false} />
      )}

      {showEditModal && (
        <MemberFormModal title="Chỉnh sửa hội viên" member={editingMember} setMember={setEditingMember} onSave={handleUpdate} onClose={() => setShowEditModal(false)} isEdit={true} />
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
      {memberToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm p-6 bg-white rounded-xl shadow-2xl text-center">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Xác nhận xóa</h3>
            <p className="text-slate-600 mb-6">Bạn có chắc muốn xoá hội viên {memberToDelete.ho} {memberToDelete.ten}?</p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setMemberToDelete(null)}
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

function MemberFormModal({ title, member, setMember, onSave, onClose, isEdit }: any) {
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
              <label className="block text-xs font-bold text-gray-500 uppercase">Mã HV</label>
              <input type="text" required disabled={true} className="w-full p-2 border rounded-lg outline-none bg-gray-100 cursor-not-allowed"
                value={member.maHv} onChange={(e) => setMember({...member, maHv: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Ngày sinh</label>
              <input type="date" required className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={member.ngaysinh?.split('T')[0] || ''} onChange={(e) => setMember({...member, ngaysinh: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Họ</label>
              <input type="text" required className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={member.ho || ''} onChange={(e) => setMember({...member, ho: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Tên</label>
              <input type="text" required className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={member.ten || ''} onChange={(e) => setMember({...member, ten: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">SĐT (10 số)</label>
              <input type="text" required maxLength={10} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={member.sdt} onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setMember({...member, sdt: value});
                }} placeholder="VD: 0912345678" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Giới tính</label>
              <select className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={member.gioitinh} onChange={(e) => setMember({...member, gioitinh: e.target.value})}>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">Email</label>
            <input type="email" required className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={member.email} onChange={(e) => setMember({...member, email: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">CCCD</label>
              <input type="text" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={member.cccd || ''} onChange={(e) => setMember({...member, cccd: e.target.value})} placeholder="Số CCCD" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Địa chỉ</label>
              <input type="text" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={member.diaChi || ''} onChange={(e) => setMember({...member, diaChi: e.target.value})} placeholder="Số nhà, Tên đường..." />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">Trạng thái</label>
            <select 
              className={`w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${!isEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              value={member.trangthai} 
              onChange={(e) => setMember({...member, trangthai: e.target.value})}
              disabled={!isEdit}
            >
              {isEdit ? (
                <>
                  {member.trangthai === 'Active' && <option value="Active">Active</option>}
                  {member.trangthai === 'Expired' && <option value="Expired">Expired</option>}
                  <option value="Locked">Locked</option>
                </>
              ) : (
                <option value="Locked">Locked</option>
              )}
            </select>
          </div>
          
          {isEdit && member.trangthai === 'Locked' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase text-red-500">Lý do khóa {member.originalTrangthai !== 'Locked' ? '(Bắt buộc)' : ''}</label>
              <input type="text" required={member.originalTrangthai !== 'Locked'} className="w-full p-2 border border-red-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                value={member.lyDoKhoa || ''} 
                onChange={(e) => setMember({...member, lyDoKhoa: e.target.value})} 
                placeholder="Nhập lý do khóa hội viên..." />
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Lưu thông tin</button>
          </div>
        </form>
      </div>
    </div>
  );
}
