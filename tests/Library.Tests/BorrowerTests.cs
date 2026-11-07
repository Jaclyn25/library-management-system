using System.Net;
using System.Net.Http.Json;
using Library.Api.Contracts;
using Library.Api.Data;

namespace Library.Tests;

public class BorrowerTests(LibraryFixture fixture) : IClassFixture<LibraryFixture>
{
    [Fact] public async Task Register_edit_search_and_reject_duplicate_email()
    {
        var input = new BorrowerInput("Sam Rowan", $"{Guid.NewGuid():N}@example.org", "0123456789");
        var response = await fixture.Client.PostAsJsonAsync("/api/borrowers", input);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var borrower = (await response.Content.ReadFromJsonAsync<Borrower>())!;
        Assert.Equal(HttpStatusCode.Conflict, (await fixture.Client.PostAsJsonAsync("/api/borrowers", input with { Email = input.Email.ToUpperInvariant() })).StatusCode);
        (await fixture.Client.PutAsJsonAsync($"/api/borrowers/{borrower.Id}", input with { Name = "Samira Rowan" })).EnsureSuccessStatusCode();
        var found = await fixture.Client.GetFromJsonAsync<Page<Borrower>>($"/api/borrowers?search={input.Email}");
        Assert.Equal("Samira Rowan", Assert.Single(found!.Items).Name);
    }

    [Fact] public async Task Invalid_email_is_rejected() => Assert.Equal(HttpStatusCode.BadRequest,
        (await fixture.Client.PostAsJsonAsync("/api/borrowers", new BorrowerInput("Sam", "bad-email", ""))).StatusCode);
}
