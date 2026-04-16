import React, { useState, useEffect } from 'react';
import { Search, User, Phone, Calendar, FileText, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';

export default function MemberSearch() {
  const [searchPhone, setSearchPhone] = useState('');
  const [searchName, setSearchName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Data
  const [members, setMembers] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [isConfirming, setIsConfirming] = useState<string | null>(null);

  const fetchInitialData = async () => {
    try {
      const [membersRes, contractsRes, schedulesRes, trainersRes] = await Promise.all([
        fetch('http://localhost:5079/api/members'),
        fetch('http://localhost:5079/api/hopdongs'),
        fetch('http://localhost:5079/api/lichtaps'),
        fetch('http://localhost:5079/api/huanluyenviens')
      ]);
      
      if (membersRes.ok) setMembers(await membersRes.json());
      if (contractsRes.ok) setContracts(await contractsRes.json());
      if (schedulesRes.ok) setSchedules(await schedulesRes.json());
      if (trainersRes.ok) setTrainers(await trainersRes.json());
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleConfirmSchedule = async (schedule: any) => {
    const maLich = schedule.maLich || schedule.MaLich;
    setIsConfirming(maLich);
    
    try {
      const payload = {
        ...schedule,
        XacNhan: true,
        xacNhan: true,
        TrangThai: 'Tập',
        trangThai: 'Tập'
      };
      
      const response = await fetch(`http://localhost:5079/api/lichtaps/${maLich}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        await fetchInitialData();
        // Update search result
        if (searchResult) {
          const updatedSchedules = searchResult.schedules.map((s: any) => {
            if ((s.maLich || s.MaLich) === maLich) {
              return { ...s, xacNhan: true, XacNhan: true, trangThai: 'Tập', TrangThai: 'Tập' };
            }
            return s;
          });
          setSearchResult({ ...searchResult, schedules: updatedSchedules });
        }
      }
    } catch (error) {
      console.error("Lỗi khi xác nhận lịch tập:", error);
    } finally {
      setIsConfirming(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPhone.trim() && !searchName.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    setTimeout(() => {
      let foundMember = null;
      
      // Find member
      for (const m of members) {
        const fullName = `${m.ho || ''} ${m.ten || ''}`.toLowerCase();
        const phone = m.sdt || '';
        
        const matchPhone = searchPhone ? phone.includes(searchPhone) : true;
        const matchName = searchName ? fullName.includes(searchName.toLowerCase()) : true;
        
        if (matchPhone && matchName) {
          foundMember = m;
          break;
        }
      }

      if (foundMember) {
        const maHv = foundMember.maHv || foundMember.MaHv || foundMember.MaHV;
        
        // Find contracts
        const memberContracts = contracts.filter(c => (c.maHv || c.MaHv || c.MaHV) === maHv);
        
        // Find schedules
        const memberSchedules = schedules.filter(s => (s.maHv || s.MaHv || s.MaHV) === maHv).map(s => {
          const trainer = trainers.find(t => (t.maHlv || t.MaHlv || t.MaHLV) === (s.maHlv || s.MaHlv || s.MaHLV));
          return {
            ...s,
            trainerName: trainer ? `${trainer.hoHlv} ${trainer.nameofHlv}` : s.maHlv
          };
        });

        // Determine overall status
        // If any contract is Active, allow entry. Otherwise, deny.
        const hasActiveContract = memberContracts.some(c => {
          const status = c.trangThaiHd || c.TrangThaiHd || c.TrangThaiHD;
          return status === 'Active';
        });

        setSearchResult({
          ...foundMember,
          contracts: memberContracts,
          schedules: memberSchedules,
          canEnter: hasActiveContract
        });
      } else {
        setSearchResult(null);
      }
      
      setIsSearching(false);
    }, 500); // Simulate network delay
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Search className="text-blue-600" />
          Tìm Kiếm & Xác Thực Hội Viên
        </h2>

        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Nhập SĐT..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Nhập họ tên..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={isSearching || (!searchPhone && !searchName)}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? 'Đang tìm...' : 'Tìm kiếm'}
            </button>
          </div>
        </form>
      </div>

      {hasSearched && !isSearching && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {searchResult ? (
            <div>
              {/* Status Banner */}
              <div className={`p-6 flex items-center justify-center gap-3 text-xl font-bold text-white ${searchResult.canEnter ? 'bg-green-600' : 'bg-red-600'}`}>
                {searchResult.canEnter ? (
                  <>
                    <CheckCircle size={28} />
                    HỢP LỆ - CHO VÀO TẬP
                  </>
                ) : (
                  <>
                    <XCircle size={28} />
                    KHÔNG HỢP LỆ - KHÔNG CHO VÀO PHÒNG TẬP
                  </>
                )}
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Member Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                    <User className="text-slate-500" size={20} />
                    Thông tin cá nhân
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mã HV:</span>
                      <span className="font-medium text-slate-900">{searchResult.maHv || searchResult.MaHv || searchResult.MaHV}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Họ và tên:</span>
                      <span className="font-medium text-slate-900">{searchResult.ho} {searchResult.ten}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Số điện thoại:</span>
                      <span className="font-medium text-slate-900">{searchResult.sdt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-medium text-slate-900">{searchResult.email || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Giới tính:</span>
                      <span className="font-medium text-slate-900">{searchResult.gioitinh === 'Nam' ? 'Nam' : searchResult.gioitinh === 'Nu' ? 'Nữ' : 'Khác'}</span>
                    </div>
                  </div>
                </div>

                {/* Contracts */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                    <FileText className="text-slate-500" size={20} />
                    Thông tin hợp đồng
                  </h3>
                  {searchResult.contracts.length > 0 ? (
                    <div className="space-y-3">
                      {searchResult.contracts.map((c: any, idx: number) => {
                        const status = c.trangThaiHd || c.TrangThaiHd || c.TrangThaiHD;
                        return (
                          <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-slate-800">{c.maHd || c.MaHd || c.MaHD}</span>
                              <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                status === 'Active' ? 'bg-green-100 text-green-700' :
                                status === 'Expired' ? 'bg-red-100 text-red-700' :
                                'bg-gray-200 text-gray-700'
                              }`}>
                                {status}
                              </span>
                            </div>
                            <div className="text-slate-600 space-y-1">
                              <p>Mã gói: {c.maGoiTap || c.MaGoiTap}</p>
                              <p>Từ: {c.ngayBd ? new Date(c.ngayBd).toLocaleDateString('vi-VN') : '-'}</p>
                              <p>Đến: {c.ngayKt ? new Date(c.ngayKt).toLocaleDateString('vi-VN') : '-'}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">Không có hợp đồng nào.</p>
                  )}
                </div>

                {/* Schedules */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                    <Calendar className="text-slate-500" size={20} />
                    Lịch tập sắp tới
                  </h3>
                  {searchResult.schedules.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                      {searchResult.schedules
                        .filter((s: any) => {
                          const now = new Date();
                          const vnNow = new Date(now.getTime() + (7 * 60 * 60 * 1000));
                          const todayStr = vnNow.toISOString().split('T')[0];
                          const scheduleDateStr = (s.ngayTap || '').split('T')[0];
                          return scheduleDateStr >= todayStr;
                        })
                        .sort((a: any, b: any) => new Date(a.ngayTap || a.NgayTap).getTime() - new Date(b.ngayTap || b.NgayTap).getTime())
                        .map((s: any, idx: number) => {
                          const now = new Date();
                          const vnNow = new Date(now.getTime() + (7 * 60 * 60 * 1000));
                          const scheduleDateStr = (s.ngayTap || '').split('T')[0];
                          const todayStr = vnNow.toISOString().split('T')[0];
                          const isToday = scheduleDateStr === todayStr;
                          const isConfirmed = s.xacNhan || s.XacNhan;
                          
                          return (
                            <div key={idx} className={`p-3 rounded-lg border text-sm ${isConfirmed ? 'bg-green-50 border-green-100' : 'bg-blue-50 border-blue-100'}`}>
                              <div className="flex justify-between items-start mb-1">
                                <div className={`font-bold ${isConfirmed ? 'text-green-800' : 'text-blue-800'}`}>
                                  {s.ngayTap ? new Date(s.ngayTap).toLocaleDateString('vi-VN') : '-'}
                                </div>
                                {isConfirmed && (
                                  <span className="bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded uppercase font-bold">Tập</span>
                                )}
                              </div>
                              <div className={`${isConfirmed ? 'text-green-900' : 'text-blue-900'} space-y-1`}>
                                <p className="flex items-center gap-1"><Clock size={14} /> {s.khungGioTap || s.KhungGioTap}</p>
                                <p className="flex items-center gap-1"><User size={14} /> HLV: {s.trainerName}</p>
                              </div>
                              
                              {isToday && searchResult.canEnter && (
                                isConfirmed ? (
                                  <div className="mt-3 w-full py-1.5 bg-slate-100 text-slate-500 rounded font-bold text-xs flex items-center justify-center gap-1 border border-slate-200 cursor-default">
                                    <CheckCircle size={14} />
                                    ĐÃ XÁC NHẬN ĐI TẬP
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleConfirmSchedule(s)}
                                    disabled={isConfirming === (s.maLich || s.MaLich)}
                                    className="mt-3 w-full py-1.5 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-xs transition-colors disabled:bg-slate-300 shadow-sm"
                                  >
                                    {isConfirming === (s.maLich || s.MaLich) ? 'Đang xác nhận...' : 'XÁC NHẬN ĐI TẬP'}
                                  </button>
                                )
                              )}
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">Không có lịch tập nào sắp tới.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <h3 className="text-lg font-medium text-slate-900">Không tìm thấy hội viên</h3>
              <p className="text-slate-500 mt-1">Vui lòng kiểm tra lại số điện thoại hoặc họ tên đã nhập.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
