using Library.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace Library.Tests;

public class LibraryFixture : IAsyncLifetime
{
    private readonly string database = "library_test_" + Guid.NewGuid().ToString("N");
    private readonly string admin = Environment.GetEnvironmentVariable("LIBRARY_TEST_CONNECTION")
        ?? throw new InvalidOperationException("Set LIBRARY_TEST_CONNECTION to a PostgreSQL connection with CREATEDB permission. Run scripts/test.ps1 locally.");
    public WebApplicationFactory<Program> Factory { get; private set; } = null!;
    public HttpClient Client { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        await using var connection = new NpgsqlConnection(admin);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand($"CREATE DATABASE \"{database}\"", connection);
        await command.ExecuteNonQueryAsync();
        var builder = new NpgsqlConnectionStringBuilder(admin) { Database = database };
        Factory = new WebApplicationFactory<Program>().WithWebHostBuilder(web => web.ConfigureAppConfiguration((_, config) =>
            config.AddInMemoryCollection(new Dictionary<string, string?> { ["ConnectionStrings:Library"] = builder.ConnectionString, ["Database:Migrate"] = "false" })));
        using var scope = Factory.Services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<LibraryDb>().Database.MigrateAsync();
        Client = Factory.CreateClient();
    }

    public async Task DisposeAsync()
    {
        Client.Dispose(); await Factory.DisposeAsync(); NpgsqlConnection.ClearAllPools();
        await using var connection = new NpgsqlConnection(admin);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand($"DROP DATABASE \"{database}\" WITH (FORCE)", connection);
        await command.ExecuteNonQueryAsync();
    }
}
