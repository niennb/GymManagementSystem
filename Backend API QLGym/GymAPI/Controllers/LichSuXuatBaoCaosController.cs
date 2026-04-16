using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GymAPI.Models; // Đổi namespace cho khớp
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
// using QuanLyPhongGym.Data; // Uncomment và đổi tên nếu cần gọi DbContext

namespace QuanLyPhongGym.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LichSuXuatBaoCaosController : ControllerBase
    {
        private readonly QlPhonggymContext _context; // Đổi GymDbContext thành tên DbContext của bạn

        public LichSuXuatBaoCaosController(QlPhonggymContext context)
        {
            _context = context;
        }

        // GET: api/LichSuXuatBaoCaos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<LichSuXuatBaoCao>>> GetLichSuXuatBaoCaos()
        {
            return await _context.LichSuXuatBaoCaos.ToListAsync();
        }

        // GET: api/LichSuXuatBaoCaos/BC01
        [HttpGet("{id}")]
        public async Task<ActionResult<LichSuXuatBaoCao>> GetLichSuXuatBaoCao(string id)
        {
            var lichSu = await _context.LichSuXuatBaoCaos.FindAsync(id);

            if (lichSu == null)
            {
                return NotFound();
            }

            return lichSu;
        }

        // POST: api/LichSuXuatBaoCaos
        [HttpPost]
        public async Task<ActionResult<LichSuXuatBaoCao>> PostLichSuXuatBaoCao(LichSuXuatBaoCao lichSu)
        {
            _context.LichSuXuatBaoCaos.Add(lichSu);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (LichSuExists(lichSu.MaBaoCao))
                {
                    return Conflict();
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetLichSuXuatBaoCao", new { id = lichSu.MaBaoCao }, lichSu);
        }

        // PUT: api/LichSuXuatBaoCaos/BC01
        [HttpPut("{id}")]
        public async Task<IActionResult> PutLichSuXuatBaoCao(string id, LichSuXuatBaoCao lichSu)
        {
            if (id != lichSu.MaBaoCao)
            {
                return BadRequest();
            }

            _context.Entry(lichSu).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!LichSuExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/LichSuXuatBaoCaos/BC01
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLichSuXuatBaoCao(string id)
        {
            var lichSu = await _context.LichSuXuatBaoCaos.FindAsync(id);
            if (lichSu == null)
            {
                return NotFound();
            }

            _context.LichSuXuatBaoCaos.Remove(lichSu);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool LichSuExists(string id)
        {
            return _context.LichSuXuatBaoCaos.Any(e => e.MaBaoCao == id);
        }
    }
}