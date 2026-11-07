using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Library.Api.Data;

public class DesignTimeFactory : IDesignTimeDbContextFactory<LibraryDb>
{
    public LibraryDb CreateDbContext(string[] args) => new(new DbContextOptionsBuilder<LibraryDb>()
        .UseNpgsql(Environment.GetEnvironmentVariable("ConnectionStrings__Library") ?? "Host=localhost;Database=library")
        .Options);
}
