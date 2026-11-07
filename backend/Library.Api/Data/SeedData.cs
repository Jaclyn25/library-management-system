using Microsoft.EntityFrameworkCore;

namespace Library.Api.Data;

public static class SeedData
{
    public static async Task Initialize(LibraryDb db)
    {
        await using var transaction = await db.Database.BeginTransactionAsync();
        // Advisory lock serializes optional seeding if two development instances start together.
        await db.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(731902)");
        if (await db.Books.AnyAsync() || await db.Categories.AnyAsync() || await db.Borrowers.AnyAsync()) return;
        var categories = new[] { "Fiction", "Science & nature", "Technology", "History", "Arts & culture", "Personal growth" }.Select(n => new Category { Name = n }).ToArray();
        db.Categories.AddRange(categories);
        var titles = new[] { ("The Midnight Orchard", "Clara West", 0), ("A Map of Small Wonders", "Oliver Reed", 1), ("Designing Tomorrow", "Nora Bennett", 2), ("Letters from Alexandria", "Amir Saleh", 3), ("The Art of Looking", "Iris Morgan", 4), ("A Quiet Kind of Progress", "Theo Lane", 5), ("The Last Lighthouse", "Maya Ellis", 0), ("Under a Wider Sky", "Leila North", 1), ("Practical Systems", "Jonah Park", 2), ("Cities We Remember", "Eva Laurent", 3), ("Color and Conversation", "Ada Brooks", 4), ("Notes for a Better Day", "Sam Rivera", 5), ("The River House", "Elena Vale", 0), ("Field Notes on Earth", "Noah Finch", 1), ("Patterns in Practice", "Mina Shah", 2), ("Across the Old Harbor", "Omar Reed", 3), ("Ways of Making", "Lena Hart", 4), ("The Patient Path", "Sara Quinn", 5) };
        var books = titles.Select((t, i) => new Book { Title = t.Item1, Author = t.Item2, Category = categories[t.Item3], Isbn = (9780000000000L + i).ToString(), PublicationYear = 2018 + i % 8, TotalCopies = 3 + i % 5, AvailableCopies = 3 + i % 5 }).ToArray();
        db.Books.AddRange(books);
        var names = new[] { "Mariam Hassan", "James Rowan", "Nadia Farouk", "Alex Morgan", "Sofia Bennett", "Adam Noor", "Lina Carter", "Owen Brooks", "Yara Salem", "Maya Collins", "Elias Hart", "Sara Finch" };
        var now = DateTime.UtcNow;
        var borrowers = names.Select((n, i) => new Borrower { Name = n, Email = $"reader{i + 1}@example.org", Phone = "", RegisteredAt = now.AddDays(-120 - i * 3) }).ToArray();
        db.Borrowers.AddRange(borrowers);
        for (var i = 0; i < 42; i++) {
            var returned = i < 30;
            var issued = returned ? now.AddDays(-150 + i * 4) : now.AddDays(-22 + (i - 30) * 2);
            var book = books[i % books.Length];
            db.Loans.Add(new Loan { Book = book, Borrower = borrowers[i % borrowers.Length], IssuedAt = issued, DueAt = issued.AddDays(14), ReturnedAt = returned ? issued.AddDays(10 + i % 8) : null, OperationId = Guid.NewGuid() });
            if (!returned) book.AvailableCopies--;
        }
        await db.SaveChangesAsync(); await transaction.CommitAsync();
    }
}
