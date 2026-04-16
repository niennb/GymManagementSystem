using Microsoft.EntityFrameworkCore;
using GymAPI.Models; // Thêm dòng này

var builder = WebApplication.CreateBuilder(args);

// Thêm các dịch vụ
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ĐĂNG KÝ CONTEXT TẠI ĐÂY
builder.Services.AddDbContext<QlPhonggymContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// CẤU HÌNH CORS (Để React gọi được API)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy => policy.WithOrigins("http://localhost:3000")
                        .AllowAnyHeader()
                        .AllowAnyMethod());

    
});


var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReactApp"); // Kích hoạt CORS
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();
