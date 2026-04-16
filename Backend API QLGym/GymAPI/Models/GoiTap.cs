using System;
using System.Collections.Generic;

namespace GymAPI.Models;

public partial class GoiTap
{
    public string MaGoiTap { get; set; } = null!;

    public string? TenGoi { get; set; }

    public string? LoaiGoitap { get; set; }

    public decimal? GiaTien { get; set; }

    public int? Thoihan { get; set; }

    public virtual ICollection<HopDong> HopDongs { get; set; } = new List<HopDong>();
}
