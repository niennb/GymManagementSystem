using System;
using System.Collections.Generic;

namespace GymAPI.Models;

public partial class LichSuXuatBaoCao
{
    public string MaBaoCao { get; set; } = null!;

    public string? TenBaoCao { get; set; }

    public string? NguoiXuat { get; set; }

    public DateTime? NgayXuat { get; set; }

    public string? NoiDungTomTat { get; set; }

    public virtual NhanVien? NguoiXuatNavigation { get; set; }
}
