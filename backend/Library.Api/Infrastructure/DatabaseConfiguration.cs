using Npgsql;

namespace Library.Api.Infrastructure;

public static class DatabaseConfiguration
{
    public static string Resolve(IConfiguration configuration)
    {
        var explicitConnection = configuration.GetConnectionString("Library");
        if (!string.IsNullOrWhiteSpace(explicitConnection)) return explicitConnection;
        var password = configuration["POSTGRES_PASSWORD"];
        if (string.IsNullOrWhiteSpace(password))
            throw new InvalidOperationException("Configure ConnectionStrings__Library or the PostgreSQL environment variables.");
        return new NpgsqlConnectionStringBuilder {
            Host = configuration["Database:Host"] ?? "localhost",
            Port = configuration.GetValue("Database:Port", 5432),
            Database = configuration["POSTGRES_DB"] ?? "library",
            Username = configuration["POSTGRES_USER"] ?? "library",
            Password = password,
            // The documented local stack uses password authentication, without Kerberos.
            GssEncryptionMode = GssEncryptionMode.Disable
        }.ConnectionString;
    }
}
