using System.ComponentModel.DataAnnotations;

namespace Library.Api.Contracts;

public record BookInput(
    [Required, StringLength(200, MinimumLength = 1)] string Title,
    [Required, StringLength(160, MinimumLength = 1)] string Author,
    [Required, RegularExpression(@"^(\d{10}|\d{13})$", ErrorMessage = "ISBN must contain 10 or 13 digits.")] string Isbn,
    [Range(1, int.MaxValue)] int CategoryId,
    [Range(1450, 2200)] int PublicationYear,
    [Range(1, 100000)] int TotalCopies);

public record CategoryInput([Required, StringLength(80, MinimumLength = 1)] string Name);
public record BookView(int Id, string Title, string Author, string Isbn, int CategoryId, string Category,
    int PublicationYear, int TotalCopies, int AvailableCopies, bool Archived);
public record Page<T>(IReadOnlyList<T> Items, int Total, int PageNumber, int PageSize);

public class BusinessException(int status, string message) : Exception(message)
{
    public int Status { get; } = status;
}
