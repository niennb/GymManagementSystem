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
    public class CoSoVatChatsController : ControllerBase
    {
        private readonly QlPhonggymContext _context;

        public CoSoVatChatsController(QlPhonggymContext context) { _context = context; }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CoSoVatChat>>> GetCoSoVatChats([FromQuery] string search = "")
        {
            var query = _context.CoSoVatChats.AsQueryable();
            if (!string.IsNullOrEmpty(search))
            {
                search = search.ToLower();
                query = query.Where(c => c.MaSp.ToLower().Contains(search) || c.TenSp.ToLower().Contains(search));
            }
            return await query.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CoSoVatChat>> GetCoSoVatChat(string id)
        {
            var csvc = await _context.CoSoVatChats.FindAsync(id);
            if (csvc == null) return NotFound(new { message = "Không tìm thấy CSVC." });
            return csvc;
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutCoSoVatChat(string id, CoSoVatChat csvc)
        {
            if (id != csvc.MaSp) return BadRequest(new { message = "Mã sản phẩm không khớp." });
            _context.Entry(csvc).State = EntityState.Modified;
            try { await _context.SaveChangesAsync(); }
            catch (DbUpdateConcurrencyException) { if (!CoSoVatChatExists(id)) return NotFound(); else throw; }
            return NoContent();
        }

        [HttpPost]
        public async Task<ActionResult<CoSoVatChat>> PostCoSoVatChat(CoSoVatChat csvc)
        {
            _context.CoSoVatChats.Add(csvc);
            try { await _context.SaveChangesAsync(); }
            catch (DbUpdateException)
            {
                if (CoSoVatChatExists(csvc.MaSp)) return Conflict(new { message = "Mã sản phẩm đã tồn tại." });
                throw;
            }
            return CreatedAtAction("GetCoSoVatChat", new { id = csvc.MaSp }, csvc);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCoSoVatChat(string id)
        {
            var csvc = await _context.CoSoVatChats.FindAsync(id);
            if (csvc == null) return NotFound();
            _context.CoSoVatChats.Remove(csvc);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool CoSoVatChatExists(string id) => _context.CoSoVatChats.Any(e => e.MaSp == id);
    }
}