import React, { useState, useEffect } from 'react';
import { Calendar, Building, AlertCircle, Clock } from 'lucide-react';

export default function ReceptionistDashboard({ user }: { user?: any }) {
  const [stats, setStats] = useState<any>({
    facilities: { total: 0, broken: 0, maintenance: 0, active: 0 },
  });
  const [expiringMembers, setExpiringMembers] = useState<any[]>([]);
  const [todaySchedules, setTodaySchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          membersRes, contractsRes, trainersRes, facilitiesRes, schedulesRes
        ] = await Promise.all([
          fetch('http://localhost:5079/api/members'),
          fetch('http://localhost:5079/api/hopdongs'),
          fetch('http://localhost:5079/api/huanluyenviens'),
          fetch('http://localhost:5079/api/cosovatchats'),
          fetch('http://localhost:5079/api/lichtaps')
        ]);

        const members = membersRes.ok ? await membersRes.json() : [];
        const contracts = contractsRes.ok ? await contractsRes.json() : [];
        const trainers = trainersRes.ok ? await trainersRes.json() : [];
        const facilities = facilitiesRes.ok ? await facilitiesRes.json() : [];
        const schedules = schedulesRes.ok ? await schedulesRes.json() : [];

        // Facilities
        let brokenFac = 0, maintFac = 0, activeFac = 0;
        facilities.forEach((f: any) => {
          const status = f.tinhTrangCsvc || f.TinhTrangCsvc || f.TinhTrangCSVC;
          if (status === 'Hỏng') brokenFac++;
          else if (status === 'Đang bảo trì') maintFac++;
          else if (status === 'Hoạt động') activeFac++;
        });

        // Today Schedules
        const now = new Date();
        const vnNow = new Date(now.getTime() + (7 * 60 * 60 * 1000));
        const today = vnNow.toISOString().split('T')[0];
        const currentMinutes = vnNow.getHours() * 60 + vnNow.getMinutes();
        
        const validSchedules: any[] = [];
        schedules.forEach((s: any) => {
          const ngayTap = s.ngayTap || s.NgayTap;
          if (ngayTap && ngayTap.split('T')[0] === today) {
            const khungGio = s.khungGioTap || s.KhungGioTap || s.gioTap || s.GioTap || '';
            let isValid = false;
            if (khungGio) {
              const endTimeStr = khungGio.split('-')[1]?.trim();
              if (endTimeStr) {
                const [time, period] = endTimeStr.split(' ');
                let [hours, minutes] = time.split(':').map(Number);
                
                if (period === 'PM' || period === 'CH') {
                  if (hours < 12) hours += 12;
                } else if (period === 'AM' || period === 'SA') {
                  if (hours === 12) hours = 0;
                }
                
                const endMinutes = hours * 60 + minutes;
                if (endMinutes > currentMinutes) {
                  isValid = true;
                }
              } else {
                isValid = true;
              }
            } else {
              isValid = true;
            }

            if (isValid) {
              // Find member and trainer names
              const member = members.find((m: any) => (m.maHv || m.MaHv || m.MaHV) === (s.maHv || s.MaHv || s.MaHV));
              const trainer = trainers.find((t: any) => (t.maHlv || t.MaHlv || t.MaHLV) === (s.maHlv || s.MaHlv || s.MaHLV));
              
              const isConfirmed = s.xacNhan || s.XacNhan || false;

              validSchedules.push({
                ...s,
                memberName: member ? `${member.ho} ${member.ten}` : s.maHv,
                trainerName: trainer ? `${trainer.hoHlv} ${trainer.nameofHlv}` : s.maHlv,
                khungGioTap: khungGio,
                isConfirmed: isConfirmed
              });
            }
          }
        });

        // Expiring / Expired Members
        const todayDate = new Date(vnNow);
        todayDate.setHours(0, 0, 0, 0);
        const nextWeekDate = new Date(todayDate);
        nextWeekDate.setDate(todayDate.getDate() + 7);

        const expiringList: any[] = [];
        
        contracts.forEach((c: any) => {
          const status = c.trangThaiHd || c.TrangThaiHd || c.TrangThaiHD;
          const endDateStr = c.ngayKt || c.NgayKt || c.NgayKT;
          
          let isExpiring = false;
          let isExpired = false;

          if (status === 'Expired') {
            isExpired = true;
          } else if (endDateStr) {
            const endDate = new Date(endDateStr);
            endDate.setHours(0, 0, 0, 0);
            
            if (endDate < todayDate) {
              isExpired = true;
            } else if (endDate >= todayDate && endDate <= nextWeekDate) {
              isExpiring = true;
            }
          }

          if (isExpiring || isExpired) {
            const member = members.find((m: any) => (m.maHv || m.MaHv || m.MaHV) === (c.maHv || c.MaHv || c.MaHV));
            if (member) {
              // Avoid duplicates
              if (!expiringList.find(item => item.maHv === member.maHv)) {
                expiringList.push({
                  ...member,
                  contractEndDate: endDateStr,
                  contractStatus: status,
                  isExpired
                });
              }
            }
          }
        });

        setStats({
          facilities: { total: facilities.length, broken: brokenFac, maintenance: maintFac, active: activeFac }
        });
        setTodaySchedules(validSchedules.sort((a, b) => a.khungGioTap.localeCompare(b.khungGioTap)));
        setExpiringMembers(expiringList.sort((a, b) => {
          if (a.isExpired && !b.isExpired) return -1;
          if (!a.isExpired && b.isExpired) return 1;
          return new Date(a.contractEndDate).getTime() - new Date(b.contractEndDate).getTime();
        }));

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Schedules & Facilities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Schedules Today */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="text-blue-500" size={20} />
                <h3 className="text-lg font-bold text-slate-800">Lịch Tập Hôm Nay</h3>
              </div>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                {todaySchedules.length} lịch
              </span>
            </div>
            <div className="p-0">
              {todaySchedules.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {todaySchedules.map((schedule, idx) => (
                    <li key={idx} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center w-16 h-16 bg-blue-50 rounded-lg text-blue-700">
                          <Clock size={20} className="mb-1" />
                          <span className="text-xs font-bold">{schedule.khungGioTap.split('-')[0].trim()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{schedule.memberName}</p>
                          <p className="text-sm text-slate-500">HLV: {schedule.trainerName}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="text-sm font-medium text-slate-700">{schedule.khungGioTap}</span>
                        {schedule.isConfirmed ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">Đã xác nhận</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded uppercase">Chờ tập</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  Không còn lịch tập nào trong ngày hôm nay.
                </div>
              )}
            </div>
          </div>

          {/* Facilities */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Building className="text-cyan-500" size={20} />
              <h3 className="text-lg font-bold text-slate-800">Tổng Quan Cơ Sở Vật Chất</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-sm text-slate-500 mb-1">Tổng số</p>
                <p className="text-2xl font-bold text-slate-800">{stats.facilities.total}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <p className="text-sm text-green-600 mb-1">Hoạt động</p>
                <p className="text-2xl font-bold text-green-700">{stats.facilities.active}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                <p className="text-sm text-yellow-600 mb-1">Đang bảo trì</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.facilities.maintenance}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <p className="text-sm text-red-600 mb-1">Hỏng</p>
                <p className="text-2xl font-bold text-red-700">{stats.facilities.broken}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Expiring Members */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2 bg-red-50/50">
              <AlertCircle className="text-red-500" size={20} />
              <h3 className="text-lg font-bold text-slate-800">Hội Viên Gần/Đã Đáo Hạn</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-0 max-h-[600px]">
              {expiringMembers.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {expiringMembers.map((member, idx) => (
                    <li key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-slate-900">{member.ho} {member.ten}</p>
                        {member.isExpired ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-md">Đã hết hạn</span>
                        ) : (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-md">Sắp hết hạn</span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500 space-y-1">
                        <p>SĐT: {member.sdt}</p>
                        <p>Ngày hết hạn: {member.contractEndDate ? new Date(member.contractEndDate).toLocaleDateString('vi-VN') : 'N/A'}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  Không có hội viên nào sắp hoặc đã hết hạn hợp đồng.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
