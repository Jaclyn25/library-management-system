using System.Data;
using Library.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Library.Api.Services;

public class ReportService(LibraryDb db, TimeProvider clock)
{
    public async Task<object> Summary()
    {
        var now = clock.GetUtcNow().UtcDateTime;
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.RepeatableRead);
        var books = db.Books.AsNoTracking().Where(x => !x.Archived);
        var titles = await books.CountAsync();
        var total = await books.SumAsync(x => (int?)x.TotalCopies) ?? 0;
        var available = await books.SumAsync(x => (int?)x.AvailableCopies) ?? 0;
        var borrowed = await db.Loans.CountAsync(x => x.ReturnedAt == null);
        var overdue = await db.Loans.CountAsync(x => x.ReturnedAt == null && x.DueAt < now);
        var borrowers = await db.Borrowers.CountAsync();
        var categories = await books.GroupBy(x => x.Category.Name).Select(g => new { Name = g.Key, Total = g.Sum(x => x.TotalCopies), Available = g.Sum(x => x.AvailableCopies) }).OrderBy(x => x.Name).ToListAsync();
        var start = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-5);
        var activity = await db.Loans.Where(x => x.IssuedAt >= start).GroupBy(x => new { x.IssuedAt.Year, x.IssuedAt.Month }).Select(g => new { g.Key.Year, g.Key.Month, Count = g.Count() }).ToListAsync();
        var monthly = Enumerable.Range(0, 6).Select(i => start.AddMonths(i)).Select(d => new { Month = d.ToString("MMM", System.Globalization.CultureInfo.InvariantCulture), Loans = activity.SingleOrDefault(x => x.Year == d.Year && x.Month == d.Month)?.Count ?? 0 });
        var recent = await db.Loans.AsNoTracking().Include(x => x.Book).Include(x => x.Borrower).OrderByDescending(x => x.IssuedAt).ThenByDescending(x => x.Id).Take(5).ToListAsync();
        var late = await db.Loans.AsNoTracking().Include(x => x.Book).Include(x => x.Borrower).Where(x => x.ReturnedAt == null && x.DueAt < now).OrderBy(x => x.DueAt).Take(3).ToListAsync();
        await transaction.CommitAsync();
        return new { Titles = titles, TotalBooks = total, AvailableBooks = available, BorrowedBooks = borrowed,
            OverdueBooks = overdue, Borrowers = borrowers, Categories = categories, Monthly = monthly,
            Recent = recent.Select(x => CirculationService.View(x, now)), Overdue = late.Select(x => CirculationService.View(x, now)) };
    }
}
