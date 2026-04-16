using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace GymAPI.Models;

public partial class QlPhonggymContext : DbContext
{
    public QlPhonggymContext()
    {
    }

    public QlPhonggymContext(DbContextOptions<QlPhonggymContext> options)
        : base(options)
    {
    }

    public virtual DbSet<CoSoVatChat> CoSoVatChats { get; set; }

    public virtual DbSet<GoiTap> GoiTaps { get; set; }

    public virtual DbSet<Hlv> Hlvs { get; set; }

    public virtual DbSet<Hoadon> Hoadons { get; set; }

    public virtual DbSet<HoiVien> HoiViens { get; set; }

    public virtual DbSet<HopDong> HopDongs { get; set; }

    public virtual DbSet<LichSuXuatBaoCao> LichSuXuatBaoCaos { get; set; }

    public virtual DbSet<LichTap> LichTaps { get; set; }

    public virtual DbSet<NhanVien> NhanViens { get; set; }

    public virtual DbSet<ThongKeHoiVien> ThongKeHoiViens { get; set; }

    public virtual DbSet<ViewDoanhThuGoiTap> ViewDoanhThuGoiTaps { get; set; }

    public virtual DbSet<ViewHieuSuatHlv> ViewHieuSuatHlvs { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Data Source= DESKTOP-TNQ37C6;Initial Catalog=QL_PHONGGYM;Integrated Security=True;TrustServerCertificate=True");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CoSoVatChat>(entity =>
        {
            entity.HasKey(e => e.MaSp);

            entity.ToTable("CoSoVatChat");

            entity.Property(e => e.MaSp)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("MaSP");
            entity.Property(e => e.ChiPhiBaoTri).HasColumnType("money");
            entity.Property(e => e.ChiPhiMua).HasColumnType("money");
            entity.Property(e => e.ChiTietBaoTri).HasMaxLength(500);
            entity.Property(e => e.SoLuongCsvc).HasColumnName("SoLuongCSVC");
            entity.Property(e => e.TenSp)
                .HasMaxLength(50)
                .HasColumnName("TenSP");
            entity.Property(e => e.TinhTrangCsvc)
                .HasMaxLength(20)
                .HasDefaultValue("Hoạt động", "TinhTrangDefault")
                .HasColumnName("TinhTrangCSVC");
        });

        modelBuilder.Entity<GoiTap>(entity =>
        {
            entity.HasKey(e => e.MaGoiTap).HasName("MaGoiTap_PK");

            entity.ToTable("GoiTap");

            entity.Property(e => e.MaGoiTap)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.GiaTien).HasColumnType("money");
            entity.Property(e => e.LoaiGoitap).HasMaxLength(20);
            entity.Property(e => e.TenGoi).HasMaxLength(50);
            entity.Property(e => e.Thoihan).HasColumnName("thoihan");
        });

        modelBuilder.Entity<Hlv>(entity =>
        {
            entity.HasKey(e => e.MaHlv).HasName("PK_HuanLuyenVien");

            entity.ToTable("HLV");

            entity.HasIndex(e => e.Sdthlv, "SDTHLV_Unique").IsUnique();

            entity.Property(e => e.MaHlv)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("MaHLV");
            entity.Property(e => e.Chuyenmon).HasMaxLength(20);
            entity.Property(e => e.HoHlv)
                .HasMaxLength(50)
                .HasColumnName("hoHLV");
            entity.Property(e => e.Luong).HasColumnType("money");
            entity.Property(e => e.NameofHlv)
                .HasMaxLength(50)
                .HasColumnName("nameofHLV");
            entity.Property(e => e.Sdthlv)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("SDTHLV");
            entity.Property(e => e.Tien1TiengTap).HasColumnType("money");
            entity.Property(e => e.TrangThaidilam)
                .HasMaxLength(20)
                .HasDefaultValue("Đi làm");
        });

        modelBuilder.Entity<Hoadon>(entity =>
        {
            entity.HasKey(e => e.MaHoaDon);

            entity.ToTable("Hoadon", tb => tb.HasTrigger("Trg_KichHoatThanhToan"));

            entity.Property(e => e.MaHoaDon)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.ConNo).HasColumnType("money");
            entity.Property(e => e.DaTt)
                .HasColumnType("money")
                .HasColumnName("DaTT");
            entity.Property(e => e.MaHd)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("MaHD");
            entity.Property(e => e.NgayThanhToan).HasDefaultValueSql("(getdate())", "NgayThanhToan_Default");
            entity.Property(e => e.NguoiLapHoaDon).HasMaxLength(50);
            entity.Property(e => e.PhuongThucTt)
                .HasMaxLength(20)
                .HasColumnName("PhuongThucTT");
            entity.Property(e => e.SoTien).HasColumnType("money");

            entity.HasOne(d => d.MaHdNavigation).WithMany(p => p.Hoadons)
                .HasForeignKey(d => d.MaHd)
                .HasConstraintName("MaHD_FK");
        });

        modelBuilder.Entity<HoiVien>(entity =>
        {
            entity.HasKey(e => e.MaHv).HasName("maHV_PK");

            entity.ToTable("HoiVien");

            entity.HasIndex(e => e.Sdt, "UQ__HoiVien__DDDFB4830A93463B").IsUnique();

            entity.HasIndex(e => e.Cccd, "cccd_unique").IsUnique();

            entity.HasIndex(e => e.Email, "emailhv_unique").IsUnique();

            entity.Property(e => e.MaHv)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("maHV");
            entity.Property(e => e.Cccd)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("CCCD");
            entity.Property(e => e.DiaChi).HasMaxLength(255);
            entity.Property(e => e.Email)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("email");
            entity.Property(e => e.Gioitinh)
                .HasMaxLength(3)
                .HasColumnName("gioitinh");
            entity.Property(e => e.Ho).HasMaxLength(50);
            entity.Property(e => e.LyDoKhoa).HasMaxLength(255);
            entity.Property(e => e.Ngaysinh).HasColumnName("ngaysinh");
            entity.Property(e => e.Sdt)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("sdt");
            entity.Property(e => e.Ten).HasMaxLength(50);
            entity.Property(e => e.Trangthai)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasDefaultValue("Locked", "Trangthai_Default");
        });

        modelBuilder.Entity<HopDong>(entity =>
        {
            entity.HasKey(e => e.MaHd).HasName("MaHD_PK");

            entity.ToTable("HopDong");

            entity.Property(e => e.MaHd)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("MaHD");
            entity.Property(e => e.LyDoKhoa).HasMaxLength(255);
            entity.Property(e => e.MaGoiTap)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.MaHv)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("maHV");
            entity.Property(e => e.NgayBd).HasColumnName("NgayBD");
            entity.Property(e => e.NgayKt).HasColumnName("NgayKT");
            entity.Property(e => e.SoLuong).HasDefaultValue(1, "SoLuong_Default");
            entity.Property(e => e.TrangThaiHd)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasDefaultValue("Locked", "TrangThaiHD_Default")
                .HasColumnName("TrangThaiHD");

            entity.HasOne(d => d.MaGoiTapNavigation).WithMany(p => p.HopDongs)
                .HasForeignKey(d => d.MaGoiTap)
                .HasConstraintName("maGoi_FK");

            entity.HasOne(d => d.MaHvNavigation).WithMany(p => p.HopDongs)
                .HasForeignKey(d => d.MaHv)
                .HasConstraintName("maHV_FK");
        });

        modelBuilder.Entity<LichSuXuatBaoCao>(entity =>
        {
            entity.HasKey(e => e.MaBaoCao);

            entity.ToTable("LichSuXuatBaoCao");

            entity.Property(e => e.MaBaoCao)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.NgayXuat).HasColumnType("datetime");
            entity.Property(e => e.NguoiXuat)
                .HasMaxLength(10)
                .IsUnicode(false);
            entity.Property(e => e.NoiDungTomTat).HasMaxLength(500);
            entity.Property(e => e.TenBaoCao).HasMaxLength(100);

            entity.HasOne(d => d.NguoiXuatNavigation).WithMany(p => p.LichSuXuatBaoCaos)
                .HasForeignKey(d => d.NguoiXuat)
                .HasConstraintName("FK_LichSuXuatBaoCao_NhanVien");
        });

        modelBuilder.Entity<LichTap>(entity =>
        {
            entity.HasKey(e => e.MaLich);

            entity.ToTable("LichTap");

            entity.Property(e => e.MaLich)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.GhiChu).HasMaxLength(300);
            entity.Property(e => e.KhungGioTap)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.MaHlv)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("MaHLV");
            entity.Property(e => e.MaHv)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("maHV");
            entity.Property(e => e.TienTap).HasColumnType("money");
            entity.Property(e => e.XacNhan).HasDefaultValue(false);

            entity.HasOne(d => d.MaHlvNavigation).WithMany(p => p.LichTaps)
                .HasForeignKey(d => d.MaHlv)
                .HasConstraintName("FK_LichTap_HuanLuyenVien");

            entity.HasOne(d => d.MaHvNavigation).WithMany(p => p.LichTaps)
                .HasForeignKey(d => d.MaHv)
                .HasConstraintName("maHV_FK_Lichtap");
        });

        modelBuilder.Entity<NhanVien>(entity =>
        {
            entity.HasKey(e => e.MaNv).HasName("maNV_PK");

            entity.ToTable("NhanVien");

            entity.HasIndex(e => e.Sdtnv, "SDT_Unique").IsUnique();

            entity.HasIndex(e => e.EmailNv, "email_Unique").IsUnique();

            entity.Property(e => e.MaNv)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("maNV");
            entity.Property(e => e.Chucvu)
                .HasMaxLength(20)
                .HasColumnName("chucvu");
            entity.Property(e => e.EmailNv)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("emailNV");
            entity.Property(e => e.HoNv)
                .HasMaxLength(50)
                .HasColumnName("HoNV");
            entity.Property(e => e.LuongNv)
                .HasColumnType("money")
                .HasColumnName("LuongNV");
            entity.Property(e => e.Matkhau)
                .HasMaxLength(50)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("matkhau");
            entity.Property(e => e.NgaySinhNv).HasColumnName("NgaySinhNV");
            entity.Property(e => e.Sdtnv)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("SDTNV");
            entity.Property(e => e.TenNv)
                .HasMaxLength(50)
                .HasColumnName("TenNV");
            entity.Property(e => e.TrangThaidilam)
                .HasMaxLength(20)
                .HasDefaultValue("Đi làm");
        });

        modelBuilder.Entity<ThongKeHoiVien>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("ThongKeHoiVien");

            entity.Property(e => e.Gioitinh)
                .HasMaxLength(3)
                .HasColumnName("gioitinh");
            entity.Property(e => e.Trangthai)
                .HasMaxLength(10)
                .IsUnicode(false);
            entity.Property(e => e.TyLePhanTram).HasColumnType("decimal(5, 2)");
        });

        modelBuilder.Entity<ViewDoanhThuGoiTap>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("View_DoanhThuGoiTap");

            entity.Property(e => e.TenGoi).HasMaxLength(50);
        });

        modelBuilder.Entity<ViewHieuSuatHlv>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("View_HieuSuatHLV");

            entity.Property(e => e.Chuyenmon).HasMaxLength(20);
            entity.Property(e => e.LuongCoBan).HasColumnType("money");
            entity.Property(e => e.MaHlv)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("MaHLV");
            entity.Property(e => e.TenDayDu).HasMaxLength(101);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
