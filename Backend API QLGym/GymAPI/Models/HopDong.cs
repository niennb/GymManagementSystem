using System;
using System.Collections.Generic;

namespace GymAPI.Models;

public partial class HopDong
{
    public string MaHd { get; set; } = null!;

    public string? MaHv { get; set; }

    public string? MaGoiTap { get; set; }

    public DateOnly? NgayBd { get; set; }

    public DateOnly? NgayKt { get; set; }

    public int? SoLuong { get; set; }

    public string? TrangThaiHd { get; set; }

    public string? LyDoKhoa { get; set; }

    public virtual ICollection<Hoadon> Hoadons { get; set; } = new List<Hoadon>();

    public virtual GoiTap? MaGoiTapNavigation { get; set; }

    public virtual HoiVien? MaHvNavigation { get; set; }
}
