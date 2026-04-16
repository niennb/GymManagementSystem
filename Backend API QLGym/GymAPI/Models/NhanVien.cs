using System;
using System.Collections.Generic;

namespace GymAPI.Models;

public partial class NhanVien
{
    public string MaNv { get; set; } = null!;

    public string? Matkhau { get; set; }

    public string? Chucvu { get; set; }

    public string? Sdtnv { get; set; }

    public string? EmailNv { get; set; }

    public DateOnly? NgaySinhNv { get; set; }

    public decimal? LuongNv { get; set; }

    public string? HoNv { get; set; }

    public string? TenNv { get; set; }

    public DateOnly? ThoiGianVao { get; set; }

    public string? TrangThaidilam { get; set; }

    public DateOnly? NgayNghiPhep { get; set; }

    public DateOnly? NgayHetPhep { get; set; }

    public DateOnly? NghiViec { get; set; }

    public virtual ICollection<LichSuXuatBaoCao> LichSuXuatBaoCaos { get; set; } = new List<LichSuXuatBaoCao>();
}
