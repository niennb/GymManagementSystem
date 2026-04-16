import React, { useState, useEffect } from 'react';
import { Check, AlertCircle } from 'lucide-react';

const STEPS = ['Thông tin hội viên', 'Chọn gói tập', 'Thanh toán'];

// Mock data for packages 
export default function PackageRegistration() {
  const [currentStep, setCurrentStep] = useState(0);
  const [alertMessage, setAlertMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Step 1 State: Member Info
  const [memberInfo, setMemberInfo] = useState({
    maHv: '',
    ho: '',
    ten: '',
    soDienThoai: '',
    email: '',
    gioiTinh: 'Nam',
    ngaySinh: '',
    cccd: '',
    diaChi: ''
  });

  // Step 2 State: Contract Info
  const [contractInfo, setContractInfo] = useState({
    maHd: '',
    maGoiTap: '',
    soLuong: 1,
    ngayBatDau: new Date().toISOString().split('T')[0],
    ngayKetThuc: '',
  });

  // Step 3 State: Invoice Info
  const [invoiceInfo, setInvoiceInfo] = useState({
    maHoaDon: '',
    soLuongHoaDon: 1,
    soTien: 0,
    daTt: 0,
    phuongThucTt: 'Tiền mặt',
    ngayThanhToan: new Date().toISOString().split('T')[0],
    tinhTrang: 'Đã thanh toán',
    nguoiLapHoaDon: ''
  });

  const [staffs, setStaffs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successDetails, setSuccessDetails] = useState('');

  const generateMaHv = (membersList: any[]) => {
    if (membersList.length === 0) return 'HV01';
    const numbers = membersList.map(m => {
      const match = m.maHv?.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const maxNumber = Math.max(...numbers, 0);
    const nextNumber = maxNumber + 1;
    return `HV${nextNumber.toString().padStart(2, '0')}`;
  };

  const generateMaHd = (goiTapId: string, ngayBd: string, contractsList: any[], packagesList: any[]) => {
    if (!goiTapId || !ngayBd) return '';
    const selectedPackage = packagesList.find(p => p.maGoiTap === goiTapId);
    if (!selectedPackage) return '';
    
    const loaiGoiTap = (selectedPackage.loaiGoitap || '').toUpperCase();
    const year = new Date(ngayBd).getFullYear().toString().slice(-2);
    
    const prefix = `HD${loaiGoiTap}${year}`;
    const relatedContracts = contractsList.filter(c => c.maHd && c.maHd.startsWith(prefix));
    
    const numbers = relatedContracts.map(c => {
      const match = c.maHd.replace(prefix, '').match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    
    const maxNumber = Math.max(...numbers, 0);
    const nextNumber = maxNumber + 1;
    return `${prefix}${nextNumber.toString().padStart(2, '0')}`;
  };

  const generateMaHoaDon = (ngayTt: string, invoicesList: any[]) => {
    if (!ngayTt) return '';
    const year = new Date(ngayTt).getFullYear().toString().slice(-2);
    const prefix = `INV${year}`;
    
    const relatedInvoices = invoicesList.filter(i => i.maHoaDon && i.maHoaDon.startsWith(prefix));
    const numbers = relatedInvoices.map(i => {
      const match = i.maHoaDon.replace(prefix, '').match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    
    const maxNumber = Math.max(...numbers, 0);
    const nextNumber = maxNumber + 1;
    return `${prefix}${nextNumber.toString().padStart(2, '0')}`;
  };

  const fetchData = () => {
    Promise.all([
      fetch('http://localhost:5079/api/nhanviens'),
      fetch('http://localhost:5079/api/members'),
      fetch('http://localhost:5079/api/goitaps'),
      fetch('http://localhost:5079/api/hopdongs'),
      fetch('http://localhost:5079/api/hoadons')
    ])
    .then(responses => Promise.all(responses.map(res => res.ok ? res.json() : [])))
    .then(([staffsData, membersData, packagesData, contractsData, invoicesData]) => {
      const formattedStaffs = staffsData.map((s: any) => ({
        maNv: s.maNv || s.MaNv || s.MaNV,
        hoNv: s.hoNv || s.HoNv || s.HoNV,
        tenNv: s.tenNv || s.TenNv || s.TenNV
      }));
      setStaffs(formattedStaffs);

      const processedMembers = membersData.map((item: any) => {
        let ho = item.ho || item.Ho || '';
        let ten = item.ten || item.Ten || '';
        if (!ho && ten) {
          const parts = ten.split(' ');
          ten = parts.pop() || '';
          ho = parts.join(' ') || '';
        }
        return {
          ...item,
          maHv: item.maHv || item.MaHv || item.MaHV,
          ho,
          ten,
          sdt: item.sdt || item.Sdt || item.SDT || '',
          email: item.email || item.Email || ''
        };
      });
      setMembers(processedMembers);
      
      const formattedPackages = packagesData.map((p: any) => ({
        maGoiTap: p.maGoiTap || p.MaGoiTap,
        tenGoi: p.tenGoi || p.TenGoi,
        loaiGoitap: p.loaiGoitap || p.LoaiGoitap,
        giaTien: p.giaTien !== undefined ? p.giaTien : (p.GiaTien || 0),
        thoihan: p.thoihan !== undefined ? p.thoihan : (p.Thoihan || 0)
      }));
      setPackages(formattedPackages);
      
      const formattedContracts = contractsData.map((c: any) => ({
        maHd: c.maHd || c.MaHd || c.MaHD
      }));
      setContracts(formattedContracts);
      
      const formattedInvoices = invoicesData.map((i: any) => ({
        maHoaDon: i.maHoaDon || i.MaHoaDon || i.MaHoaDon
      }));
      setInvoices(formattedInvoices);

      // Initialize generated IDs
      setMemberInfo(prev => ({ ...prev, maHv: generateMaHv(processedMembers) }));
      
      if (formattedPackages.length > 0) {
        const firstPkgId = formattedPackages[0].maGoiTap;
        setContractInfo(prev => ({ 
          ...prev, 
          maGoiTap: firstPkgId,
          maHd: generateMaHd(firstPkgId, prev.ngayBatDau, formattedContracts, formattedPackages)
        }));
      }
      
      setInvoiceInfo(prev => ({
        ...prev,
        maHoaDon: generateMaHoaDon(prev.ngayThanhToan, formattedInvoices)
      }));
    })
    .catch(console.error);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-calculate End Date and Total Amount when Contract Info changes
  useEffect(() => {
    const selectedPackage = packages.find(p => p.maGoiTap === contractInfo.maGoiTap);
    if (selectedPackage && contractInfo.ngayBatDau) {
      const startDate = new Date(contractInfo.ngayBatDau);
      const totalDays = selectedPackage.thoihan * contractInfo.soLuong;
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + totalDays);
      
      const totalAmount = selectedPackage.giaTien * contractInfo.soLuong;

      setContractInfo(prev => ({
        ...prev,
        maHd: generateMaHd(contractInfo.maGoiTap, contractInfo.ngayBatDau, contracts, packages),
        ngayKetThuc: endDate.toISOString().split('T')[0]
      }));

      setInvoiceInfo(prev => ({
        ...prev,
        soTien: totalAmount,
        daTt: prev.tinhTrang === 'Đã thanh toán' ? totalAmount : prev.daTt
      }));
    }
  }, [contractInfo.maGoiTap, contractInfo.soLuong, contractInfo.ngayBatDau, packages, contracts]);

  // Auto-update Invoice ID when date changes
  useEffect(() => {
    setInvoiceInfo(prev => ({
      ...prev,
      maHoaDon: generateMaHoaDon(prev.ngayThanhToan, invoices)
    }));
  }, [invoiceInfo.ngayThanhToan, invoices]);

  // Auto-update Paid Amount based on Status
  useEffect(() => {
    if (invoiceInfo.tinhTrang === 'Đã thanh toán') {
      setInvoiceInfo(prev => ({ ...prev, daTt: prev.soTien }));
    } else {
      setInvoiceInfo(prev => ({ ...prev, daTt: 0 }));
    }
  }, [invoiceInfo.tinhTrang]);

  const validateStep1 = () => {
    if (!memberInfo.ho || !memberInfo.ten || !memberInfo.soDienThoai) {
      setAlertMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ Họ, Tên và Số điện thoại!' });
      return false;
    }
    if (!memberInfo.cccd) {
      setAlertMessage({ type: 'error', text: 'Vui lòng nhập CCCD/CMND!' });
      return false;
    }
    if (memberInfo.soDienThoai.length !== 10 || !/^\d+$/.test(memberInfo.soDienThoai)) {
      setAlertMessage({ type: 'error', text: 'Số điện thoại phải có đúng 10 chữ số!' });
      return false;
    }
    const isDuplicateSdt = members.some(m => m.sdt === memberInfo.soDienThoai);
    if (isDuplicateSdt) {
      setAlertMessage({ type: 'error', text: 'Số điện thoại này đã tồn tại!' });
      return false;
    }
    if (memberInfo.email) {
      if (!memberInfo.email.includes('@')) {
        setAlertMessage({ type: 'error', text: "Email phải chứa ký tự '@'!" });
        return false;
      }
      const isDuplicateEmail = members.some(m => m.email === memberInfo.email);
      if (isDuplicateEmail) {
        setAlertMessage({ type: 'error', text: 'Email này đã tồn tại!' });
        return false;
      }
    }
    return true;
  };

  const validateStep2 = () => {
    if (!contractInfo.maGoiTap) {
      setAlertMessage({ type: 'error', text: 'Vui lòng chọn gói tập!' });
      return false;
    }
    if (contractInfo.soLuong < 1) {
      setAlertMessage({ type: 'error', text: 'Số lượng phải lớn hơn hoặc bằng 1!' });
      return false;
    }
    if (!contractInfo.ngayBatDau) {
      setAlertMessage({ type: 'error', text: 'Vui lòng chọn ngày bắt đầu!' });
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (invoiceInfo.soLuongHoaDon < 1) {
      setAlertMessage({ type: 'error', text: 'Số lượng hóa đơn phải lớn hơn hoặc bằng 1!' });
      return false;
    }
    if (invoiceInfo.soTien < 0 || invoiceInfo.daTt < 0) {
      setAlertMessage({ type: 'error', text: 'Số tiền không được âm!' });
      return false;
    }
    return true;
  };

  const nextStep = () => {
    setAlertMessage(null);
    if (currentStep === 0 && !validateStep1()) return;
    if (currentStep === 1 && !validateStep2()) return;
    if (currentStep === 2 && !validateStep3()) return;
    setCurrentStep(p => Math.min(p + 1, STEPS.length - 1));
  };

  const prevStep = () => {
    setAlertMessage(null);
    setCurrentStep(p => Math.max(p - 1, 0));
  };

  const handleRegister = async () => {
    // Determine Contract Status based on Payment Status and Dates
    let contractStatus = 'Locked';
    if (invoiceInfo.tinhTrang === 'Đã thanh toán') {
      const today = new Date().toISOString().split('T')[0];
      contractStatus = contractInfo.ngayKetThuc >= today ? 'Active' : 'Expired';
    }

    try {
      // 1. Save Member
      const memberPayload = {
        MaHV: memberInfo.maHv,
        Ho: memberInfo.ho,
        Ten: memberInfo.ten,
        Sdt: memberInfo.soDienThoai,
        Email: memberInfo.email,
        Gioitinh: memberInfo.gioiTinh,
        Ngaysinh: memberInfo.ngaySinh || null,
        Trangthai: contractStatus,
        Cccd: memberInfo.cccd,
        DiaChi: memberInfo.diaChi
      };
      
      const memberRes = await fetch('http://localhost:5079/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberPayload)
      });
      
      if (!memberRes.ok) throw new Error('Lỗi khi lưu thông tin hội viên');

      // 2. Save Contract
      const contractPayload = {
        MaHD: contractInfo.maHd,
        MaHV: memberInfo.maHv,
        MaGoiTap: contractInfo.maGoiTap,
        NgayBD: contractInfo.ngayBatDau,
        NgayKT: contractInfo.ngayKetThuc,
        SoLuong: contractInfo.soLuong,
        TrangThaiHD: contractStatus
      };

      const contractRes = await fetch('http://localhost:5079/api/hopdongs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractPayload)
      });

      if (!contractRes.ok) throw new Error('Lỗi khi lưu hợp đồng');

      // 3. Save Invoice (only if paid)
      if (invoiceInfo.tinhTrang === 'Đã thanh toán') {
        const invoicePayload = {
          MaHoaDon: invoiceInfo.maHoaDon,
          MaHD: contractInfo.maHd,
          NgayThanhToan: invoiceInfo.ngayThanhToan,
          SoLuongHoaDon: invoiceInfo.soLuongHoaDon,
          PhuongThucTT: invoiceInfo.phuongThucTt,
          SoTien: invoiceInfo.soTien,
          DaTT: invoiceInfo.daTt,
          ConNo: invoiceInfo.soTien - invoiceInfo.daTt,
          NguoiLapHoaDon: invoiceInfo.nguoiLapHoaDon
        };

        const invoiceRes = await fetch('http://localhost:5079/api/hoadons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invoicePayload)
        });

        if (!invoiceRes.ok) throw new Error('Lỗi khi lưu hóa đơn');
      }

      setAlertMessage(null);
      setSuccessDetails(`Hợp đồng ở trạng thái: ${contractStatus}. ${invoiceInfo.tinhTrang === 'Chưa thanh toán' ? 'Không lưu hóa đơn.' : 'Đã lưu hóa đơn.'}`);
      setShowSuccessModal(true);
      
    } catch (error: any) {
      setAlertMessage({ type: 'error', text: error.message || 'Đã xảy ra lỗi khi đăng ký!' });
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setCurrentStep(0);
    
    // Reset member info
    setMemberInfo({
      maHv: '',
      ho: '',
      ten: '',
      soDienThoai: '',
      email: '',
      gioiTinh: 'Nam',
      ngaySinh: '',
      cccd: '',
      diaChi: ''
    });
    
    // Reset contract info
    setContractInfo(prev => ({
      ...prev,
      soLuong: 1,
      ngayBatDau: new Date().toISOString().split('T')[0],
      ngayKetThuc: '',
    }));
    
    // Reset invoice info
    setInvoiceInfo(prev => ({
      ...prev,
      soLuongHoaDon: 1,
      phuongThucTt: 'Tiền mặt',
      ngayThanhToan: new Date().toISOString().split('T')[0],
      tinhTrang: 'Đã thanh toán',
      nguoiLapHoaDon: ''
    }));

    // Re-fetch data to generate new IDs
    fetchData();
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-4 py-5 border-b border-slate-200 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-slate-900">Đăng ký gói tập mới</h3>
      </div>
      
      {/* Alert Message */}
      {alertMessage && (
        <div className={`mx-6 mt-4 p-4 rounded-md flex items-center gap-3 ${alertMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {alertMessage.type === 'success' ? <Check className="h-5 w-5 text-emerald-500" /> : <AlertCircle className="h-5 w-5 text-red-500" />}
          <p className="text-sm font-medium">{alertMessage.text}</p>
        </div>
      )}

      {/* Stepper */}
      <div className="px-4 py-5 sm:px-6">
        <nav aria-label="Progress">
          <ol role="list" className="flex items-center">
            {STEPS.map((step, stepIdx) => (
              <li key={step} className={`relative ${stepIdx !== STEPS.length - 1 ? 'pr-8 sm:pr-20 w-full' : ''}`}>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className={`h-0.5 w-full ${stepIdx < currentStep ? 'bg-blue-600' : 'bg-slate-200'}`} />
                </div>
                <div
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full 
                    ${stepIdx < currentStep ? 'bg-blue-600 hover:bg-blue-900' : 
                      stepIdx === currentStep ? 'border-2 border-blue-600 bg-white' : 
                      'border-2 border-slate-300 bg-white'}`}
                >
                  {stepIdx < currentStep ? (
                    <Check className="h-5 w-5 text-white" aria-hidden="true" />
                  ) : (
                    <span className={stepIdx === currentStep ? 'text-blue-600 font-medium' : 'text-slate-500 font-medium'}>
                      {stepIdx + 1}
                    </span>
                  )}
                </div>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-slate-500 w-max">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <div className="px-4 py-10 sm:px-6">
        {/* STEP 1: MEMBER INFO */}
        {currentStep === 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h4 className="font-medium text-slate-900 border-b pb-2">Nhập thông tin hội viên</h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mã hội viên (Tự sinh)</label>
                <input type="text" disabled value={memberInfo.maHv} className="block w-full rounded-md border-slate-300 bg-slate-100 shadow-sm sm:text-sm border px-3 py-2 text-slate-600 font-medium" />
              </div>
              <div className="sm:col-span-1"></div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ <span className="text-red-500">*</span></label>
                <input type="text" value={memberInfo.ho} onChange={e => setMemberInfo({...memberInfo, ho: e.target.value})} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 outline-none" placeholder="Nguyễn Văn" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên <span className="text-red-500">*</span></label>
                <input type="text" value={memberInfo.ten} onChange={e => setMemberInfo({...memberInfo, ten: e.target.value})} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 outline-none" placeholder="A" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                <input type="text" maxLength={10} value={memberInfo.soDienThoai} onChange={e => setMemberInfo({...memberInfo, soDienThoai: e.target.value})} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 outline-none" placeholder="0901234567" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={memberInfo.email} onChange={e => setMemberInfo({...memberInfo, email: e.target.value})} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 outline-none" placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Giới tính</label>
                <select value={memberInfo.gioiTinh} onChange={e => setMemberInfo({...memberInfo, gioiTinh: e.target.value})} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 outline-none">
                  <option>Nam</option>
                  <option>Nữ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày sinh</label>
                <input type="date" value={memberInfo.ngaySinh} onChange={e => setMemberInfo({...memberInfo, ngaySinh: e.target.value})} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CCCD/CMND <span className="text-red-500">*</span></label>
                <input type="text" value={memberInfo.cccd} onChange={e => setMemberInfo({...memberInfo, cccd: e.target.value})} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
                <input type="text" value={memberInfo.diaChi} onChange={e => setMemberInfo({...memberInfo, diaChi: e.target.value})} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 outline-none" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CONTRACT INFO */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h4 className="font-medium text-slate-900 border-b pb-2">Chọn gói tập (Hợp đồng)</h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mã hợp đồng (Tự sinh)</label>
                <input type="text" disabled value={contractInfo.maHd} className="block w-full rounded-md border-slate-300 bg-slate-100 shadow-sm sm:text-sm border px-3 py-2 text-slate-600 font-medium" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hội viên</label>
                <input type="text" disabled value={`${memberInfo.ho} ${memberInfo.ten}`.trim() || 'Chưa nhập tên'} className="block w-full rounded-md border-slate-300 bg-slate-100 shadow-sm sm:text-sm border px-3 py-2 text-slate-600" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Gói tập</label>
                <select value={contractInfo.maGoiTap} onChange={e => setContractInfo({...contractInfo, maGoiTap: e.target.value})} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 outline-none">
                  {packages.map(p => (
                    <option key={p.maGoiTap} value={p.maGoiTap}>
                      {p.tenGoi} ({p.loaiGoitap} - {p.thoihan} ngày) - {new Intl.NumberFormat('vi-VN').format(p.giaTien)}đ
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng</label>
                <input type="number" min="1" value={contractInfo.soLuong} onChange={e => setContractInfo({...contractInfo, soLuong: parseInt(e.target.value) || 1})} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày bắt đầu</label>
                <input type="date" value={contractInfo.ngayBatDau} onChange={e => setContractInfo({...contractInfo, ngayBatDau: e.target.value})} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày kết thúc (Tự động tính)</label>
                <input type="date" disabled value={contractInfo.ngayKetThuc} className="block w-full rounded-md border-slate-300 bg-blue-50 shadow-sm sm:text-sm border px-3 py-2 text-blue-700 font-medium" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: INVOICE INFO */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h4 className="font-medium text-slate-900 border-b pb-2">Thông tin thanh toán (Hóa đơn)</h4>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-600 mb-1">Mã hóa đơn</p>
                <p className="font-semibold text-slate-900">{invoiceInfo.maHoaDon}</p>
              </div>
              <div>
                <p className="text-sm text-blue-600 mb-1">Mã hợp đồng</p>
                <p className="font-semibold text-slate-900">{contractInfo.maHd}</p>
              </div>
              <div>
                <p className="text-sm text-blue-600 mb-1">Tổng tiền cần thanh toán</p>
                <p className="font-bold text-xl text-blue-700">{new Intl.NumberFormat('vi-VN').format(invoiceInfo.soTien)}đ</p>
              </div>
              <div>
                <p className="text-sm text-blue-600 mb-1">Số tiền còn nợ</p>
                <p className="font-bold text-xl text-red-600">{new Intl.NumberFormat('vi-VN').format(invoiceInfo.soTien - invoiceInfo.daTt)}đ</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tình trạng thanh toán</label>
                <select value={invoiceInfo.tinhTrang} onChange={e => setInvoiceInfo({...invoiceInfo, tinhTrang: e.target.value})} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2 outline-none font-medium">
                  <option value="Đã thanh toán">Đã thanh toán</option>
                  <option value="Chưa thanh toán">Chưa thanh toán</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng hóa đơn</label>
                <input type="number" min="1" value={invoiceInfo.soLuongHoaDon} onChange={e => setInvoiceInfo({...invoiceInfo, soLuongHoaDon: Number(e.target.value)})} disabled={invoiceInfo.tinhTrang === 'Chưa thanh toán'} className={`block w-full rounded-md border-slate-300 shadow-sm sm:text-sm border px-3 py-2 outline-none ${invoiceInfo.tinhTrang === 'Chưa thanh toán' ? 'bg-slate-100 text-slate-500' : 'focus:border-blue-500 focus:ring-blue-500'}`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số tiền đã thanh toán</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={new Intl.NumberFormat('vi-VN').format(invoiceInfo.daTt)} 
                    onChange={e => {
                      const val = parseInt(e.target.value.replace(/\./g, '')) || 0;
                      setInvoiceInfo({...invoiceInfo, daTt: val});
                    }} 
                    disabled={invoiceInfo.tinhTrang === 'Chưa thanh toán'} 
                    className={`block w-full rounded-md border-slate-300 shadow-sm sm:text-sm border px-3 py-2 outline-none ${invoiceInfo.tinhTrang === 'Chưa thanh toán' ? 'bg-slate-100 text-slate-500' : 'focus:border-blue-500 focus:ring-blue-500'}`} 
                  />
                  <span className="absolute right-3 top-2 text-slate-500 text-sm">đ</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phương thức thanh toán</label>
                <select value={invoiceInfo.phuongThucTt} onChange={e => setInvoiceInfo({...invoiceInfo, phuongThucTt: e.target.value})} disabled={invoiceInfo.tinhTrang === 'Chưa thanh toán'} className={`block w-full rounded-md border-slate-300 shadow-sm sm:text-sm border px-3 py-2 outline-none ${invoiceInfo.tinhTrang === 'Chưa thanh toán' ? 'bg-slate-100 text-slate-500' : 'focus:border-blue-500 focus:ring-blue-500'}`}>
                  <option>Tiền mặt</option>
                  <option>Chuyển khoản</option>
                  <option>Trả góp</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày thanh toán</label>
                <input type="date" value={invoiceInfo.ngayThanhToan} onChange={e => setInvoiceInfo({...invoiceInfo, ngayThanhToan: e.target.value})} disabled={invoiceInfo.tinhTrang === 'Chưa thanh toán'} className={`block w-full rounded-md border-slate-300 shadow-sm sm:text-sm border px-3 py-2 outline-none ${invoiceInfo.tinhTrang === 'Chưa thanh toán' ? 'bg-slate-100 text-slate-500' : 'focus:border-blue-500 focus:ring-blue-500'}`} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Người lập hóa đơn</label>
                <select 
                  value={invoiceInfo.nguoiLapHoaDon} 
                  onChange={e => setInvoiceInfo({...invoiceInfo, nguoiLapHoaDon: e.target.value})} 
                  disabled={invoiceInfo.tinhTrang === 'Chưa thanh toán'} 
                  className={`block w-full rounded-md border-slate-300 shadow-sm sm:text-sm border px-3 py-2 outline-none ${invoiceInfo.tinhTrang === 'Chưa thanh toán' ? 'bg-slate-100 text-slate-500' : 'focus:border-blue-500 focus:ring-blue-500'}`}
                >
                  <option value="">-- Chọn người lập hóa đơn --</option>
                  {staffs.map((s: any) => (
                    <option key={s.maNv} value={s.maNv}>{s.tenNv} ({s.maNv})</option>
                  ))}
                </select>
              </div>
            </div>
            
            {invoiceInfo.tinhTrang === 'Chưa thanh toán' && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md text-sm">
                <strong>Lưu ý:</strong> Vì tình trạng là "Chưa thanh toán", hóa đơn này sẽ <strong>không được lưu</strong> vào cơ sở dữ liệu. Hợp đồng và Hội viên vẫn được lưu nhưng trạng thái hợp đồng sẽ chuyển sang <strong>"Locked"</strong>.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-4 bg-slate-50 border-t border-slate-200 text-right sm:px-6 flex justify-between items-center">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentStep === 0}
          className="inline-flex justify-center py-2 px-4 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        >
          Quay lại
        </button>
        {currentStep < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={nextStep}
            className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Tiếp tục
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (validateStep3()) {
                handleRegister();
              }
            }}
            className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
          >
            Đăng ký
          </button>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl text-center animate-in zoom-in duration-200">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-6">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Đăng ký thành công!</h2>
            <p className="text-slate-600 mb-8">{successDetails}</p>
            <button
              onClick={handleCloseSuccessModal}
              className="w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Đăng ký hội viên mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
