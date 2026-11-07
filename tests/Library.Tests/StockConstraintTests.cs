using System.Net;
using System.Net.Http.Json;
using Library.Api.Contracts;
using Library.Api.Data;

namespace Library.Tests;

public class StockConstraintTests(LibraryFixture fixture) : IClassFixture<LibraryFixture>
{
    [Fact] public async Task Distinct_readers_racing_for_two_copies_cannot_overborrow_or_reduce_borrowed_stock()
    {
        var client = fixture.Client;
        var categoryResponse = await client.PostAsJsonAsync("/api/categories", new { name = "Concurrency" });
        var category = (await categoryResponse.Content.ReadFromJsonAsync<Category>())!;
        var input = new BookInput("Shared Shelf", "Ada Lane", "9781234500001", category.Id, 2024, 2);
        var created = await client.PostAsJsonAsync("/api/books", input);
        var book = (await created.Content.ReadFromJsonAsync<BookView>())!;
        var readers = new List<Borrower>();
        for (var i = 0; i < 10; i++) {
            var response = await client.PostAsJsonAsync("/api/borrowers", new BorrowerInput($"Reader {i}", $"reader{i}@example.org", ""));
            readers.Add((await response.Content.ReadFromJsonAsync<Borrower>())!);
        }
        var responses = await Task.WhenAll(readers.Select(b => client.PostAsJsonAsync("/api/loans", new IssueInput(book.Id, b.Id, DateTime.UtcNow.AddDays(14), Guid.NewGuid()))));
        Assert.Equal(2, responses.Count(x => x.StatusCode == HttpStatusCode.Created));
        Assert.Equal(8, responses.Count(x => x.StatusCode == HttpStatusCode.Conflict));
        Assert.Equal(0, (await client.GetFromJsonAsync<BookView>($"/api/books/{book.Id}"))!.AvailableCopies);
        Assert.Equal(HttpStatusCode.Conflict, (await client.PutAsJsonAsync($"/api/books/{book.Id}", input with { TotalCopies = 1 })).StatusCode);
        var changed = await client.PutAsJsonAsync($"/api/books/{book.Id}", input with { TotalCopies = 4 });
        Assert.Equal(2, (await changed.Content.ReadFromJsonAsync<BookView>())!.AvailableCopies);
    }
}
