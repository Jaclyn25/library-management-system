using Library.Api.Contracts;
using Library.Api.Data;
using Library.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Library.Api.Controllers;

[ApiController, Route("api/borrowers")]
public class BorrowersController(BorrowerService service) : ControllerBase
{
    [HttpGet] public Task<Page<Borrower>> Search(string? search, int page = 1, int size = 12) => service.Search(search, page, size);
    [HttpGet("{id:int}")] public Task<Borrower> Get(int id) => service.Get(id);
    [HttpPost] public async Task<ActionResult<Borrower>> Create(BorrowerInput input) {
        var result = await service.Save(null, input); return CreatedAtAction(nameof(Get), new { id = result.Id }, result);
    }
    [HttpPut("{id:int}")] public Task<Borrower> Update(int id, BorrowerInput input) => service.Save(id, input);
}
