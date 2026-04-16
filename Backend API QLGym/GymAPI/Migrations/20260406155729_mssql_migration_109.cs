using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GymAPI.Migrations
{
    /// <inheritdoc />
    public partial class mssql_migration_109 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CoSoVatChat",
                columns: table => new
                {
                    MaSP = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: false),
                    TenSP = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    NgayNhap = table.Column<DateOnly>(type: "date", nullable: true),
                    SoLuongCSVC = table.Column<int>(type: "int", nullable: true),
                    TinhTrangCSVC = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "Hoạt động")
                        .Annotation("Relational:DefaultConstraintName", "TinhTrangDefault"),
                    ChiPhiMua = table.Column<double>(type: "float", nullable: true),
                    ChiPhiBaoTri = table.Column<double>(type: "float", nullable: true),
                    NgayHetHanBaoHanh = table.Column<DateOnly>(type: "date", nullable: true),
                    NgayBaoTriCuoi = table.Column<DateOnly>(type: "date", nullable: true),
                    ChiTietBaoTri = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("MaSP_PK", x => x.MaSP);
                });

            migrationBuilder.CreateTable(
                name: "GoiTap",
                columns: table => new
                {
                    MaGoiTap = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: false),
                    TenGoi = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    LoaiGoitap = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    GiaTien = table.Column<decimal>(type: "money", nullable: true),
                    thoihan = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("MaGoiTap_PK", x => x.MaGoiTap);
                });

            migrationBuilder.CreateTable(
                name: "HLV",
                columns: table => new
                {
                    MaHLV = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: false),
                    TenHLV = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Chuyenmon = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    SDTHLV = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: true),
                    Luong = table.Column<decimal>(type: "money", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("maHLV_PK", x => x.MaHLV);
                });

            migrationBuilder.CreateTable(
                name: "HoiVien",
                columns: table => new
                {
                    maHV = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: false),
                    ten = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    sdt = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: true),
                    email = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    gioitinh = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: true),
                    ngaysinh = table.Column<DateOnly>(type: "date", nullable: true),
                    Trangthai = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: true, defaultValue: "Locked")
                        .Annotation("Relational:DefaultConstraintName", "Trangthai_Default")
                },
                constraints: table =>
                {
                    table.PrimaryKey("maHV_PK", x => x.maHV);
                });

            migrationBuilder.CreateTable(
                name: "NhanVien",
                columns: table => new
                {
                    maNV = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: false),
                    tenDN = table.Column<string>(type: "char(50)", unicode: false, fixedLength: true, maxLength: 50, nullable: true),
                    matkhau = table.Column<string>(type: "char(50)", unicode: false, fixedLength: true, maxLength: 50, nullable: true),
                    HovaTenNV = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    chucvu = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    SDTNV = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: true),
                    emailNV = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    NgaySinhNV = table.Column<DateOnly>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("maNV_PK", x => x.maNV);
                });

            migrationBuilder.CreateTable(
                name: "HopDong",
                columns: table => new
                {
                    MaHD = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: false),
                    maHV = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: true),
                    MaGoiTap = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: true),
                    NgayBD = table.Column<DateOnly>(type: "date", nullable: true),
                    NgayKT = table.Column<DateOnly>(type: "date", nullable: true),
                    SoLuong = table.Column<int>(type: "int", nullable: true, defaultValue: 1)
                        .Annotation("Relational:DefaultConstraintName", "SoLuong_Default"),
                    TrangThaiHD = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: true, defaultValue: "Locked")
                        .Annotation("Relational:DefaultConstraintName", "TrangThaiHD_Default")
                },
                constraints: table =>
                {
                    table.PrimaryKey("MaHD_PK", x => x.MaHD);
                    table.ForeignKey(
                        name: "maGoi_FK",
                        column: x => x.MaGoiTap,
                        principalTable: "GoiTap",
                        principalColumn: "MaGoiTap");
                    table.ForeignKey(
                        name: "maHV_FK",
                        column: x => x.maHV,
                        principalTable: "HoiVien",
                        principalColumn: "maHV");
                });

            migrationBuilder.CreateTable(
                name: "LichTap",
                columns: table => new
                {
                    MaLich = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: false),
                    maHV = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: true),
                    MaHLV = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: true),
                    NgayTap = table.Column<DateOnly>(type: "date", nullable: false),
                    KhungGioTap = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    GhiChu = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("MaLich_PK", x => x.MaLich);
                    table.ForeignKey(
                        name: "maHLV_FK_LichTap",
                        column: x => x.MaHLV,
                        principalTable: "HLV",
                        principalColumn: "MaHLV");
                    table.ForeignKey(
                        name: "maHV_FK_Lichtap",
                        column: x => x.maHV,
                        principalTable: "HoiVien",
                        principalColumn: "maHV");
                });

            migrationBuilder.CreateTable(
                name: "LichSuXuatBaoCao",
                columns: table => new
                {
                    MaBaoCao = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenBaoCao = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    NguoiXuat = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: true),
                    NgayXuat = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    NoiDungTomTat = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__LichSuXu__25A9188C1016F31F", x => x.MaBaoCao);
                    table.ForeignKey(
                        name: "FK_NhanVienBaoCao",
                        column: x => x.NguoiXuat,
                        principalTable: "NhanVien",
                        principalColumn: "maNV");
                });

            migrationBuilder.CreateTable(
                name: "Hoadon",
                columns: table => new
                {
                    MaHoaDon = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: false),
                    MaHD = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: true),
                    NgayThanhToan = table.Column<DateOnly>(type: "date", nullable: true, defaultValueSql: "(getdate())")
                        .Annotation("Relational:DefaultConstraintName", "NgayThanhToan_Default"),
                    SoLuongHoaDon = table.Column<int>(type: "int", nullable: true),
                    PhuongThucTT = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    SoTien = table.Column<decimal>(type: "money", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("MaHoaDon_PK", x => x.MaHoaDon);
                    table.ForeignKey(
                        name: "MaHD_FK",
                        column: x => x.MaHD,
                        principalTable: "HopDong",
                        principalColumn: "MaHD");
                });

            migrationBuilder.CreateIndex(
                name: "SDTHLV_Unique",
                table: "HLV",
                column: "SDTHLV",
                unique: true,
                filter: "[SDTHLV] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Hoadon_MaHD",
                table: "Hoadon",
                column: "MaHD");

            migrationBuilder.CreateIndex(
                name: "emailhv_unique",
                table: "HoiVien",
                column: "email",
                unique: true,
                filter: "[email] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "UQ__HoiVien__DDDFB4830A93463B",
                table: "HoiVien",
                column: "sdt",
                unique: true,
                filter: "[sdt] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_HopDong_MaGoiTap",
                table: "HopDong",
                column: "MaGoiTap");

            migrationBuilder.CreateIndex(
                name: "IX_HopDong_maHV",
                table: "HopDong",
                column: "maHV");

            migrationBuilder.CreateIndex(
                name: "IX_LichSuXuatBaoCao_NguoiXuat",
                table: "LichSuXuatBaoCao",
                column: "NguoiXuat");

            migrationBuilder.CreateIndex(
                name: "IX_LichTap_MaHLV",
                table: "LichTap",
                column: "MaHLV");

            migrationBuilder.CreateIndex(
                name: "IX_LichTap_maHV",
                table: "LichTap",
                column: "maHV");

            migrationBuilder.CreateIndex(
                name: "email_Unique",
                table: "NhanVien",
                column: "emailNV",
                unique: true,
                filter: "[emailNV] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "SDT_Unique",
                table: "NhanVien",
                column: "SDTNV",
                unique: true,
                filter: "[SDTNV] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "tenDN_UNIque",
                table: "NhanVien",
                column: "tenDN",
                unique: true,
                filter: "[tenDN] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CoSoVatChat");

            migrationBuilder.DropTable(
                name: "Hoadon");

            migrationBuilder.DropTable(
                name: "LichSuXuatBaoCao");

            migrationBuilder.DropTable(
                name: "LichTap");

            migrationBuilder.DropTable(
                name: "HopDong");

            migrationBuilder.DropTable(
                name: "NhanVien");

            migrationBuilder.DropTable(
                name: "HLV");

            migrationBuilder.DropTable(
                name: "GoiTap");

            migrationBuilder.DropTable(
                name: "HoiVien");
        }
    }
}
