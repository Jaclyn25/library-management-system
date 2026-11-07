using Library.Api.Infrastructure;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Library.Tests;

public class DatabaseConfigurationTests
{
    [Fact] public void Runtime_environment_configuration_roundtrips_special_characters_safely()
    {
        var generated = Guid.NewGuid().ToString("N") + ";= special";
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> {
            ["POSTGRES_PASSWORD"] = generated, ["POSTGRES_DB"] = "library", ["POSTGRES_USER"] = "library",
            ["Database:Host"] = "db", ["Database:Port"] = "5432"
        }).Build();
        var parsed = new NpgsqlConnectionStringBuilder(DatabaseConfiguration.Resolve(config));
        Assert.Equal(generated, parsed.Password); Assert.Equal("db", parsed.Host);
        Assert.Equal("library", parsed.Database);
        Assert.Equal(GssEncryptionMode.Disable, parsed.GssEncryptionMode);
    }

    [Fact] public void Missing_database_credentials_fail_with_actionable_configuration_error()
    {
        var config = new ConfigurationBuilder().Build();
        var error = Assert.Throws<InvalidOperationException>(() => DatabaseConfiguration.Resolve(config));
        Assert.Contains("ConnectionStrings__Library", error.Message);
    }
}
