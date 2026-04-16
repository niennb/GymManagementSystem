using GymAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


namespace YourProjectName.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MembersController : ControllerBase
    {
        private readonly QlPhonggymContext _context;

        public MembersController(QlPhonggymContext context)
        {
            _context = context;
        }

        // GET: api/members
        [HttpGet]
        public async Task<ActionResult<IEnumerable<HoiVien>>> GetMembers([FromQuery] string search = "")
        {
            var query = _context.HoiViens.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(m => m.Ho.Contains(search) ||
                                         m.Ten.Contains(search) ||
                                         m.Sdt.Contains(search) ||
                                         m.MaHv.Contains(search));
            }

            return await query.ToListAsync();
        }

        // POST: api/members
        [HttpPost]
        public async Task<ActionResult<HoiVien>> PostMember(HoiVien member)
        {
            // Kiểm tra trùng mã HV
            if (_context.HoiViens.Any(m => m.MaHv == member.MaHv))
            {
                return BadRequest(new { message = "Mã hội viên đã tồn tại." });
            }

            _context.HoiViens.Add(member);
            await _context.SaveChangesAsync();

            return Ok(member);
        }

        // PUT: api/members/HV01
        // PUT: api/members/HV01
        [HttpPut("{id}")]
        public async Task<IActionResult> PutMember(string id, HoiVien member)
        {
            if (id != member.MaHv)
            {
                return BadRequest(new { message = "Mã hội viên không khớp." });
            }

            // Tìm hội viên hiện tại trong Database
            var existingMember = await _context.HoiViens.FindAsync(id);
            if (existingMember == null)
            {
                return NotFound(new { message = "Không tìm thấy hội viên." });
            }

            // Cập nhật từng trường dữ liệu
            existingMember.Ho = member.Ho;
            existingMember.Ten = member.Ten;
            existingMember.Ngaysinh = member.Ngaysinh;
            existingMember.Sdt = member.Sdt;
            existingMember.Email = member.Email;
            existingMember.Gioitinh = member.Gioitinh;
            existingMember.Trangthai = member.Trangthai;
            // Không cập nhật NgayGiaNhap nếu không cần thiết
            existingMember.LyDoKhoa = member.LyDoKhoa;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi lưu vào cơ sở dữ liệu: " + ex.Message });
            }

            return Ok(new { message = "Cập nhật thành công" });
        }

        // DELETE: api/members/HV01
        // DELETE: api/members/HV01
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMember(string id)
        {
            // 1. KIỂM TRA KHÓA NGOẠI (HỢP ĐỒNG TẬP)
            // Giả sử bảng hợp đồng của bạn tên là HopDongTaps và có cột MaHv
            bool hasContract = await _context.HopDongs.AnyAsync(h => h.MaHv == id);

            if (hasContract)
            {
                // Trả về lỗi 400 kèm câu thông báo. Frontend sẽ tự động lấy câu này hiện lên Modal.
                return BadRequest(new { message = "CẢNH BÁO: Hội viên này đang có hợp đồng tập. Không thể xóa!" });
            }

            // 2. NẾU KHÔNG CÓ HỢP ĐỒNG THÌ TIẾN HÀNH XÓA
            var member = await _context.HoiViens.FindAsync(id);
            if (member == null)
            {
                return NotFound(new { message = "Không tìm thấy hội viên." });
            }

            _context.HoiViens.Remove(member);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa thành công" });
        }
    }
}