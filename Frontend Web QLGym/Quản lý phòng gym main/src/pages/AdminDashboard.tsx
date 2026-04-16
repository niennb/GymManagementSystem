import React, { useState, useEffect } from 'react';
import { Users, Dumbbell, Receipt, Calendar, Briefcase, Building, FileText, AlertCircle } from 'lucide-react';

export default function AdminDashboard({ user }: { user?: any }) {
  const [stats, setStats] = useState<any>({
    totalMembers: 0,
    totalPackages: 0,
    contracts: { total: 0, locked: 0, active: 0, expired: 0 },
    totalTrainers: 0,
    facilities: { total: 0, broken: 0, maintenance: 0, active: 0 },
    schedulesToday: 0,
    totalStaff: 0,
    invoices: { total: 0, debt: 0 }
  });
  const [expiredMembers, setExpiredMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          membersRes, packagesRes, contractsRes, trainersRes, 
          facilitiesRes, schedulesRes, staffRes, invoicesRes
        ] = await Promise.all([
          fetch('http://localhost:5079/api/members'),
          fetch('http://localhost:5079/api/goitaps'),
          fetch('http://localhost:5079/api/hopdongs'),
          fetch('http://localhost:5079/api/huanluyenviens'),
          fetch('http://localhost:5079/api/cosovatchats'),
          fetch('http://localhost:5079/api/lichtaps'),
          fetch('http://localhost:5079/api/nhanviens'),
          fetch('http://localhost:5079/api/hoadons')
        ]);

        const members = membersRes.ok ? await membersRes.json() : [];
        const packages = packagesRes.ok ? await packagesRes.json() : [];
        const contracts = contractsRes.ok ? await contractsRes.json() : [];
        const trainers = trainersRes.ok ? await trainersRes.json() : [];
        const facilities = facilitiesRes.ok ? await facilitiesRes.json() : [];
        const schedules = schedulesRes.ok ? await schedulesRes.json() : [];
        const staff = staffRes.ok ? await staffRes.json() : [];
        const invoices = invoicesRes.ok ? await invoicesRes.json() : [];

        // Calculate Contracts
        let lockedContracts = 0, activeContracts = 0, expiredContracts = 0;
        contracts.forEach((c: any) => {
          const status = c.trangThaiHd || c.TrangThaiHd || c.TrangThaiHD;
          if (status === 'Locked') lockedContracts++;
          else if (status === 'Active') activeContracts++;
          else if (status === 'Expired') expiredContracts++;
        });

        // Calculate Facilities
        let brokenFac = 0, maintFac = 0, activeFac = 0;
        facilities.forEach((f: any) => {
          const status = f.tinhTrangCsvc || f.TinhTrangCsvc || f.TinhTrangCSVC;
          if (status === 'Hỏng') brokenFac++;
          else if (status === 'Đang bảo trì') maintFac++;
          else if (status === 'Hoạt động') activeFac++;
        });

        // Calculate Schedules Today (auto decrement if time passed)
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        let validSchedulesToday = 0;
        schedules.forEach((s: any) => {
          const ngayTap = s.ngayTap || s.NgayTap;
          if (ngayTap && ngayTap.split('T')[0] === today) {
            const khungGio = s.khungGioTap || s.KhungGioTap || s.gioTap || s.GioTap || '';
            if (khungGio) {
              const endTimeStr = khungGio.split('-')[1]?.trim();
              if (endTimeStr) {
                const [hours, minutes] = endTimeStr.split(':').map(Number);
                const endMinutes = hours * 60 + minutes;
                if (endMinutes > currentMinutes) {
                  validSchedulesToday++;
                }
              } else {
                validSchedulesToday++; // Fallback if format is weird
              }
            } else {
              validSchedulesToday++;
            }
          }
        });

        // Calculate Invoices
        let debtInvoices = 0;
        invoices.forEach((i: any) => {
          const conNo = i.conNo || i.ConNo || 0;
          if (conNo > 0) debtInvoices++;
        });

        // Expired Members
        const expiredMems = members.filter((m: any) => {
          const status = m.trangthai || m.Trangthai || m.TrangThai;
          return status === 'Expired';
        });

        setStats({
          totalMembers: members.length,
          totalPackages: packages.length,
          contracts: { total: contracts.length, locked: lockedContracts, active: activeContracts, expired: expiredContracts },
          totalTrainers: trainers.length,
          facilities: { total: facilities.length, broken: brokenFac, maintenance: maintFac, active: activeFac },
          schedulesToday: validSchedulesToday,
          totalStaff: staff.length,
          invoices: { total: invoices.length, debt: debtInvoices }
        });
        setExpiredMembers(expiredMems);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Auto refresh schedules every minute to update the "passed time" logic
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const getRoleName = (role: string) => {
    switch(role) {
      case 'admin': return 'Quản trị viên (Admin)';
      case 'manager': return 'Quản lý (Manager)';
      case 'receptionist': return 'Lễ tân (Receptionist)';
      default: return role;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Chào mừng, {user?.fullName || 'Người dùng'}!
          </h2>
          <p className="text-slate-500 mt-1">
            Chức vụ: <span className="font-medium text-blue-600">{getRoleName(user?.role || '')}</span>
          </p>
        </div>
        <div className="hidden md:block">
          <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Members */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">Tổng Hội Viên</h3>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Users size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.totalMembers}</p>
        </div>

        {/* Packages */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">Tổng Gói Tập</h3>
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Dumbbell size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.totalPackages}</p>
        </div>

        {/* Trainers */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">Huấn Luyện Viên</h3>
            <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><Users size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.totalTrainers}</p>
        </div>

        {/* Staff */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">Tổng Nhân Viên</h3>
            <div className="p-2 bg-teal-50 rounded-lg text-teal-600"><Briefcase size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.totalStaff}</p>
        </div>

        {/* Contracts */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">Tổng Hợp Đồng</h3>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><FileText size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-slate-800 mb-2">{stats.contracts.total}</p>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md">Active: {stats.contracts.active}</span>
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md">Expired: {stats.contracts.expired}</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md">Locked: {stats.contracts.locked}</span>
          </div>
        </div>

        {/* Facilities */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">Cơ Sở Vật Chất</h3>
            <div className="p-2 bg-cyan-50 rounded-lg text-cyan-600"><Building size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-slate-800 mb-2">{stats.facilities.total}</p>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md">H.Động: {stats.facilities.active}</span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md">B.Trì: {stats.facilities.maintenance}</span>
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md">Hỏng: {stats.facilities.broken}</span>
          </div>
        </div>

        {/* Invoices */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">Tổng Hoá Đơn</h3>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><Receipt size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-slate-800 mb-2">{stats.invoices.total}</p>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-md font-medium">Còn nợ: {stats.invoices.debt}</span>
          </div>
        </div>

        {/* Schedules Today */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">Lịch Tập (Hôm Nay)</h3>
            <div className="p-2 bg-pink-50 rounded-lg text-pink-600"><Calendar size={20} /></div>
          </div>
          <p className="text-3xl font-bold text-slate-800 mb-2">{stats.schedulesToday}</p>
          <p className="text-xs text-slate-500">Số lịch chưa diễn ra hoặc đang diễn ra</p>
        </div>
      </div>

      {/* Expired Members Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <AlertCircle className="text-red-500" size={20} />
          <h3 className="text-lg font-bold text-slate-800">Hội Viên Đã Hết Hạn Hợp Đồng</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Mã HV</th>
                <th className="px-6 py-4 font-medium">Họ và Tên</th>
                <th className="px-6 py-4 font-medium">Số điện thoại</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {expiredMembers.length > 0 ? (
                expiredMembers.map((member: any) => (
                  <tr key={member.maHv} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{member.maHv || member.MaHv || member.MaHV}</td>
                    <td className="px-6 py-4 text-slate-700">{member.ho} {member.ten}</td>
                    <td className="px-6 py-4 text-slate-700">{member.sdt}</td>
                    <td className="px-6 py-4 text-slate-700">{member.email || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Expired
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Không có hội viên nào đang hết hạn hợp đồng.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
