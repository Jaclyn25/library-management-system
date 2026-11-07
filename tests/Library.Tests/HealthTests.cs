using Microsoft.AspNetCore.Mvc.Testing;

namespace Library.Tests;

public class HealthTests
{
    [Fact]
    public async Task Health_endpoint_is_available()
    {
        await using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();
        var response = await client.GetAsync("/api/health");
        response.EnsureSuccessStatusCode();
        Assert.Contains("healthy", await response.Content.ReadAsStringAsync());
    }
}
