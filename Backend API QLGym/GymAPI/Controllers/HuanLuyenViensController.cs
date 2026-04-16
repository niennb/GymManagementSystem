using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GymAPI.Models;

namespace GymAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HuanLuyenViensController : ControllerBase
    {
        private readonly QlPhonggymContext _context;

        public HuanLuyenViensController(QlPhonggymContext context) { _context = context; }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Hlv>>> GetHuanLuyenViens([FromQuery] string search = "")
        {
            var query = _context.Hlvs.AsQueryable();
            if (!string.IsNullOrEmpty(search))
            {
                search = search.ToLower();
                query = query.Where(h => h.MaHlv.ToLower().Contains(search) ||
                                         h.NameofHlv.ToLower().Contains(search) ||
                                         h.HoHlv.ToLower().Contains(search) ||
                                         h.Sdthlv.Contains(search));
            }
            return await query.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Hlv>> GetHuanLuyenVien(string id)
        {
            var hlv = await _context.Hlvs.FindAsync(id);
            if (hlv == null) return NotFound(new { message = "Không tìm thấy HLV." });
            return hlv;
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutHuanLuyenVien(string id, Hlv hlv)
        {
            if (id != hlv.MaHlv) return BadRequest(new { message = "Mã HLV không khớp." });

            // Kiểm tra trùng SĐT
            if (_context.Hlvs.Any(h => h.Sdthlv == hlv.Sdthlv && h.MaHlv != id))
                return BadRequest(new { message = "Số điện thoại này đã được sử dụng bởi HLV khác." });

            _context.Entry(hlv).State = EntityState.Modified;
            try { await _context.SaveChangesAsync(); }
            catch (DbUpdateConcurrencyException) { if (!HuanLuyenVienExists(id)) return NotFound(); else throw; }
            return NoContent();
        }

        [HttpPost]
        public async Task<ActionResult<Hlv>> PostHuanLuyenVien(Hlv hlv)
        {
            // Kiểm tra trùng SĐT
            if (_context.Hlvs.Any(h => h.Sdthlv == hlv.Sdthlv))
                return BadRequest(new { message = "Số điện thoại này đã được sử dụng." });

            _context.Hlvs.Add(hlv);
            try { await _context.SaveChangesAsync(); }
            catch (DbUpdateException)
            {
                if (HuanLuyenVienExists(hlv.MaHlv)) return Conflict(new { message = "Mã HLV đã tồn tại." });
                throw;
            }
            return CreatedAtAction("GetHuanLuyenVien", new { id = hlv.MaHlv }, hlv);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteHuanLuyenVien(string id)
        {
            var hlv = await _context.Hlvs.FindAsync(id);
            if (hlv == null) return NotFound();

            _context.Hlvs.Remove(hlv);
            try { await _context.SaveChangesAsync(); }
            catch (DbUpdateException ex)
            {
                if (ex.InnerException != null && ex.InnerException.Message.Contains("REFERENCE constraint"))
                    return BadRequest(new { message = "Không thể xóa HLV này vì đang có lịch tập liên kết!" });
                throw;
            }
            return NoContent();
        }

        private bool HuanLuyenVienExists(string id) => _context.Hlvs.Any(e => e.MaHlv == id);
    }
}