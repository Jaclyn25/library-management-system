using Library.Api.Data;
using Library.Api.Infrastructure;
using Library.Api.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole();

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddDbContext<LibraryDb>((services, options) => options.UseNpgsql(
    services.GetRequiredService<IConfiguration>().GetConnectionString("Library")
    ?? throw new InvalidOperationException("Configure ConnectionStrings__Library before using the database.")));
builder.Services.AddScoped<CatalogService>();
builder.Services.AddScoped<BorrowerService>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<CirculationService>();
builder.Services.AddScoped<ReportService>();

var app = builder.Build();
app.UseExceptionHandler();
if (app.Configuration.GetValue<bool>("Database:Migrate")) {
    using var scope = app.Services.CreateScope();
    await scope.ServiceProvider.GetRequiredService<LibraryDb>().Database.MigrateAsync();
    if (app.Configuration.GetValue<bool>("Database:Seed"))
        await SeedData.Initialize(scope.ServiceProvider.GetRequiredService<LibraryDb>());
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet("/api/health", () => Results.Ok(new { status = "healthy" }));

app.MapControllers();

app.Run();

public partial class Program;
