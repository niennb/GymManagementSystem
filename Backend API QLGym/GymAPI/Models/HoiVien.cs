using System;
using System.Collections.Generic;

namespace GymAPI.Models;

public partial class HoiVien
{
    public string MaHv { get; set; } = null!;

    public string? Sdt { get; set; }

    public string? Email { get; set; }

    public string? Gioitinh { get; set; }

    public DateOnly? Ngaysinh { get; set; }

    public string? Trangthai { get; set; }

    public string? Ho { get; set; }

    public string? Ten { get; set; }

    public string? Cccd { get; set; }

    public string? DiaChi { get; set; }

    public string? LyDoKhoa { get; set; }

    public virtual ICollection<HopDong> HopDongs { get; set; } = new List<HopDong>();

    public virtual ICollection<LichTap> LichTaps { get; set; } = new List<LichTap>();
}
