using Microsoft.EntityFrameworkCore;

namespace Library.Api.Data;

public class Book
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string Author { get; set; } = "";
    public string Isbn { get; set; } = "";
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public int PublicationYear { get; set; }
    public int TotalCopies { get; set; }
    public int AvailableCopies { get; set; }
    public bool Archived { get; set; }
}

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
}

public class Borrower
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
}

public class Loan
{
    public int Id { get; set; }
    public int BookId { get; set; }
    public Book Book { get; set; } = null!;
    public int BorrowerId { get; set; }
    public Borrower Borrower { get; set; } = null!;
    public DateTime IssuedAt { get; set; }
    public DateTime DueAt { get; set; }
    public DateTime? ReturnedAt { get; set; }
    public Guid OperationId { get; set; }
}

public class LibraryDb(DbContextOptions<LibraryDb> options) : DbContext(options)
{
    public DbSet<Book> Books => Set<Book>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Borrower> Borrowers => Set<Borrower>();
    public DbSet<Loan> Loans => Set<Loan>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        model.Entity<Loan>(e => {
            e.HasOne(x => x.Book).WithMany().OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Borrower).WithMany().OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.OperationId).IsUnique();
            e.HasIndex(x => new { x.BookId, x.BorrowerId }).IsUnique().HasFilter("\"ReturnedAt\" IS NULL");
            e.HasIndex(x => x.DueAt);
            e.ToTable(t => {
                t.HasCheckConstraint("CK_Loan_Due", "\"DueAt\" > \"IssuedAt\"");
                t.HasCheckConstraint("CK_Loan_Return", "\"ReturnedAt\" IS NULL OR \"ReturnedAt\" >= \"IssuedAt\"");
            });
        });
        model.Entity<Borrower>(e => {
            e.Property(x => x.Name).HasMaxLength(160);
            e.Property(x => x.Email).HasMaxLength(254);
            e.Property(x => x.Phone).HasMaxLength(30);
            e.HasIndex(x => x.Email).IsUnique();
        });
        model.Entity<Category>(e => {
            e.Property(x => x.Name).HasMaxLength(80);
            e.HasIndex(x => x.Name).IsUnique();
        });
        model.Entity<Book>(e => {
            e.Property(x => x.Title).HasMaxLength(200);
            e.Property(x => x.Author).HasMaxLength(160);
            e.Property(x => x.Isbn).HasMaxLength(13);
            e.HasIndex(x => x.Isbn).IsUnique();
            e.HasOne(x => x.Category).WithMany().OnDelete(DeleteBehavior.Restrict);
            e.ToTable(t => {
                t.HasCheckConstraint("CK_Book_Copies", "\"TotalCopies\" >= 1 AND \"AvailableCopies\" >= 0 AND \"AvailableCopies\" <= \"TotalCopies\"");
                t.HasCheckConstraint("CK_Book_Year", "\"PublicationYear\" BETWEEN 1450 AND 2200");
            });
        });
    }
}
