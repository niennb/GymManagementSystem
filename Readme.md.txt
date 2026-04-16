# Hệ Thống Quản Lý Phòng Gym
Đồ án môn học Ngành Công nghệ thông tin - Sinh viên: Nguyễn Bảo Niên - Mã SV: 210100635

## Yêu cầu cài ban đầu

Để chạy được dự án này mà không gặp lỗi phiên bản, vui lòng đảm bảo máy tính được cài đặt:
1. **Visual Studio 2026** (hoặc IDE tương đương có hỗ trợ .NET 10).
2. **.NET 10.0 SDK**.
3. **Node.js phiên bản 22.0 trở lên** (Khuyến nghị sử dụng Node.js v24.x giống môi trường phát triển).
4. SQL Server / SQL Server Management Studio (SSMS).

## Hướng Dẫn Cài Đặt và Chạy Ứng Dụng

### Bước 1: Cài đặt Cơ sở dữ liệu (SQL Server)
1. Mở **SQL Server Management Studio**.
2. Mở file `Database/GymDB_Script.sql` trong dự án.
3. Bấm **Execute** (F5) để chạy script. Script sẽ tự động tạo database mới và thêm sẵn toàn bộ dữ liệu mẫu (nhân viên, hội viên, hóa đơn...).


### Bước 2: Cấu hình và chạy Backend (C# - Visual Studio)
1. Mở thư mục `Backend API QLGym`.
2. Mở file Solution (`.sln`) bằng **Visual Studio**.
3. Mở file `appsettings.json`, sửa lại `ConnectionStrings` cho phù hợp với tên `Server` hoặc `Data Source` trên máy tính của thầy (nếu cần).
   *Ví dụ:* `"DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=[Ten_DB];Trusted_Connection=True;TrustServerCertificate=True"`
4. Bấm **F5** (hoặc nút Play xanh lá) để chạy Backend. 
   *(API sẽ mặc định chạy ở cổng http://localhost:5079 - nếu cổng khác, vui lòng báo lại)*


### Bước 3: Chạy Frontend (React.js - VS Code)
1. Mở thư mục `Frontend Web QLGym` bằng **VS Code**.
2. Mở Terminal (Ctrl + `).
3. Chạy lệnh cài đặt thư viện:
   ```bash
   npm install
4. Chạy nền tảng giao diện 
   npm run dev	

## Credentials Thử Nghiệm
Hệ thống cung cấp một tài khoản đặc quyền để thầy có thể test nhanh mọi chức năng không cần phải tương tác Cổng Server hoặc DataBase thô.
- Tên Đăng Nhập: niennb
- Mật Khẩu: 0969657797Nin
- Phân Mức: Hệ thống này cấp quyền qua Dropdown UI ở màn hình Login, Thầy chọn Vai Vai Trò của Lễ Tân, Quản Lý hay Admin trước rồi điền 2 thông tin trên!
       Cảm ơn Thầy đã kiểm tra đồ án! Nếu gặp bất kỳ vấn đề gì, mong Thầy liên hệ với em!