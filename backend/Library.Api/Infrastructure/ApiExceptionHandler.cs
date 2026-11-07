using Library.Api.Contracts;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Library.Api.Infrastructure;

public class ApiExceptionHandler(ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken token)
    {
        var postgres = exception as PostgresException ?? (exception as DbUpdateException)?.InnerException as PostgresException;
        var status = exception is BusinessException business ? business.Status : postgres?.SqlState is "23505" or "23503" or "23514" ? 409 : 500;
        var title = exception is BusinessException ? exception.Message : status == 409 ? "This operation conflicts with an existing record or stock constraint." : "An unexpected error occurred. Try again or contact support.";
        if (status == 500) logger.LogError(exception, "Request failed with trace {TraceId}", context.TraceIdentifier);
        else logger.LogWarning("Request rejected with status {Status} and trace {TraceId}", status, context.TraceIdentifier);
        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(new ProblemDetails { Status = status, Title = title, Extensions = { ["traceId"] = context.TraceIdentifier } }, token);
        return true;
    }
}
