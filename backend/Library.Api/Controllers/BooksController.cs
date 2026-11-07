using Library.Api.Contracts;
using Library.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Library.Api.Controllers;

[ApiController, Route("api/books")]
public class BooksController(CatalogService service) : ControllerBase
{
    [HttpGet] public Task<Page<BookView>> Search(string? search, int? categoryId, bool? available, int page = 1, int size = 12) => service.Search(search, categoryId, available, page, size);
    [HttpGet("{id:int}")] public Task<BookView> Get(int id) => service.Get(id);
    [HttpPost] public async Task<ActionResult<BookView>> Create(BookInput input) {
        var result = await service.Save(null, input); return CreatedAtAction(nameof(Get), new { id = result.Id }, result);
    }
    [HttpPut("{id:int}")] public Task<BookView> Update(int id, BookInput input) => service.Save(id, input);
    [HttpDelete("{id:int}")] public async Task<IActionResult> Archive(int id) { await service.Archive(id); return NoContent(); }
}

[ApiController, Route("api/categories")]
public class CategoriesController(CatalogService service) : ControllerBase
{
    [HttpGet] public async Task<IActionResult> List() => Ok(await service.Categories());
    [HttpPost] public async Task<IActionResult> Create(CategoryInput input) => Ok(await service.SaveCategory(null, input));
    [HttpPut("{id:int}")] public async Task<IActionResult> Update(int id, CategoryInput input) => Ok(await service.SaveCategory(id, input));
    [HttpDelete("{id:int}")] public async Task<IActionResult> Delete(int id) { await service.DeleteCategory(id); return NoContent(); }
}
