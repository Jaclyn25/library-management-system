using Library.Api.Contracts;
using Library.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Library.Api.Controllers;

[ApiController, Route("api/loans")]
public class LoansController(CirculationService service) : ControllerBase
{
    [HttpGet] public Task<Page<LoanView>> Search(int? borrowerId, string? status, int page = 1, int size = 12) => service.Search(borrowerId, status, page, size);
    [HttpGet("{id:int}")] public Task<LoanView> Get(int id) => service.Get(id);
    [HttpPost] public async Task<ActionResult<LoanView>> Issue(IssueInput input) {
        var result = await service.Issue(input); return CreatedAtAction(nameof(Get), new { id = result.Id }, result);
    }
}
