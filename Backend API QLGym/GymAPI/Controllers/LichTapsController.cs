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
    public class LichTapsController : ControllerBase
    {
        private readonly QlPhonggymContext _context;

        public LichTapsController(QlPhonggymContext context) { _context = context; }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LichTap>>> GetLichTaps([FromQuery] string search = "")
        {
            var query = _context.LichTaps.AsQueryable();
            if (!string.IsNullOrEmpty(search))
            {
                search = search.ToLower();
                query = query.Where(l => l.MaLich.ToLower().Contains(search) ||
                                         l.MaHv.ToLower().Contains(search) ||
                                         l.MaHlv.ToLower().Contains(search));
            }
            return await query.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LichTap>> GetLichTap(string id)
        {
            var lich = await _context.LichTaps.FindAsync(id);
            if (lich == null) return NotFound(new { message = "Không tìm thấy lịch tập." });
            return lich;
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutLichTap(string id, LichTap lich)
        {
            if (id != lich.MaLich) return BadRequest(new { message = "Mã lịch tập không khớp." });
            _context.Entry(lich).State = EntityState.Modified;
            try { await _context.SaveChangesAsync(); }
            catch (DbUpdateConcurrencyException) { if (!LichTapExists(id)) return NotFound(); else throw; }
            catch (DbUpdateException ex)
            {
                if (ex.InnerException != null && ex.InnerException.Message.Contains("FOREIGN KEY"))
                    return BadRequest(new { message = "Mã Học viên hoặc Mã HLV không tồn tại." });
                throw;
            }
            return NoContent();
        }

        [HttpPost]
        public async Task<ActionResult<LichTap>> PostLichTap(LichTap lich)
        {
            _context.LichTaps.Add(lich);
            try { await _context.SaveChangesAsync(); }
            catch (DbUpdateException ex)
            {
                if (LichTapExists(lich.MaLich)) return Conflict(new { message = "Mã lịch tập đã tồn tại." });
                if (ex.InnerException != null && ex.InnerException.Message.Contains("FOREIGN KEY"))
                    return BadRequest(new { message = "Mã Học viên hoặc Mã HLV không tồn tại." });
                throw;
            }
            return CreatedAtAction("GetLichTap", new { id = lich.MaLich }, lich);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLichTap(string id)
        {
            var lich = await _context.LichTaps.FindAsync(id);
            if (lich == null) return NotFound();
            _context.LichTaps.Remove(lich);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool LichTapExists(string id) => _context.LichTaps.Any(e => e.MaLich == id);
    }
}