using Library.Api.Contracts;
using Library.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Library.Api.Services;

public class CatalogService(LibraryDb db)
{
    public async Task<Page<BookView>> Search(string? search, int? categoryId, bool? available, int page, int size)
    {
        page = Math.Max(1, page); size = Math.Clamp(size, 1, 100);
        var query = db.Books.AsNoTracking().Where(x => !x.Archived);
        if (!string.IsNullOrWhiteSpace(search)) {
            var term = search.Trim().ToLower();
            query = query.Where(x => x.Title.ToLower().Contains(term) || x.Author.ToLower().Contains(term) || x.Isbn.Contains(term));
        }
        if (categoryId.HasValue) query = query.Where(x => x.CategoryId == categoryId);
        if (available.HasValue) query = query.Where(x => available.Value ? x.AvailableCopies > 0 : x.AvailableCopies == 0);
        var count = await query.CountAsync();
        var items = await query.OrderBy(x => x.Title).ThenBy(x => x.Id).Skip((page - 1) * size).Take(size)
            .Select(x => new BookView(x.Id, x.Title, x.Author, x.Isbn, x.CategoryId, x.Category.Name, x.PublicationYear, x.TotalCopies, x.AvailableCopies, x.Archived)).ToListAsync();
        return new(items, count, page, size);
    }

    public async Task<BookView> Get(int id) => await db.Books.AsNoTracking().Where(x => x.Id == id)
        .Select(x => new BookView(x.Id, x.Title, x.Author, x.Isbn, x.CategoryId, x.Category.Name, x.PublicationYear, x.TotalCopies, x.AvailableCopies, x.Archived))
        .SingleOrDefaultAsync() ?? throw new BusinessException(404, "Book not found.");

    public async Task<BookView> Save(int? id, BookInput input)
    {
        if (string.IsNullOrWhiteSpace(input.Title) || string.IsNullOrWhiteSpace(input.Author))
            throw new BusinessException(400, "Title and author cannot be blank.");
        if (input.PublicationYear > DateTime.UtcNow.Year + 1) throw new BusinessException(400, "Publication year cannot be in the future.");
        if (!await db.Categories.AnyAsync(x => x.Id == input.CategoryId)) throw new BusinessException(400, "Choose an existing category.");
        if (id is null) {
            var book = new Book { Title = input.Title.Trim(), Author = input.Author.Trim(), Isbn = input.Isbn,
                CategoryId = input.CategoryId, PublicationYear = input.PublicationYear, TotalCopies = input.TotalCopies, AvailableCopies = input.TotalCopies };
            db.Books.Add(book);
            await db.SaveChangesAsync();
            return await Get(book.Id);
        }
        // Arithmetic stays in PostgreSQL so issuing, returning and stock edits serialize on the same row.
        var changed = await db.Books.Where(x => x.Id == id && !x.Archived && x.TotalCopies - x.AvailableCopies <= input.TotalCopies)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.Title, input.Title.Trim()).SetProperty(x => x.Author, input.Author.Trim())
                .SetProperty(x => x.Isbn, input.Isbn).SetProperty(x => x.CategoryId, input.CategoryId)
                .SetProperty(x => x.PublicationYear, input.PublicationYear)
                .SetProperty(x => x.AvailableCopies, x => x.AvailableCopies + input.TotalCopies - x.TotalCopies)
                .SetProperty(x => x.TotalCopies, input.TotalCopies));
        if (changed == 0) throw new BusinessException(409, "Book is archived, missing, or the new stock is below the number on loan.");
        return await Get(id.Value);
    }

    public async Task Archive(int id)
    {
        var changed = await db.Books.Where(x => x.Id == id && !x.Archived && x.AvailableCopies == x.TotalCopies)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.Archived, true));
        if (changed == 0) throw new BusinessException(409, "Only an active book with no outstanding loans can be archived.");
    }

    public Task<List<Category>> Categories() => db.Categories.AsNoTracking().OrderBy(x => x.Name).ToListAsync();

    public async Task<Category> SaveCategory(int? id, CategoryInput input)
    {
        if (string.IsNullOrWhiteSpace(input.Name)) throw new BusinessException(400, "Category name cannot be blank.");
        var category = id is null ? new Category() : await db.Categories.FindAsync(id) ?? throw new BusinessException(404, "Category not found.");
        category.Name = input.Name.Trim();
        if (id is null) db.Categories.Add(category);
        await db.SaveChangesAsync();
        return category;
    }

    public async Task DeleteCategory(int id)
    {
        if (await db.Books.AnyAsync(x => x.CategoryId == id)) throw new BusinessException(409, "This category is used by books, including archived titles.");
        var category = await db.Categories.FindAsync(id) ?? throw new BusinessException(404, "Category not found.");
        db.Categories.Remove(category); await db.SaveChangesAsync();
    }
}
