using System;
using System.Collections.Generic;

namespace GymAPI.Models;

public partial class Hoadon
{
    public string MaHoaDon { get; set; } = null!;

    public string? MaHd { get; set; }

    public DateOnly? NgayThanhToan { get; set; }

    public int? SoLuongHoaDon { get; set; }

    public string? PhuongThucTt { get; set; }

    public decimal? SoTien { get; set; }

    public decimal? DaTt { get; set; }

    public decimal? ConNo { get; set; }

    public string? NguoiLapHoaDon { get; set; }

    public virtual HopDong? MaHdNavigation { get; set; }
}
