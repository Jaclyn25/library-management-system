import { test, expect } from "@playwright/test";

test("create book and borrower, issue, return and preserve history", async ({
  page,
}) => {
  const suffix = Date.now().toString(),
    title = `QA River Atlas ${suffix}`;
  await page.goto("/categories");
  await page.getByLabel("Category name").fill(`QA category ${suffix}`);
  await page.getByRole("button", { name: "Save category" }).click();
  await expect(page.getByRole("status")).toContainText("Category saved");
  await page.getByRole("link", { name: "Book catalog", exact: true }).click();
  await page.getByRole("button", { name: "Add book", exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page.getByLabel("Author", { exact: true }).fill("Nora Vale");
  await page
    .getByLabel("ISBN", { exact: true })
    .fill(suffix.slice(-10).padStart(10, "0"));
  await page
    .getByRole("combobox", { name: "Category", exact: true })
    .selectOption({ label: `QA category ${suffix}` });
  await page.getByRole("button", { name: "Save book" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByLabel("Search books").fill(title);
  await expect(
    page.getByRole("button", { name: title, exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Borrowers", exact: true }).click();
  await page
    .getByRole("button", { name: "Register borrower", exact: true })
    .click();
  await page.getByLabel("Full name").fill(`QA Reader ${suffix}`);
  await page.getByLabel("Email address").fill(`qa-${suffix}@example.org`);
  await page.getByRole("button", { name: "Save borrower" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.goto("/loans/new");
  await page.getByLabel("Find a book").fill(title);
  await page
    .getByLabel("Available book")
    .selectOption({ label: `${title} · 1 available` });
  await page.getByLabel("Find a borrower").fill(`qa-${suffix}@example.org`);
  await page
    .getByRole("combobox", { name: "Borrower", exact: true })
    .selectOption({ label: `QA Reader ${suffix} · qa-${suffix}@example.org` });
  await page.getByRole("button", { name: "Confirm checkout" }).click();
  await expect(page).toHaveURL(/\/loans$/);
  const row = page.getByRole("row").filter({ hasText: title });
  await expect(row).toContainText("On loan");
  await row.getByRole("button", { name: "Return book" }).click();
  await page.getByRole("button", { name: "Confirm return" }).click();
  await expect(row).toContainText("Returned");
  await expect(row.getByRole("button", { name: "Return book" })).toHaveCount(0);
  await page.goto("/books");
  await page.getByLabel("Search books").fill(title);
  await expect(page.getByRole("row").filter({ hasText: title })).toContainText(
    "1 of 1 available",
  );
});

test("mobile navigation and catalog remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A good day to turn a page." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("link", { name: "Book catalog", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Book catalog" }),
  ).toBeVisible();
  await expect(page.getByLabel("Search books")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});
