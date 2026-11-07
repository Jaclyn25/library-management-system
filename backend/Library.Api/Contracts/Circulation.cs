using System.ComponentModel.DataAnnotations;

namespace Library.Api.Contracts;

public record IssueInput([Range(1, int.MaxValue)] int BookId, [Range(1, int.MaxValue)] int BorrowerId,
    DateTime DueAt, Guid OperationId);
public record LoanView(int Id, int BookId, string Title, int BorrowerId, string BorrowerName,
    DateTime IssuedAt, DateTime DueAt, DateTime? ReturnedAt, bool IsOverdue, int OverdueDays);
