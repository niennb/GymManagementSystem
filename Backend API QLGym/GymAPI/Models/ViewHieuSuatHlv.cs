using System;
using System.Collections.Generic;

namespace GymAPI.Models;

public partial class ViewHieuSuatHlv
{
    public string MaHlv { get; set; } = null!;

    public string? TenDayDu { get; set; }

    public string? Chuyenmon { get; set; }

    public int? TongSoBuoiDay { get; set; }

    public decimal? LuongCoBan { get; set; }
}
