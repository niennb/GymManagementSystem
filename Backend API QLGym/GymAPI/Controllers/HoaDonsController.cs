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
    public class HoaDonsController : ControllerBase
    {
        private readonly QlPhonggymContext _context;

        public HoaDonsController(QlPhonggymContext context) { _context = context; }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Hoadon>>> GetHoaDons([FromQuery] string search = "")
        {
            var query = _context.Hoadons.AsQueryable();
            if (!string.IsNullOrEmpty(search))
            {
                search = search.ToLower();
                query = query.Where(h => h.MaHoaDon.ToLower().Contains(search) || h.MaHd.ToLower().Contains(search));
            }
            return await query.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Hoadon>> GetHoaDon(string id)
        {
            var hoadon = await _context.Hoadons.FindAsync(id);
            if (hoadon == null) return NotFound(new { message = "Không tìm thấy hóa đơn." });
            return hoadon;
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutHoaDon(string id, Hoadon hoadon)
        {
            if (id != hoadon.MaHoaDon) return BadRequest(new { message = "Mã hóa đơn không khớp." });
            _context.Entry(hoadon).State = EntityState.Modified;
            try { await _context.SaveChangesAsync(); }
            catch (DbUpdateConcurrencyException) { if (!HoaDonExists(id)) return NotFound(); else throw; }
            catch (DbUpdateException ex)
            {
                if (ex.InnerException != null && ex.InnerException.Message.Contains("FOREIGN KEY"))
                    return BadRequest(new { message = "Mã hợp đồng không tồn tại." });
                throw;
            }
            return NoContent();
        }

        [HttpPost]
        public async Task<ActionResult<Hoadon>> PostHoaDon(Hoadon hoadon)
        {
            _context.Hoadons.Add(hoadon);
            try { await _context.SaveChangesAsync(); }
            catch (DbUpdateException ex)
            {
                if (HoaDonExists(hoadon.MaHoaDon)) return Conflict(new { message = "Mã hóa đơn đã tồn tại." });
                if (ex.InnerException != null && ex.InnerException.Message.Contains("FOREIGN KEY"))
                    return BadRequest(new { message = "Mã hợp đồng không tồn tại." });
                throw;
            }
            return CreatedAtAction("GetHoaDon", new { id = hoadon.MaHoaDon }, hoadon);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteHoaDon(string id)
        {
            var hoadon = await _context.Hoadons.FindAsync(id);
            if (hoadon == null) return NotFound();
            _context.Hoadons.Remove(hoadon);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool HoaDonExists(string id) => _context.Hoadons.Any(e => e.MaHoaDon == id);
    }
}