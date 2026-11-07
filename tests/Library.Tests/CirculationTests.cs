using System.Net;
using System.Net.Http.Json;
using Library.Api.Contracts;
using Library.Api.Data;

namespace Library.Tests;

public class CirculationTests(LibraryFixture fixture) : IClassFixture<LibraryFixture>
{
    private HttpClient Client => fixture.Client;
    private async Task<(BookView, Borrower)> Setup(int copies = 1)
    {
        var category = await Client.PostAsJsonAsync("/api/categories", new { name = Guid.NewGuid().ToString("N") });
        var categoryId = (await category.Content.ReadFromJsonAsync<Category>())!.Id;
        var book = await Client.PostAsJsonAsync("/api/books", new BookInput("Moon Atlas", "Lena North", Random.Shared.NextInt64(1000000000000, 9999999999999).ToString(), categoryId, 2024, copies));
        var borrower = await Client.PostAsJsonAsync("/api/borrowers", new BorrowerInput("Alex Reed", $"{Guid.NewGuid():N}@example.org", ""));
        return ((await book.Content.ReadFromJsonAsync<BookView>())!, (await borrower.Content.ReadFromJsonAsync<Borrower>())!);
    }
    private IssueInput Input(BookView book, Borrower borrower) => new(book.Id, borrower.Id, DateTime.UtcNow.AddDays(14), Guid.NewGuid());

    [Fact] public async Task Issue_available_book_and_reject_unavailable_without_negative_stock()
    {
        var (book, borrower) = await Setup();
        var issued = await Client.PostAsJsonAsync("/api/loans", Input(book, borrower));
        Assert.Equal(HttpStatusCode.Created, issued.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await Client.PostAsJsonAsync("/api/loans", Input(book, borrower))).StatusCode);
        Assert.Equal(0, (await Client.GetFromJsonAsync<BookView>($"/api/books/{book.Id}"))!.AvailableCopies);
        Assert.Equal(HttpStatusCode.Conflict, (await Client.DeleteAsync($"/api/books/{book.Id}")).StatusCode);
        var history = await Client.GetFromJsonAsync<Page<LoanView>>($"/api/loans?borrowerId={borrower.Id}");
        Assert.Single(history!.Items);
    }

    [Fact] public async Task Concurrent_requests_can_issue_only_the_last_copy()
    {
        var (book, borrower) = await Setup();
        var requests = Enumerable.Range(0, 12).Select(_ => Client.PostAsJsonAsync("/api/loans", Input(book, borrower)));
        var responses = await Task.WhenAll(requests);
        Assert.Single(responses, x => x.StatusCode == HttpStatusCode.Created);
        Assert.Equal(11, responses.Count(x => x.StatusCode == HttpStatusCode.Conflict));
        Assert.Equal(0, (await Client.GetFromJsonAsync<BookView>($"/api/books/{book.Id}"))!.AvailableCopies);
    }

    [Fact] public async Task Duplicate_operation_rolls_back_stock_and_invalid_due_is_rejected()
    {
        var (book, borrower) = await Setup(3); var input = Input(book, borrower);
        (await Client.PostAsJsonAsync("/api/loans", input)).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Conflict, (await Client.PostAsJsonAsync("/api/loans", input)).StatusCode);
        Assert.Equal(2, (await Client.GetFromJsonAsync<BookView>($"/api/books/{book.Id}"))!.AvailableCopies);
        Assert.Equal(HttpStatusCode.BadRequest, (await Client.PostAsJsonAsync("/api/loans", input with { DueAt = DateTime.UtcNow.AddDays(-1) })).StatusCode);
    }
}
