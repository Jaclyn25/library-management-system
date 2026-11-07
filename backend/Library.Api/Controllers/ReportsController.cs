using Library.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Library.Api.Controllers;

[ApiController, Route("api/reports")]
public class ReportsController(ReportService service) : ControllerBase
{
    [HttpGet] public Task<object> Summary() => service.Summary();
}
