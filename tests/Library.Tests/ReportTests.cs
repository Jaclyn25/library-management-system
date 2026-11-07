using System.Net.Http.Json;
using System.Text.Json;
using Library.Api.Contracts;
using Library.Api.Data;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;

namespace Library.Tests;

public class ReportTests(LibraryFixture fixture) : IClassFixture<LibraryFixture>
{
    [Fact] public async Task Totals_category_breakdown_and_overdue_are_correct()
    {
        var now = DateTime.UtcNow;
        using (var scope = fixture.Factory.Services.CreateScope()) {
            var db = scope.ServiceProvider.GetRequiredService<LibraryDb>();
            var category = new Category { Name = "Science" };
            var book = new Book { Title = "Sky Atlas", Author = "Nora Vale", Isbn = "9781234567890", Category = category, PublicationYear = 2024, TotalCopies = 5, AvailableCopies = 4 };
            var borrower = new Borrower { Name = "Sam Rowan", Email = "sam@example.org" };
            db.Loans.Add(new Loan { Book = book, Borrower = borrower, IssuedAt = now.AddDays(-20), DueAt = now.AddDays(-2), OperationId = Guid.NewGuid() });
            await db.SaveChangesAsync();
        }
        var report = await fixture.Client.GetFromJsonAsync<JsonElement>("/api/reports");
        Assert.Equal(1, report.GetProperty("titles").GetInt32());
        Assert.Equal(5, report.GetProperty("totalBooks").GetInt32());
        Assert.Equal(4, report.GetProperty("availableBooks").GetInt32());
        Assert.Equal(1, report.GetProperty("borrowedBooks").GetInt32());
        Assert.Equal(1, report.GetProperty("overdueBooks").GetInt32());
        Assert.Equal("Science", report.GetProperty("categories")[0].GetProperty("name").GetString());
        Assert.Equal(6, report.GetProperty("monthly").GetArrayLength());
        var loan = Assert.Single((await fixture.Client.GetFromJsonAsync<Page<LoanView>>("/api/loans?status=overdue"))!.Items);
        (await fixture.Client.PostAsync($"/api/loans/{loan.Id}/return", null)).EnsureSuccessStatusCode();
        var after = await fixture.Client.GetFromJsonAsync<JsonElement>("/api/reports");
        Assert.Equal(5, after.GetProperty("availableBooks").GetInt32());
        Assert.Equal(0, after.GetProperty("overdueBooks").GetInt32());
        Assert.Equal(0, after.GetProperty("borrowedBooks").GetInt32());
    }

    [Fact] public async Task Fictional_seed_is_repeatable_and_stock_matches_active_loans()
    {
        // This test uses its own database to avoid any dependency on the totals scenario.
        await using var isolated = new LibraryFixture(); await isolated.InitializeAsync();
        using var scope = isolated.Factory.Services.CreateScope(); var db = scope.ServiceProvider.GetRequiredService<LibraryDb>();
        await SeedData.Initialize(db); await SeedData.Initialize(db);
        Assert.Equal(18, await db.Books.CountAsync()); Assert.Equal(12, await db.Borrowers.CountAsync());
        Assert.Equal(42, await db.Loans.CountAsync());
        Assert.Equal(await db.Loans.CountAsync(x => x.ReturnedAt == null), await db.Books.SumAsync(x => x.TotalCopies - x.AvailableCopies));
    }
}
