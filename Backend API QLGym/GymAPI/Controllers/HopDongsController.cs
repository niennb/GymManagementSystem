using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GymAPI.Models;

namespace GymAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HopDongsController : ControllerBase
    {
        private readonly QlPhonggymContext _context;

        public HopDongsController(QlPhonggymContext context)
        {
            _context = context;
        }

        // GET: api/HopDongs
        [HttpGet]
        public async Task<ActionResult<IEnumerable<HopDong>>> GetHopDongs([FromQuery] string search = "")
        {
            var query = _context.HopDongs.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                search = search.ToLower();
                query = query.Where(h =>
                    h.MaHd.ToLower().Contains(search) ||
                    h.MaHv.ToLower().Contains(search) ||
                    h.MaGoiTap.ToLower().Contains(search));
            }

            return await query.ToListAsync();
        }

        // GET: api/HopDongs/5
        [HttpGet("{id}")]
        public async Task<ActionResult<HopDong>> GetHopDong(string id)
        {
            var hopDong = await _context.HopDongs.FindAsync(id);

            if (hopDong == null)
            {
                return NotFound(new { message = "Không tìm thấy hợp đồng." });
            }

            return hopDong;
        }

        // PUT: api/HopDongs/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutHopDong(string id, HopDong hopDong)
        {
            if (id != hopDong.MaHd)
            {
                return BadRequest(new { message = "Mã hợp đồng không khớp." });
            }

            _context.Entry(hopDong).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!HopDongExists(id))
                {
                    return NotFound(new { message = "Không tìm thấy hợp đồng." });
                }
                else
                {
                    throw;
                }
            }
            catch (DbUpdateException ex)
            {
                // Bắt lỗi khoá ngoại (Mã HV hoặc Mã Gói Tập không tồn tại)
                if (ex.InnerException != null && ex.InnerException.Message.Contains("FOREIGN KEY"))
                {
                    return BadRequest(new { message = "Mã học viên hoặc Mã gói tập không tồn tại trong hệ thống." });
                }
                throw;
            }

            return NoContent();
        }

        // POST: api/HopDongs
        [HttpPost]
        public async Task<ActionResult<HopDong>> PostHopDong(HopDong hopDong)
        {
            _context.HopDongs.Add(hopDong);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                if (HopDongExists(hopDong.MaHd))
                {
                    return Conflict(new { message = "Mã hợp đồng đã tồn tại." });
                }
                // Bắt lỗi khoá ngoại (Mã HV hoặc Mã Gói Tập không tồn tại)
                if (ex.InnerException != null && ex.InnerException.Message.Contains("FOREIGN KEY"))
                {
                    return BadRequest(new { message = "Mã học viên hoặc Mã gói tập không tồn tại trong hệ thống." });
                }
                throw;
            }

            return CreatedAtAction("GetHopDong", new { id = hopDong.MaHd }, hopDong);
        }

        // DELETE: api/HopDongs/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteHopDong(string id)
        {
            var hopDong = await _context.HopDongs.FindAsync(id);
            if (hopDong == null)
            {
                return NotFound(new { message = "Không tìm thấy hợp đồng." });
            }

            _context.HopDongs.Remove(hopDong);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                // Bắt lỗi khoá ngoại khi xoá (Ví dụ: Hợp đồng đã có Hoá đơn)
                if (ex.InnerException != null && ex.InnerException.Message.Contains("REFERENCE constraint"))
                {
                    return BadRequest(new { message = "Không thể xoá hợp đồng này vì đã có hoá đơn hoặc dữ liệu liên kết!" });
                }
                throw;
            }

            return NoContent();
        }

        private bool HopDongExists(string id)
        {
            return _context.HopDongs.Any(e => e.MaHd == id);
        }
    }
}