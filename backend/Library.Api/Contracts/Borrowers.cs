using System.ComponentModel.DataAnnotations;

namespace Library.Api.Contracts;

public record BorrowerInput(
    [Required, StringLength(160, MinimumLength = 1)] string Name,
    [Required, EmailAddress, StringLength(254)] string Email,
    [StringLength(30)] string Phone);
