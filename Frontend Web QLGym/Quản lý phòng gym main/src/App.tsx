import React, { useState } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import AdminDashboard from './pages/AdminDashboard';
import MemberManagement from './pages/MemberManagement';
import PackageManagement from './pages/PackageManagement';
import PackageRegistration from './pages/PackageRegistration';
import TrainerManagement from './pages/TrainerManagement';
import StaffManagement from './pages/StaffManagement';
import FacilityManagement from './pages/FacilityManagement';
import ContractManagement from './pages/ContractManagement';
import InvoiceManagement from './pages/InvoiceManagement';
import ScheduleManagement from './pages/ScheduleManagement';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import MemberSearch from './pages/MemberSearch';

// Report Pages
import ReportDashboard from './pages/reports/ReportDashboard';
import ReportRevenuePackage from './pages/reports/ReportRevenuePackage';
import ReportTrainerPerformance from './pages/reports/ReportTrainerPerformance';
import ReportRevenueMonth from './pages/reports/ReportRevenueMonth';
import ReportHistory from './pages/reports/ReportHistory';
import ExportReport from './pages/ExportReport';

import { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('');

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    // Set default view based on role
    if (loggedInUser.role === 'admin') setCurrentView('dashboard-admin');
    else if (loggedInUser.role === 'receptionist') setCurrentView('dashboard-receptionist');
    else if (loggedInUser.role === 'manager') setCurrentView('dashboard-manager');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'admin-members':
        return <MemberManagement />;
      case 'admin-packages':
        return <PackageManagement />;
      case 'admin-trainers':
        return <TrainerManagement />;
      case 'admin-staff':
        return <StaffManagement />;
      case 'admin-facilities':
        return <FacilityManagement user={user} />;
      case 'admin-contracts':
        return <ContractManagement user={user} />;
      case 'admin-invoices':
        return <InvoiceManagement />;
      case 'admin-schedule':
        return <ScheduleManagement />;
      case 'dashboard-admin':
      case 'dashboard-manager':
        return <AdminDashboard user={user} />;
      case 'dashboard-receptionist':
        return <ReceptionistDashboard user={user} />;
      case 'rec-search':
        return <MemberSearch />;
      case 'rec-register':
        return <PackageRegistration />;
      
      // Reports
      case 'admin-reports-main':
        return <ReportDashboard />;
      case 'admin-reports-revenue-package':
        return <ReportRevenuePackage />;
      case 'admin-reports-trainer-performance':
        return <ReportTrainerPerformance />;
      case 'admin-reports-revenue-month':
        return <ReportRevenueMonth />;
      case 'admin-reports-history':
        return <ReportHistory />;
      case 'mgr-export':
        return <ExportReport user={user} />;
        
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <p className="text-lg">Giao diện <b>{currentView}</b> đang được xây dựng.</p>
            <p className="text-sm mt-2">Vui lòng chọn "Quản lý hội viên" hoặc "Đăng ký gói tập" để xem demo.</p>
          </div>
        );
    }
  };

  return (
    <Layout user={user} onLogout={handleLogout} currentView={currentView} setCurrentView={setCurrentView}>
      {renderContent()}
    </Layout>
  );
}
