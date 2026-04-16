import React from 'react';
import { 
  Users, Dumbbell, UserCheck, Calendar, Briefcase, 
  Building, FileText, Receipt, BarChart3, LogOut, 
  Search, Plus, Download, History, Home, Menu, X
} from 'lucide-react';
import { User, NavItem } from '../types';

const NAV_ITEMS: NavItem[] = [
  // Common / Dashboards
  { id: 'dashboard-admin', label: 'Dashboard', icon: Home, roles: ['admin'] },
  { id: 'dashboard-receptionist', label: 'Dashboard', icon: Home, roles: ['receptionist'] },
  { id: 'dashboard-manager', label: 'Dashboard', icon: Home, roles: ['manager'] },
  
  // Admin
  { id: 'admin-members', label: 'Quản lý hội viên', icon: Users, roles: ['admin'] },
  { id: 'admin-packages', label: 'Quản lý gói tập', icon: Dumbbell, roles: ['admin'] },
  { id: 'admin-trainers', label: 'Quản lý HLV', icon: UserCheck, roles: ['admin'] },
  { id: 'admin-schedule', label: 'Quản lý lịch tập', icon: Calendar, roles: ['admin', 'receptionist'] },
  { id: 'admin-staff', label: 'Quản lý nhân viên', icon: Briefcase, roles: ['admin'] },
  { id: 'admin-facilities', label: 'Quản lý CSVC', icon: Building, roles: ['admin', 'receptionist'] },
  { id: 'admin-contracts', label: 'Quản lý hợp đồng', icon: FileText, roles: ['admin', 'receptionist'] },
  { id: 'admin-invoices', label: 'Quản lý hoá đơn', icon: Receipt, roles: ['admin'] },
  { 
    id: 'admin-reports', 
    label: 'Báo cáo thống kê', 
    icon: BarChart3, 
    roles: ['admin', 'manager'],
    subItems: [
      { id: 'admin-reports-main', label: 'Tổng quan' },
      { id: 'admin-reports-revenue-package', label: 'Doanh thu theo gói tập' },
      { id: 'admin-reports-trainer-performance', label: 'Hiệu suất HLV' },
      { id: 'admin-reports-revenue-month', label: 'Doanh thu theo tháng/năm' }
    ]
  },
  { 
    id: 'admin-export', 
    label: 'Xuất báo cáo', 
    icon: Download, 
    roles: ['admin', 'manager'],
    subItems: [
      { id: 'mgr-export', label: 'Xuất báo cáo' },
      { id: 'admin-reports-history', label: 'Lịch sử xuất báo cáo' }
    ]
  },

  // Receptionist specific
  { id: 'rec-search', label: 'Tìm kiếm hội viên', icon: Search, roles: ['receptionist'] },
  { id: 'rec-register', label: 'Đăng ký gói tập', icon: Plus, roles: ['receptionist'] },
];

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  currentView: string;
  setCurrentView: (view: string) => void;
}

export default function Layout({ user, onLogout, children, currentView, setCurrentView }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const allowedNavItems = NAV_ITEMS.filter(item => item.roles.includes(user.role));

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-slate-900/50 transition-opacity md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 bg-slate-950">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xl">
            <Dumbbell size={24} />
            <span>GymMaster</span>
          </div>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-4rem)] py-4">
          <div className="px-4 mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Menu chính
            </p>
          </div>
          <nav className="px-2 space-y-1">
            {allowedNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id || (item.subItems && item.subItems.some(sub => sub.id === currentView));
              
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => {
                      if (item.subItems) {
                        // If it has subItems, clicking it could toggle expansion or just go to the first subItem/main item
                        // We'll just go to the main item or first sub item
                        setCurrentView(item.subItems[0].id);
                      } else {
                        setCurrentView(item.id);
                      }
                      if (!item.subItems) setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm font-medium
                      ${isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} />
                      {item.label}
                    </div>
                  </button>
                  
                  {/* Render subItems if this item is active */}
                  {item.subItems && isActive && (
                    <div className="pl-10 pr-2 py-1 space-y-1">
                      {item.subItems.map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setCurrentView(sub.id);
                            setSidebarOpen(false);
                          }}
                          className={`
                            w-full text-left px-3 py-2 rounded-md transition-colors text-sm
                            ${currentView === sub.id 
                              ? 'bg-slate-800 text-white font-medium' 
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}
                          `}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10">
          <div className="flex items-center">
            <button 
              className="md:hidden mr-4 text-slate-500 hover:text-slate-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-slate-800 hidden sm:block">
              {allowedNavItems.find(i => i.id === currentView)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900">{user.fullName}</p>
              <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {user.fullName.charAt(0)}
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
              title="Đăng xuất"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
