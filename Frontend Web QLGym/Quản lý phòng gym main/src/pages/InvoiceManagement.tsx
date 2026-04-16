import React, { useState, useEffect, useCallback, useMemo } from 'react';
import TableLayout from '../components/TableLayout';
import { Filter } from 'lucide-react';

import { updateRelatedStatuses } from '../lib/statusUpdater';

const COLUMNS = [
  { key: 'maHoaDon', label: 'Mã Hóa Đơn', sortable: true },
  { key: 'maHd', label: 'Mã Hợp Đồng', sortable: true },
  { key: 'ngayThanhToanFormatted', label: 'Ngày thanh toán', sortable: true },
  { key: 'phuongThucTt', label: 'Phương thức TT', sortable: true },
  { key: 'soTienFormatted', label: 'Cần thanh toán', sortable: true },
  { key: 'daTtFormatted', label: 'Đã thanh toán', sortable: true },
  { key: 'conNoFormatted', label: 'Còn nợ', sortable: true },
  { key: 'nguoiLapHoaDon', label: 'Người lập hóa đơn', sortable: true },
];

const PHUONG_THUC_TT = ['Tiền mặt', 'Chuyển khoản', 'Trả góp'];

export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom Modals State
  const [alertMessage, setAlertMessage] = useState('');
  const [invoiceToDelete, setInvoiceToDelete] = useState<any>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Sorting
  const [sortKey, setSortKey] = useState<string>('maHoaDon');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  // Filtering
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    phuongThucTt: '',
    namThanhToan: '',
    maHd: ''
  });
  
  const [newInvoice, setNewInvoice] = useState({ 
    maHoaDon: '', 
    maHd: '', 
    ngayThanhToan: new Date().toISOString().split('T')[0], 
    soLuongHoaDon: 1,
    phuongThucTt: 'Tiền mặt',
    soTien: 0,
    daTt: 0,
    conNo: 0,
    nguoiLapHoaDon: ''
  });
  const [editingInvoice, setEditingInvoice] = useState<any>(null);

  const API_URL = 'http://localhost:5079/api/hoadons';

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoadingProgress(10);
    try {
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => prev >= 90 ? 90 : prev + 15);
      }, 100);
      
      const [invoicesRes, contractsRes, membersRes, packagesRes, staffsRes] = await Promise.all([
        fetch(API_URL),
        fetch('http://localhost:5079/api/hopdongs'),
        fetch('http://localhost:5079/api/members'),
        fetch('http://localhost:5079/api/goitaps'),
        fetch('http://localhost:5079/api/nhanviens')
      ]);

      const [invoicesData, contractsData, membersData, packagesData, staffsData] = await Promise.all([
        invoicesRes.ok ? invoicesRes.json() : [],
        contractsRes.ok ? contractsRes.json() : [],
        membersRes.ok ? membersRes.json() : [],
        packagesRes.ok ? packagesRes.json() : [],
        staffsRes.ok ? staffsRes.json() : []
      ]);
      
      clearInterval(progressInterval);
      setLoadingProgress(100);
      
      // Map properties to camelCase
      const formattedInvoices = invoicesData.map((i: any) => ({
        maHoaDon: i.maHoaDon || i.MaHoaDon || i.maHdon || i.MaHdon,
        maHd: i.maHd || i.MaHd || i.MaHD,
        ngayThanhToan: i.ngayThanhToan || i.NgayThanhToan || i.ngayLap || i.NgayLap,
        soLuongHoaDon: i.soLuongHoaDon !== undefined ? i.soLuongHoaDon : (i.SoLuongHoaDon || 1),
        phuongThucTt: i.phuongThucTt || i.PhuongThucTt || i.PhuongThucTT || 'Tiền mặt',
        soTien: i.soTien !== undefined ? i.soTien : (i.SoTien || i.tongTien || i.TongTien || 0),
        daTt: i.daTt !== undefined ? i.daTt : (i.DaTT || 0),
        conNo: i.conNo !== undefined ? i.conNo : (i.ConNo || 0),
        nguoiLapHoaDon: i.nguoiLapHoaDon || i.NguoiLapHoaDon || ''
      }));

      const formattedContracts = contractsData.map((c: any) => ({
        maHd: c.maHd || c.MaHd || c.MaHD,
        maHv: c.maHv || c.MaHv || c.MaHV,
        maGoiTap: c.maGoiTap || c.MaGoiTap,
        soLuong: c.soLuong !== undefined ? c.soLuong : (c.SoLuong || 1),
        ngayBd: c.ngayBd || c.NgayBd || c.NgayBD,
        ngayKt: c.ngayKt || c.NgayKt || c.NgayKT,
        trangThaiHd: c.trangThaiHd || c.TrangThaiHd || c.TrangThaiHD
      }));

      const formattedMembers = membersData.map((m: any) => ({
        maHv: m.maHv || m.MaHv,
        ho: m.ho || m.Ho,
        ten: m.ten || m.Ten
      }));

      const formattedPackages = packagesData.map((p: any) => ({
        maGoiTap: p.maGoiTap || p.MaGoiTap,
        tenGoi: p.tenGoi || p.TenGoi,
        giaTien: p.giaTien !== undefined ? p.giaTien : (p.GiaTien || 0),
        thoihan: p.thoihan !== undefined ? p.thoihan : (p.Thoihan || 0)
      }));

      const formattedStaffs = staffsData.map((s: any) => ({
        maNv: s.maNv || s.MaNv || s.MaNV,
        hoNv: s.hoNv || s.HoNv || s.HoNV,
        tenNv: s.tenNv || s.TenNv || s.TenNV
      }));
      
      setInvoices(formattedInvoices);
      setContracts(formattedContracts);
      setMembers(formattedMembers);
      setPackages(formattedPackages);
      setStaffs(formattedStaffs);
      
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

  const generateMaHoaDon = (ngayThanhToan: string, currentInvoices: any[]) => {
    if (!ngayThanhToan) return '';
    const year = new Date(ngayThanhToan).getFullYear().toString().slice(-2);
    const prefix = `INV${year}`;
    
    const samePrefixInvoices = currentInvoices.filter(i => i.maHoaDon && i.maHoaDon.startsWith(prefix));
    const numbers = samePrefixInvoices.map(i => {
      const numStr = i.maHoaDon.replace(prefix, '');
      return parseInt(numStr, 10) || 0;
    });
    
    const maxNumber = Math.max(...numbers, 0);
    return `${prefix}${(maxNumber + 1).toString().padStart(2, '0')}`;
  };

  const handleAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    setNewInvoice({ 
      maHoaDon: generateMaHoaDon(today, invoices), 
      maHd: '', 
      ngayThanhToan: today, 
      soLuongHoaDon: 1,
      phuongThucTt: 'Tiền mặt',
      soTien: 0,
      daTt: 0,
      conNo: 0,
      nguoiLapHoaDon: ''
    });
    setShowAddModal(true);
  };

  const processedInvoices = useMemo(() => {
    let result = [...invoices];

    // Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(i => 
        (i.maHoaDon && i.maHoaDon.toLowerCase().includes(lowerSearch)) || 
        (i.maHd && i.maHd.toLowerCase().includes(lowerSearch))
      );
    }

    // Filters
    if (filters.phuongThucTt) result = result.filter(i => i.phuongThucTt === filters.phuongThucTt);
    if (filters.maHd) result = result.filter(i => i.maHd && i.maHd.toLowerCase().includes(filters.maHd.toLowerCase()));
    if (filters.namThanhToan) result = result.filter(i => i.ngayThanhToan && i.ngayThanhToan.startsWith(filters.namThanhToan));

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        let valA = a[sortKey] || '';
        let valB = b[sortKey] || '';
        
        if (sortKey === 'ngayThanhToanFormatted') {
          valA = a.ngayThanhToan ? new Date(a.ngayThanhToan).getTime() : 0;
          valB = b.ngayThanhToan ? new Date(b.ngayThanhToan).getTime() : 0;
        } else if (sortKey === 'soTienFormatted') {
          valA = a.soTien;
          valB = b.soTien;
        } else if (sortKey === 'daTtFormatted') {
          valA = a.daTt;
          valB = b.daTt;
        } else if (sortKey === 'conNoFormatted') {
          valA = a.conNo;
          valB = b.conNo;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [invoices, filters, sortKey, sortDirection, searchTerm]);

  const totalPages = Math.ceil(processedInvoices.length / ITEMS_PER_PAGE);
  const paginatedInvoices = processedInvoices.slice(
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

  const displayData = paginatedInvoices.map(i => ({
    ...i,
    ngayThanhToanFormatted: formatDate(i.ngayThanhToan),
    soTienFormatted: formatCurrency(i.soTien),
    daTtFormatted: formatCurrency(i.daTt),
    conNoFormatted: formatCurrency(i.conNo)
  }));

  const validateInvoice = (invoice: any, isEdit = false) => {
    if (!invoice.maHd) {
      setAlertMessage("Vui lòng chọn hợp đồng!");
      return false;
    }
    if (invoice.soTien < 0 || invoice.daTt < 0) {
      setAlertMessage("Số tiền không được âm!");
      return false;
    }
    return true;
  };

  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInvoice(newInvoice)) return;

    setShowAddModal(false);
    setIsLoading(true);

    const payload = {
      MaHoaDon: newInvoice.maHoaDon,
      MaHD: newInvoice.maHd,
      NgayThanhToan: newInvoice.ngayThanhToan,
      SoLuongHoaDon: newInvoice.soLuongHoaDon,
      PhuongThucTT: newInvoice.phuongThucTt,
      SoTien: newInvoice.soTien,
      DaTT: newInvoice.daTt,
      ConNo: newInvoice.conNo,
      NguoiLapHoaDon: newInvoice.nguoiLapHoaDon
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await updateRelatedStatuses(newInvoice.maHd, newInvoice.ngayThanhToan);
        setAlertMessage("Thêm hóa đơn thành công!");
        fetchData();
      } else {
        const errData = await response.json().catch(() => ({}));
        setAlertMessage(errData.message || "Lỗi khi lưu hóa đơn!");
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
    if (!validateInvoice(editingInvoice, true)) return;

    setShowEditModal(false);
    setIsLoading(true);

    const payload = {
      MaHoaDon: editingInvoice.maHoaDon,
      MaHD: editingInvoice.maHd,
      NgayThanhToan: editingInvoice.ngayThanhToan,
      SoLuongHoaDon: editingInvoice.soLuongHoaDon,
      PhuongThucTT: editingInvoice.phuongThucTt,
      SoTien: editingInvoice.soTien,
      DaTT: editingInvoice.daTt,
      ConNo: editingInvoice.conNo,
      NguoiLapHoaDon: editingInvoice.nguoiLapHoaDon
    };

    try {
      const response = await fetch(`${API_URL}/${editingInvoice.maHoaDon}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await updateRelatedStatuses(editingInvoice.maHd, editingInvoice.ngayThanhToan);
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

  const handleDelete = (invoice: any) => {
    setInvoiceToDelete(invoice);
  };

  const executeDelete = async () => {
    if (!invoiceToDelete) return;
    
    const idToDelete = invoiceToDelete.maHoaDon;
    setInvoiceToDelete(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/${idToDelete}`, { method: 'DELETE' });
      if (response.ok) {
        await updateRelatedStatuses(invoiceToDelete.maHd || invoiceToDelete.MaHd);
        setAlertMessage("Xóa hóa đơn thành công!");
        fetchData();
      } else {
        const errData = await response.json().catch(() => ({}));
        setAlertMessage(errData.message || "Không thể xóa hóa đơn này!");
        setIsLoading(false);
      }
    } catch (error) { 
      console.error(error); 
      setAlertMessage("Lỗi kết nối đến máy chủ!");
      setIsLoading(false);
    }
  };

  const getContractDisplayName = (contract: any) => {
    const member = members.find((m: any) => m.maHv === contract.maHv);
    const memberName = member ? `${member.ho} ${member.ten}` : contract.maHv;
    return `${memberName} - ${contract.maHd}`;
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Phương thức TT</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-md text-sm"
                value={filters.phuongThucTt}
                onChange={(e) => setFilters({...filters, phuongThucTt: e.target.value})}
              >
                <option value="">Tất cả</option>
                {PHUONG_THUC_TT.map(pt => <option key={pt} value={pt}>{pt}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Hợp Đồng</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-md text-sm"
                value={filters.maHd}
                onChange={(e) => setFilters({...filters, maHd: e.target.value})}
              >
                <option value="">Tất cả</option>
                {contracts.map(c => <option key={c.maHd} value={c.maHd}>{getContractDisplayName(c)}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Năm thanh toán</label>
              <input type="number" placeholder="VD: 2026" className="w-full p-2 border border-slate-300 rounded-md text-sm"
                value={filters.namThanhToan} onChange={(e) => setFilters({...filters, namThanhToan: e.target.value})} />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end gap-2">
            <button 
              onClick={() => {
                setFilters({ phuongThucTt: '', namThanhToan: '', maHd: '' });
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
        title="Quản lý Hóa Đơn" 
        columns={COLUMNS} 
        data={displayData} 
        onAdd={handleAdd} 
        onEdit={(i) => { setEditingInvoice(i); setShowEditModal(true); }} 
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
        <InvoiceFormModal 
          title="Thêm Hóa Đơn" 
          item={newInvoice} 
          setItem={setNewInvoice} 
          onSave={handleSaveNew} 
          onClose={() => setShowAddModal(false)} 
          isEdit={false} 
          contracts={contracts}
          members={members}
          packages={packages}
          invoices={invoices}
          staffs={staffs}
          generateMaHoaDon={generateMaHoaDon}
        />
      )}

      {showEditModal && (
        <InvoiceFormModal 
          title="Chỉnh sửa Hóa Đơn" 
          item={editingInvoice} 
          setItem={setEditingInvoice} 
          onSave={handleUpdate} 
          onClose={() => setShowEditModal(false)} 
          isEdit={true} 
          contracts={contracts}
          members={members}
          packages={packages}
          invoices={invoices}
          staffs={staffs}
          generateMaHoaDon={generateMaHoaDon}
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
      {invoiceToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm p-6 bg-white rounded-xl shadow-2xl text-center">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Xác nhận xóa</h3>
            <p className="text-slate-600 mb-6">Bạn có chắc muốn xoá hóa đơn {invoiceToDelete.maHoaDon}?</p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setInvoiceToDelete(null)}
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

function InvoiceFormModal({ title, item, setItem, onSave, onClose, isEdit, contracts, members, packages, invoices, staffs, generateMaHoaDon }: any) {
  
  const handleDateChange = (dateStr: string) => {
    let newMaHoaDon = item.maHoaDon;
    if (!isEdit) {
      newMaHoaDon = generateMaHoaDon(dateStr, invoices);
    }
    setItem({ ...item, ngayThanhToan: dateStr, maHoaDon: newMaHoaDon });
  };

  const handleContractChange = (maHd: string) => {
    const contract = contracts.find((c: any) => c.maHd === maHd);
    let soTien = 0;
    if (contract) {
      const pkg = packages.find((p: any) => p.maGoiTap === contract.maGoiTap);
      if (pkg) {
        soTien = pkg.giaTien * contract.soLuong;
      }
    }
    const conNo = Math.max(0, soTien - item.daTt);
    setItem({ ...item, maHd, soTien, conNo });
  };

  const handleMoneyChange = (field: string, value: number) => {
    const newItem = { ...item, [field]: value };
    newItem.conNo = Math.max(0, newItem.soTien - newItem.daTt);
    setItem(newItem);
  };

  // Helper to format contract display name
  const getContractDisplayName = (contract: any) => {
    const member = members.find((m: any) => m.maHv === contract.maHv);
    const pkg = packages.find((p: any) => p.maGoiTap === contract.maGoiTap);
    
    const memberName = member ? `${member.ho} ${member.ten} (${member.maHv})` : contract.maHv;
    const pkgName = pkg ? `${pkg.tenGoi} (${pkg.maGoiTap})` : contract.maGoiTap;
    
    return `${contract.maHd} - ${memberName} - ${pkgName}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl p-6 bg-white rounded-xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>
        <form onSubmit={onSave} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã Hợp Đồng</label>
            <select 
              required 
              className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={item.maHd} 
              onChange={(e) => handleContractChange(e.target.value)}
            >
              <option value="">-- Chọn hợp đồng --</option>
              {contracts.filter((c: any) => {
                // If editing and this is the current contract, keep it
                if (isEdit && c.maHd === item.maHd) return true;
                // Otherwise, check if it already has an invoice
                const hasInvoice = invoices.some((inv: any) => inv.maHd === c.maHd || inv.MaHd === c.maHd || inv.MaHD === c.maHd);
                return !hasInvoice;
              }).map((c: any) => (
                <option key={c.maHd} value={c.maHd}>{getContractDisplayName(c)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã Hóa Đơn</label>
              <input type="text" required disabled={true} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none bg-gray-100 cursor-not-allowed"
                value={item.maHoaDon} placeholder="Tự động sinh" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày thanh toán</label>
              <input type="date" required className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={item.ngayThanhToan?.split('T')[0] || ''} 
                onChange={(e) => handleDateChange(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số lượng hóa đơn</label>
              <input type="number" required min="1" className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={item.soLuongHoaDon} 
                onChange={(e) => setItem({...item, soLuongHoaDon: parseInt(e.target.value) || 1})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phương thức TT</label>
              <select 
                className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={item.phuongThucTt} 
                onChange={(e) => setItem({...item, phuongThucTt: e.target.value})}
              >
                {PHUONG_THUC_TT.map(pt => <option key={pt} value={pt}>{pt}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Người lập hóa đơn</label>
            <select 
              className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={item.nguoiLapHoaDon || ''} 
              onChange={(e) => setItem({...item, nguoiLapHoaDon: e.target.value})}
            >
              <option value="">-- Chọn người lập hóa đơn --</option>
              {staffs.map((s: any) => (
                <option key={s.maNv} value={s.maNv}>{s.tenNv} ({s.maNv})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cần thanh toán (VNĐ)</label>
              <input type="number" required disabled={true} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none bg-gray-100 cursor-not-allowed font-medium"
                value={item.soTien} />
              <p className="text-xs text-blue-600 mt-1 italic">{new Intl.NumberFormat('vi-VN').format(item.soTien)} VNĐ</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Đã thanh toán (VNĐ)</label>
              <input type="number" required min="0" className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={item.daTt} 
                onChange={(e) => handleMoneyChange('daTt', Number(e.target.value))} />
              <p className="text-xs text-blue-600 mt-1 italic">{new Intl.NumberFormat('vi-VN').format(item.daTt)} VNĐ</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Còn nợ (VNĐ)</label>
              <input type="number" required disabled={true} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none bg-gray-100 cursor-not-allowed text-red-600 font-medium"
                value={item.conNo} />
              <p className="text-xs text-red-600 mt-1 italic">{new Intl.NumberFormat('vi-VN').format(item.conNo)} VNĐ</p>
            </div>
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
