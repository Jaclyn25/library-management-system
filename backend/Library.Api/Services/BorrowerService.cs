using Library.Api.Contracts;
using Library.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Library.Api.Services;

public class BorrowerService(LibraryDb db)
{
    public async Task<Page<Borrower>> Search(string? search, int page, int size)
    {
        page = Math.Max(1, page); size = Math.Clamp(size, 1, 100);
        var query = db.Borrowers.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search)) {
            var term = search.Trim().ToLower();
            query = query.Where(x => x.Name.ToLower().Contains(term) || x.Email.Contains(term));
        }
        return new(await query.OrderBy(x => x.Name).ThenBy(x => x.Id).Skip((page - 1) * size).Take(size).ToListAsync(), await query.CountAsync(), page, size);
    }

    public async Task<Borrower> Get(int id) => await db.Borrowers.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id)
        ?? throw new BusinessException(404, "Borrower not found.");

    public async Task<Borrower> Save(int? id, BorrowerInput input)
    {
        if (string.IsNullOrWhiteSpace(input.Name)) throw new BusinessException(400, "Borrower name cannot be blank.");
        var borrower = id is null ? new Borrower() : await db.Borrowers.FindAsync(id) ?? throw new BusinessException(404, "Borrower not found.");
        borrower.Name = input.Name.Trim(); borrower.Email = input.Email.Trim().ToLowerInvariant(); borrower.Phone = input.Phone?.Trim() ?? "";
        if (id is null) db.Borrowers.Add(borrower);
        await db.SaveChangesAsync(); return borrower;
    }
}
