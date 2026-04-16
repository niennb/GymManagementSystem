using System;
using System.Collections.Generic;

namespace GymAPI.Models;

public partial class ViewBaoCaoTaiSan
{
    public string? TenSp { get; set; }

    public int? SoLuongCsvc { get; set; }

    public string? TinhTrangCsvc { get; set; }

    public double? ChiPhiMua { get; set; }

    public double? ChiPhiBaoTri { get; set; }

    public int? SoNgayConBaoHanh { get; set; }
}
