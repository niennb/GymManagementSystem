using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GymAPI.Models;

namespace GymAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GoiTapsController : ControllerBase
    {
        private readonly QlPhonggymContext _context;

        public GoiTapsController(QlPhonggymContext context)
        {
            _context = context;
        }

        // GET: api/GoiTaps
        [HttpGet]
        public async Task<ActionResult<IEnumerable<GoiTap>>> GetGoiTaps()
        {
            return await _context.GoiTaps.ToListAsync();
        }

        // GET: api/GoiTaps/5
        [HttpGet("{id}")]
        public async Task<ActionResult<GoiTap>> GetGoiTap(string id)
        {
            var goiTap = await _context.GoiTaps.FindAsync(id);

            if (goiTap == null)
            {
                return NotFound();
            }

            return goiTap;
        }

        // POST: api/GoiTaps
        [HttpPost]
        public async Task<ActionResult<GoiTap>> PostGoiTap(GoiTap goiTap)
        {
            _context.GoiTaps.Add(goiTap);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (GoiTapExists(goiTap.MaGoiTap))
                {
                    return Conflict();
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetGoiTap", new { id = goiTap.MaGoiTap }, goiTap);
        }

        // PUT: api/GoiTaps/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutGoiTap(string id, GoiTap goiTap)
        {
            if (id != goiTap.MaGoiTap)
            {
                return BadRequest();
            }

            _context.Entry(goiTap).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!GoiTapExists(id))
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

        // DELETE: api/GoiTaps/5
        // DELETE: api/GoiTaps/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGoiTap(string id)
        {
            var goiTap = await _context.GoiTaps.FindAsync(id);
            if (goiTap == null)
            {
                return NotFound();
            }

            _context.GoiTaps.Remove(goiTap);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                // Kiểm tra xem lỗi có phải do vi phạm khoá ngoại (REFERENCE constraint) không
                if (ex.InnerException != null && ex.InnerException.Message.Contains("REFERENCE constraint"))
                {
                    // Trả về mã lỗi 400 (Bad Request) kèm theo thông báo lỗi cho Frontend
                    return BadRequest(new { message = "Không thể xoá gói tập do có hợp đồng sử dụng gói này (liên kết khoá ngoại)." });
                }

                // Nếu là lỗi khác thì ném ra bình thường
                throw;
            }

            return NoContent();
        }

        private bool GoiTapExists(string id)
        {
            return _context.GoiTaps.Any(e => e.MaGoiTap == id);
        }
    }
}