using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GymAPI.Models; // Thay bằng namespace Models của bạn

namespace GymAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportsController : ControllerBase
    {
        private readonly QlPhonggymContext _context; // Thay bằng DbContext của bạn

        public ReportsController(QlPhonggymContext context)
        {
            _context = context;
        }

        // 1. Báo cáo doanh thu theo gói tập
        // 1. Báo cáo doanh thu theo gói tập
        [HttpGet("revenue-package")]
        public async Task<IActionResult> GetRevenueByPackage([FromQuery] int? month, [FromQuery] int? year)
        {
            var query = await _context.GoiTaps.Select(g => new
            {
                tenGoi = g.TenGoi,

                // Đếm số lượng hợp đồng đăng ký theo gói tập, có lọc theo tháng/năm
                soLuongDangKy = _context.HopDongs.Count(hd =>
                    hd.MaGoiTap == g.MaGoiTap &&
                    (!month.HasValue || (hd.NgayBd.HasValue && hd.NgayBd.Value.Month == month.Value)) &&
                    (!year.HasValue || (hd.NgayBd.HasValue && hd.NgayBd.Value.Year == year.Value))
                ),

                // Tính tổng doanh thu từ hoá đơn của gói tập đó, có lọc theo tháng/năm
                tongDoanhThu = _context.Hoadons.Where(h =>
                    h.MaHdNavigation.MaGoiTap == g.MaGoiTap &&
                    (!month.HasValue || (h.NgayThanhToan.HasValue && h.NgayThanhToan.Value.Month == month.Value)) &&
                    (!year.HasValue || (h.NgayThanhToan.HasValue && h.NgayThanhToan.Value.Year == year.Value))
                ).Sum(h => (decimal?)h.SoTien) ?? 0
            }).ToListAsync();

            return Ok(query);
        }

        // 2. Báo cáo hiệu suất HLV
        [HttpGet("trainer-performance")]
        public async Task<IActionResult> GetTrainerPerformance([FromQuery] int? month, [FromQuery] int? year)
        {
            // Truy vấn danh sách HLV và đếm số lịch tập (buổi dạy) tương ứng
            var query = await _context.Hlvs.Select(hlv => new
            {
                maHLV = hlv.MaHlv,
                // Nối họ và tên HLV. Nếu database của bạn có cột khác thì thay đổi cho phù hợp
                tenDayDu = hlv.HoHlv + " " + hlv.NameofHlv,
                chuyenmon = hlv.Chuyenmon,
                luongCoBan = hlv.Luong,

                // Đếm số buổi dạy trong bảng LichTap, có lọc theo tháng và năm
                // Đếm số buổi dạy trong bảng LichTap, có lọc theo tháng và năm
                tongSoBuoiDay = _context.LichTaps.Count(lt =>
                    lt.MaHlv == hlv.MaHlv &&
                    (!month.HasValue || lt.NgayTap.Month == month.Value) &&
                    (!year.HasValue || lt.NgayTap.Year == year.Value)
                )
            }).ToListAsync();

            return Ok(query);
        }
        // 3. Báo cáo doanh thu tháng (Gọi Stored Procedure)
        [HttpGet("revenue-month")]
        public async Task<IActionResult> GetRevenueMonth([FromQuery] int month, [FromQuery] int year)
        {
            var result = new RevenueMonthDto();
            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = "sp_BaoCaoDoanhThuThang";
                command.CommandType = System.Data.CommandType.StoredProcedure;

                var paramMonth = command.CreateParameter();
                paramMonth.ParameterName = "@Thang";
                paramMonth.Value = month;
                command.Parameters.Add(paramMonth);

                var paramYear = command.CreateParameter();
                paramYear.ParameterName = "@Nam";
                paramYear.Value = year;
                command.Parameters.Add(paramYear);

                _context.Database.OpenConnection();
                using (var reader = await command.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync())
                    {
                        
                        result.TongDoanhThuThang = reader["TongDoanhThuThang"] != DBNull.Value ? Convert.ToDecimal(reader["TongDoanhThuThang"]) : 0;
                        result.TongSoHoaDon = reader["TongSoHoaDon"] != DBNull.Value ? Convert.ToInt32(reader["TongSoHoaDon"]) : 0;
                        result.GiaTriTrungBinhHoaDon = reader["GiaTriTrungBinhHoaDon"] != DBNull.Value ? Convert.ToDecimal(reader["GiaTriTrungBinhHoaDon"]) : 0;
                        result.TongChiPhi = reader["TongChiPhi"] != DBNull.Value ? Convert.ToDecimal(reader["TongChiPhi"]) : 0;
                        result.LoiNhuanThuan = reader["LoiNhuanThuan"] != DBNull.Value ? Convert.ToDecimal(reader["LoiNhuanThuan"]) : 0;
                        result.ChiPhiLuong = reader["ChiPhiLuong"] != DBNull.Value ? Convert.ToDecimal(reader["ChiPhiLuong"]) : 0;
                        result.ChiPhiBaoTri = reader["ChiPhiBaoTri"] != DBNull.Value ? Convert.ToDecimal(reader["ChiPhiBaoTri"]) : 0;
                        result.ChiPhiMuaSam = reader["ChiPhiMuaSam"] != DBNull.Value ? Convert.ToDecimal(reader["ChiPhiMuaSam"]) : 0;
                    }
                }
                _context.Database.CloseConnection();
            }

            return Ok(result);
        }

        
        //// 4. Báo cáo cơ sở vật chất
        //[HttpGet("facilities")]
        //public async Task<IActionResult> GetFacilities([FromQuery] int? month, [FromQuery] int? year)
        //{
        //    var query = await _context.CoSoVatChats
        //        // Nếu bạn muốn chỉ hiện các thiết bị cần bảo trì/hỏng thì bỏ comment dòng Where bên dưới:
        //        // .Where(c => c.TinhTrangCsvc != "Hoạt động") 
        //        .Select(c => new
        //        {
        //            tenSP = c.TenSp,
        //            soLuongCSVC = c.SoLuongCsvc,
        //            tinhTrangCSVC = c.TinhTrangCsvc,
        //            chiPhiMua = c.ChiPhiMua,
        //            chiPhiBaoTri = c.ChiPhiBaoTri,
        //            // Nếu trong database của bạn có cột SoNgayConBaoHanh thì thay số 0 bằng c.SoNgayConBaoHanh
        //            soNgayConBaoHanh = 0
        //        }).ToListAsync();

        //    // LƯU Ý: Bảng CoSoVatChat hiện tại không có cột Ngày tháng (như NgayMua hay NgayBaoTri).
        //    // Nên mình tạm thời không đưa điều kiện lọc month/year vào đây. 
        //    // Nếu database của bạn có cột ngày, bạn có thể thêm điều kiện vào hàm .Where() ở trên.

        //    return Ok(query);
        //}

        // 5. Lịch sử xuất báo cáo
        [HttpGet("history")]
        public async Task<IActionResult> GetReportHistory([FromQuery] int? month, [FromQuery] int? year)
        {
            var query = _context.LichSuXuatBaoCaos.AsQueryable();
            if (month.HasValue && year.HasValue)
            {
                query = query.Where(x => x.NgayXuat.Value.Month == month && x.NgayXuat.Value.Year == year);
            }
            return Ok(await query.OrderByDescending(x => x.NgayXuat).ToListAsync());
        }

        // 6. Dashboard (Dữ liệu tổng hợp và biểu đồ)
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardData([FromQuery] string filterType, [FromQuery] int year, [FromQuery] int startMonth, [FromQuery] int endMonth, [FromQuery] int startYear, [FromQuery] int endYear)
        {
            // TODO: Viết logic query database để lấy dữ liệu biểu đồ (chartData) và thống kê (summaryStats)
            // Tạm thời trả về mảng rỗng để Frontend không bị lỗi
            return Ok(new
            {
                chartData = new List<object>(),
                summaryStats = new
                {
                    tongDoanhThuThang = 0,
                    doanhThuTrend = "+0%",
                    goiTapMoi = 0,
                    goiTapTrend = "+0%",
                    tongBuoiDay = 0,
                    buoiDayTrend = "+0%",
                    thietBiBaoTri = 0,
                    thietBiTrend = "0"
                }
            });
        }
    }

    // DTO cho Stored Procedure
    public class RevenueMonthDto
    {
        public decimal TongDoanhThuThang { get; set; }
        public int TongSoHoaDon { get; set; }
        public decimal GiaTriTrungBinhHoaDon { get; set; }
        public decimal TongChiPhi { get; set; }
        public decimal LoiNhuanThuan { get; set; }
        public decimal ChiPhiLuong { get; set; }
        public decimal ChiPhiBaoTri { get; set; }
        public decimal ChiPhiMuaSam { get; set; }
    }
}