using System;
using System.Collections.Generic;

namespace GymAPI.Models;

public partial class Hlv
{
    public string MaHlv { get; set; } = null!;

    public string? Chuyenmon { get; set; }

    public string? Sdthlv { get; set; }

    public decimal? Luong { get; set; }

    public string? NameofHlv { get; set; }

    public string? HoHlv { get; set; }

    public DateOnly? NgayGiaNhap { get; set; }

    public decimal? Tien1TiengTap { get; set; }

    public string? TrangThaidilam { get; set; }

    public DateOnly? NgayNghiPhep { get; set; }

    public DateOnly? NgayHetPhep { get; set; }

    public DateOnly? NghiViec { get; set; }

    public virtual ICollection<LichTap> LichTaps { get; set; } = new List<LichTap>();
}
