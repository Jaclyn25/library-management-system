using Library.Api.Contracts;
using Library.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Library.Api.Services;

public class CirculationService(LibraryDb db, TimeProvider clock, ILogger<CirculationService> logger)
{
    public static LoanView View(Loan x, DateTime now) => new(x.Id, x.BookId, x.Book.Title, x.BorrowerId, x.Borrower.Name,
        x.IssuedAt, x.DueAt, x.ReturnedAt, x.ReturnedAt is null && x.DueAt < now,
        Math.Max(0, (int)Math.Ceiling(((x.ReturnedAt ?? now) - x.DueAt).TotalDays)));

    public async Task<LoanView> Get(int id)
    {
        var loan = await db.Loans.AsNoTracking().Include(x => x.Book).Include(x => x.Borrower).SingleOrDefaultAsync(x => x.Id == id)
            ?? throw new BusinessException(404, "Loan not found.");
        return View(loan, clock.GetUtcNow().UtcDateTime);
    }

    public async Task<Page<LoanView>> Search(int? borrowerId, string? status, int page, int size)
    {
        page = Math.Max(1, page); size = Math.Clamp(size, 1, 100);
        var now = clock.GetUtcNow().UtcDateTime;
        var query = db.Loans.AsNoTracking().Include(x => x.Book).Include(x => x.Borrower).AsQueryable();
        if (borrowerId.HasValue) query = query.Where(x => x.BorrowerId == borrowerId);
        query = status switch { "active" => query.Where(x => x.ReturnedAt == null), "returned" => query.Where(x => x.ReturnedAt != null),
            "overdue" => query.Where(x => x.ReturnedAt == null && x.DueAt < now), _ => query };
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(x => x.IssuedAt).ThenByDescending(x => x.Id).Skip((page - 1) * size).Take(size).ToListAsync();
        return new(items.Select(x => View(x, now)).ToList(), total, page, size);
    }

    public async Task<LoanView> Issue(IssueInput input)
    {
        var now = clock.GetUtcNow().UtcDateTime;
        if (input.OperationId == Guid.Empty) throw new BusinessException(400, "An operation ID is required.");
        if (input.DueAt.Kind != DateTimeKind.Utc || input.DueAt <= now || input.DueAt > now.AddDays(90))
            throw new BusinessException(400, "Due date must be UTC, in the future and within 90 days.");
        if (!await db.Borrowers.AnyAsync(x => x.Id == input.BorrowerId)) throw new BusinessException(404, "Borrower not found.");
        await using var transaction = await db.Database.BeginTransactionAsync();
        // The UPDATE takes a row lock. PostgreSQL rechecks this predicate after competing updates commit.
        var changed = await db.Books.Where(x => x.Id == input.BookId && !x.Archived && x.AvailableCopies > 0)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.AvailableCopies, x => x.AvailableCopies - 1));
        if (changed == 0) throw new BusinessException(409, "This book has no available copies or is archived.");
        var loan = new Loan { BookId = input.BookId, BorrowerId = input.BorrowerId, IssuedAt = now, DueAt = input.DueAt, OperationId = input.OperationId };
        db.Loans.Add(loan);
        // Unique operation and active book/borrower constraints roll back the decrement on duplicates.
        await db.SaveChangesAsync(); await transaction.CommitAsync();
        logger.LogInformation("Issued loan {LoanId} for book {BookId}", loan.Id, loan.BookId);
        return await Get(loan.Id);
    }
}
