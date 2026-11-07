using System.Net;
using System.Net.Http.Json;
using Library.Api.Contracts;
using Library.Api.Data;

namespace Library.Tests;

public class CatalogTests(LibraryFixture fixture) : IClassFixture<LibraryFixture>
{
    private HttpClient Client => fixture.Client;
    private async Task<BookInput> Input()
    {
        var categoryResponse = await Client.PostAsJsonAsync("/api/categories", new { name = "Category " + Guid.NewGuid().ToString("N") });
        categoryResponse.EnsureSuccessStatusCode();
        var category = (await categoryResponse.Content.ReadFromJsonAsync<Category>())!;
        return new("The Observatory", "Mira Vale", Random.Shared.NextInt64(1000000000000, 9999999999999).ToString(), category.Id, 2024, 3);
    }

    [Fact] public async Task Create_and_edit_book_preserves_stock()
    {
        var input = await Input();
        var response = await Client.PostAsJsonAsync("/api/books", input);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var book = (await response.Content.ReadFromJsonAsync<BookView>())!;
        Assert.Equal(3, book.AvailableCopies);
        var edit = await Client.PutAsJsonAsync($"/api/books/{book.Id}", input with { TotalCopies = 5 });
        edit.EnsureSuccessStatusCode();
        Assert.Equal(5, (await edit.Content.ReadFromJsonAsync<BookView>())!.AvailableCopies);
    }

    [Theory]
    [InlineData("", "123", 0)]
    [InlineData("Valid title", "invalid", 2)]
    [InlineData("Valid title", "1234567890123", -1)]
    public async Task Invalid_book_is_rejected(string title, string isbn, int copies)
    {
        var input = await Input();
        var response = await Client.PostAsJsonAsync("/api/books", input with { Title = title, Isbn = isbn, TotalCopies = copies });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact] public async Task Duplicate_isbn_is_conflict_and_archive_preserves_details()
    {
        var input = await Input();
        var created = await Client.PostAsJsonAsync("/api/books", input);
        var book = (await created.Content.ReadFromJsonAsync<BookView>())!;
        Assert.Equal(HttpStatusCode.Conflict, (await Client.PostAsJsonAsync("/api/books", input)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await Client.DeleteAsync($"/api/books/{book.Id}")).StatusCode);
        Assert.True((await Client.GetFromJsonAsync<BookView>($"/api/books/{book.Id}"))!.Archived);
        var results = await Client.GetFromJsonAsync<Page<BookView>>($"/api/books?search={book.Isbn}");
        Assert.Empty(results!.Items);
    }

    [Fact] public async Task Search_category_availability_and_pagination_work()
    {
        var input = await Input();
        (await Client.PostAsJsonAsync("/api/books", input)).EnsureSuccessStatusCode();
        var results = await Client.GetFromJsonAsync<Page<BookView>>($"/api/books?search=observatory&categoryId={input.CategoryId}&available=true&size=1");
        Assert.Single(results!.Items); Assert.Equal(1, results.Total);
        var empty = await Client.GetFromJsonAsync<Page<BookView>>($"/api/books?categoryId={input.CategoryId}&page=2&size=1");
        Assert.Empty(empty!.Items);
        Assert.Equal(HttpStatusCode.Conflict, (await Client.DeleteAsync($"/api/categories/{input.CategoryId}")).StatusCode);
    }
}
