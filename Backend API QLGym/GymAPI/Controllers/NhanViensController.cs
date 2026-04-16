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
    public class NhanViensController : ControllerBase
    {
        private readonly QlPhonggymContext _context;

        public NhanViensController(QlPhonggymContext context)
        {
            _context = context;
        }

        // GET: api/NhanViens
        [HttpGet]
        public async Task<ActionResult<IEnumerable<NhanVien>>> GetNhanViens([FromQuery] string search = "")
        {
            var query = _context.NhanViens.AsQueryable();

            // Xử lý tìm kiếm ở Backend
            if (!string.IsNullOrEmpty(search))
            {
                search = search.ToLower();
                query = query.Where(n =>
                    n.MaNv.ToLower().Contains(search) ||
                    n.HoNv.ToLower().Contains(search) ||
                    n.TenNv.ToLower().Contains(search) ||
                    n.Sdtnv.Contains(search));
            }

            return await query.ToListAsync();
        }

        // GET: api/NhanViens/5
        [HttpGet("{id}")]
        public async Task<ActionResult<NhanVien>> GetNhanVien(string id)
        {
            var nhanVien = await _context.NhanViens.FindAsync(id);

            if (nhanVien == null)
            {
                return NotFound();
            }

            return nhanVien;
        }

        // PUT: api/NhanViens/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutNhanVien(string id, NhanVien nhanVien)
        {
            if (id != nhanVien.MaNv)
            {
                return BadRequest("Mã nhân viên không khớp.");
            }

            _context.Entry(nhanVien).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!NhanVienExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
            catch (DbUpdateException ex)
            {
                // Bắt lỗi trùng lặp SĐT hoặc Email (UNIQUE KEY constraint)
                if (ex.InnerException != null && ex.InnerException.Message.Contains("UNIQUE KEY"))
                {
                    return BadRequest("Số điện thoại hoặc Email đã tồn tại trong hệ thống.");
                }
                throw;
            }

            return NoContent();
        }

        // POST: api/NhanViens
        [HttpPost]
        public async Task<ActionResult<NhanVien>> PostNhanVien(NhanVien nhanVien)
        {
            _context.NhanViens.Add(nhanVien);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                if (NhanVienExists(nhanVien.MaNv))
                {
                    return Conflict("Mã nhân viên đã tồn tại.");
                }
                // Bắt lỗi trùng lặp SĐT hoặc Email (UNIQUE KEY constraint)
                if (ex.InnerException != null && ex.InnerException.Message.Contains("UNIQUE KEY"))
                {
                    return BadRequest("Số điện thoại hoặc Email đã tồn tại trong hệ thống.");
                }
                throw;
            }

            return CreatedAtAction("GetNhanVien", new { id = nhanVien.MaNv }, nhanVien);
        }

        // DELETE: api/NhanViens/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNhanVien(string id)
        {
            var nhanVien = await _context.NhanViens.FindAsync(id);
            if (nhanVien == null)
            {
                return NotFound();
            }

            _context.NhanViens.Remove(nhanVien);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                // Bắt lỗi khoá ngoại (REFERENCE constraint)
                if (ex.InnerException != null && ex.InnerException.Message.Contains("REFERENCE constraint"))
                {
                    return BadRequest(new { message = "Không thể xoá nhân viên này do có dữ liệu liên kết (ví dụ: lịch sử xuất báo cáo)." });
                }
                throw;
            }

            return NoContent();
        }

        private bool NhanVienExists(string id)
        {
            return _context.NhanViens.Any(e => e.MaNv == id);
        }
    }
}