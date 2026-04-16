import React, { useState, useEffect } from 'react';
import { Dumbbell, AlertCircle } from 'lucide-react';
import { Role, User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('admin');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'error' | 'success'>('error');
  const [isLoading, setIsLoading] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await fetch('http://localhost:5079/api/nhanviens');
        if (response.ok) {
          const data = await response.json();
          setStaffList(data);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách nhân viên:', error);
      }
    };
    fetchStaff();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMessage('');
    setIsLoading(true);

    setTimeout(() => {
      // Virtual account bypass
      if (username.trim() === 'niennb' && password === '0969657797Nin') {
        setAlertType('success');
        setAlertMessage('Đăng nhập thành công với tài khoản ảo!');
        setTimeout(() => {
          onLogin({ username: 'niennb', role, fullName: 'Tài khoản ảo (niennb)', maNv: 'VIRTUAL_ADMIN' });
        }, 1000);
        return;
      }

      // Map role to chucVu
      let expectedChucVu = '';
      if (role === 'admin') expectedChucVu = 'Admin';
      else if (role === 'receptionist') expectedChucVu = 'Lễ tân';
      else if (role === 'manager') expectedChucVu = 'Quản lý';

      const user = staffList.find(s => String(s.maNv || s.MaNv).trim().toLowerCase() === username.trim().toLowerCase());

      if (!user) {
        setAlertType('error');
        setAlertMessage('Tài khoản không tồn tại hoặc không phải là Mã Nhân viên.');
        setIsLoading(false);
        return;
      }

      const userChucVu = String(user.chucvu || user.Chucvu).trim();
      if (userChucVu !== expectedChucVu) {
        setAlertType('error');
        setAlertMessage('Tên tài khoản và vai trò không khớp.');
        setIsLoading(false);
        return;
      }

      const userStatus = String(user.trangThaidilam || user.TrangThaidilam || 'Đi làm').trim();
      if (userStatus === 'Nghỉ việc' || userStatus === 'Nghỉ phép') {
        setAlertType('error');
        setAlertMessage('Tài khoản này hiện không thể đăng nhập do đang trong trạng thái Nghỉ việc hoặc Nghỉ phép.');
        setIsLoading(false);
        return;
      }

      const userMatKhau = String(user.matkhau || user.Matkhau).trim();
      if (userMatKhau !== password.trim()) {
        setAlertType('error');
        setAlertMessage('Sai mật khẩu.');
        setIsLoading(false);
        return;
      }

      // Success
      setAlertType('success');
      setAlertMessage('Đăng nhập thành công!');
      
      setTimeout(() => {
        const fullName = `${user.hoNv || user.HoNv || ''} ${user.tenNv || user.TenNv || ''}`.trim();
        onLogin({ username, role, fullName, maNv: user.maNv || user.MaNv });
      }, 1000);
    }, 500); // Simulate slight delay for UX
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-blue-600">
          <Dumbbell size={48} />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          GymMaster Pro
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Hệ thống quản lý phòng Gym toàn diện
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-100">
          
          {alertMessage && (
            <div className={`mb-4 p-4 rounded-md flex items-start ${alertType === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
              <AlertCircle className={`h-5 w-5 mr-2 ${alertType === 'error' ? 'text-red-400' : 'text-green-400'} flex-shrink-0 mt-0.5`} />
              <p className="text-sm font-medium">{alertMessage}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Vai trò / Chức vụ
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
              >
                <option value="admin">Admin (Quản trị)</option>
                <option value="receptionist">Lễ tân</option>
                <option value="manager">Quản lý</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Tên tài khoản (Mã Nhân viên)
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="VD: LT2501"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Mật khẩu
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Nhập mật khẩu"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
              >
                {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
