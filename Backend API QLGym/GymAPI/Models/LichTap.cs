using System;
using System.Collections.Generic;

namespace GymAPI.Models;

public partial class LichTap
{
    public string MaLich { get; set; } = null!;

    public string? MaHv { get; set; }

    public string? MaHlv { get; set; }

    public DateOnly NgayTap { get; set; }

    public string KhungGioTap { get; set; } = null!;

    public string? GhiChu { get; set; }

    public decimal? TienTap { get; set; }

    public bool? XacNhan { get; set; }

    public virtual Hlv? MaHlvNavigation { get; set; }

    public virtual HoiVien? MaHvNavigation { get; set; }
}
