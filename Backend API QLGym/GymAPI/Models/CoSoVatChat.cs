using System;
using System.Collections.Generic;

namespace GymAPI.Models;

public partial class CoSoVatChat
{
    public string MaSp { get; set; } = null!;

    public string? TenSp { get; set; }

    public DateOnly? NgayNhap { get; set; }

    public int? SoLuongCsvc { get; set; }

    public string? TinhTrangCsvc { get; set; }

    public decimal? ChiPhiMua { get; set; }

    public decimal? ChiPhiBaoTri { get; set; }

    public DateOnly? NgayHetHanBaoHanh { get; set; }

    public DateOnly? NgayBaoTriCuoi { get; set; }

    public string? ChiTietBaoTri { get; set; }

    public int? SoNgayConBaoHanh { get; set; }
}
