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

public class LibraryDb(DbContextOptions<LibraryDb> options) : DbContext(options)
{
    public DbSet<Book> Books => Set<Book>();
    public DbSet<Category> Categories => Set<Category>();

    protected override void OnModelCreating(ModelBuilder model)
    {
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
