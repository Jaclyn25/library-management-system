# HTTP API

Base path: `/api`. Requests and responses use JSON and camelCase properties. Dates are UTC ISO 8601 timestamps. Development OpenAPI is available at `/openapi/v1.json` (port 5080 for native development).

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Process health |
| GET | `/books` | Active catalog; `search`, `categoryId`, `available`, `page`, `size` |
| GET | `/books/{id}` | Details, including archived books |
| POST | `/books` | Add title and copies |
| PUT | `/books/{id}` | Edit metadata and stock |
| DELETE | `/books/{id}` | Archive when no copies are on loan |
| GET | `/categories` | All categories |
| POST | `/categories` | Create category |
| PUT | `/categories/{id}` | Rename category |
| DELETE | `/categories/{id}` | Delete unused category |
| GET | `/borrowers` | Readers; `search`, `page`, `size` |
| GET | `/borrowers/{id}` | Reader details |
| POST | `/borrowers` | Register reader |
| PUT | `/borrowers/{id}` | Edit reader |
| GET | `/loans` | History; `borrowerId`, `status`, `page`, `size` |
| GET | `/loans/{id}` | Loan details |
| POST | `/loans` | Issue an available copy |
| POST | `/loans/{id}/return` | Record return exactly once |
| GET | `/reports` | Summary, categories, activity, recent and overdue loans |

`status` accepts `active`, `returned`, or `overdue`; omit it for all history. Pages default to 12 rows, with a maximum size of 100. Category lists are unpaginated.

## Book request

```json
{
  "title": "The River House",
  "author": "Elena Vale",
  "isbn": "9781234567890",
  "categoryId": 1,
  "publicationYear": 2024,
  "totalCopies": 3
}
```

Availability is calculated by the server. Stock cannot be lowered below outstanding loans. ISBN accepts 10 or 13 digits and must be unique; checksum validation is not enforced.

## Borrower request

```json
{ "name": "Sam Rowan", "email": "sam@example.org", "phone": "" }
```

Email is normalized to lowercase and must be unique. Names cannot be blank.

## Issue request

```json
{
  "bookId": 1,
  "borrowerId": 1,
  "dueAt": "2026-11-21T23:59:59Z",
  "operationId": "c0e2781c-748a-4ea0-96c3-cc1ae43492f9"
}
```

Choose a future UTC due date within 90 days and a fresh UUID per intended checkout. Reusing a UUID or borrowing the same title twice concurrently for one reader returns 409 without changing stock. A rejected duplicate is not treated as a second successful issue.

Returns require no request body. Duplicate returns return 409. Loan records preserve issue, due and return timestamps. Active loans are overdue when `dueAt < current UTC time`. Late days are the positive elapsed time rounded up to a whole day; returned loans use the fixed return timestamp.

## Errors

Validation returns 400 with a standard validation problem. Missing detail records return 404. Availability, duplicate records and state conflicts return 409. Other failures return a generic 500 problem, with a trace ID for logs and no server exception details. Search with no matches returns an empty page.

This internship app is for a trusted local staff workstation. It has no authentication or authorization boundary and must not be exposed publicly without adding them.
