using System.Net;
using System.Net.Http.Json;
using Library.Api.Contracts;
using Library.Api.Data;
using Library.Api.Services;

namespace Library.Tests;

public class ReturnTests(LibraryFixture fixture) : IClassFixture<LibraryFixture>
{
    [Fact] public async Task Concurrent_returns_restore_exactly_one_copy_and_preserve_history()
    {
        var client = fixture.Client;
        var category = await client.PostAsJsonAsync("/api/categories", new { name = "Return tests" });
        var categoryId = (await category.Content.ReadFromJsonAsync<Category>())!.Id;
        var bookResponse = await client.PostAsJsonAsync("/api/books", new BookInput("Return Journey", "Lena North", "9781234567890", categoryId, 2024, 1));
        var book = (await bookResponse.Content.ReadFromJsonAsync<BookView>())!;
        var borrowerResponse = await client.PostAsJsonAsync("/api/borrowers", new BorrowerInput("Sam Rowan", "sam@example.org", ""));
        var borrower = (await borrowerResponse.Content.ReadFromJsonAsync<Borrower>())!;
        var issued = await client.PostAsJsonAsync("/api/loans", new IssueInput(book.Id, borrower.Id, DateTime.UtcNow.AddDays(14), Guid.NewGuid()));
        var loan = (await issued.Content.ReadFromJsonAsync<LoanView>())!;
        var returns = await Task.WhenAll(Enumerable.Range(0, 8).Select(_ => client.PostAsync($"/api/loans/{loan.Id}/return", null)));
        Assert.Single(returns, x => x.StatusCode == HttpStatusCode.OK);
        Assert.Equal(7, returns.Count(x => x.StatusCode == HttpStatusCode.Conflict));
        Assert.Equal(1, (await client.GetFromJsonAsync<BookView>($"/api/books/{book.Id}"))!.AvailableCopies);
        var history = await client.GetFromJsonAsync<Page<LoanView>>($"/api/loans?borrowerId={borrower.Id}");
        Assert.NotNull(Assert.Single(history!.Items).ReturnedAt);
    }

    [Fact] public void Overdue_calculation_tracks_active_and_late_returned_loans()
    {
        var now = new DateTime(2026, 11, 7, 12, 0, 0, DateTimeKind.Utc);
        var loan = new Loan { Book = new Book { Title = "A" }, Borrower = new Borrower { Name = "B" }, IssuedAt = now.AddDays(-20), DueAt = now.AddDays(-2).AddHours(-1) };
        var active = CirculationService.View(loan, now);
        Assert.True(active.IsOverdue); Assert.Equal(3, active.OverdueDays);
        loan.ReturnedAt = now;
        var returned = CirculationService.View(loan, now.AddDays(10));
        Assert.False(returned.IsOverdue); Assert.Equal(3, returned.OverdueDays);
        loan.DueAt = now.AddDays(1); loan.ReturnedAt = null;
        Assert.Equal(0, CirculationService.View(loan, now).OverdueDays);
        loan.DueAt = now;
        Assert.False(CirculationService.View(loan, now).IsOverdue);
    }
}
