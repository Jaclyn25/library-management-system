import {
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BookForm } from "./Catalog";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function setup() {
  const saved = vi.fn(),
    cancel = vi.fn();
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      }
    >
      <BookForm
        categories={[{ id: 1, name: "Fiction" }]}
        saved={saved}
        cancel={cancel}
      />
    </QueryClientProvider>,
  );
  return { saved, cancel };
}
function fill() {
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "The River House" },
  });
  fireEvent.change(screen.getByLabelText("Author"), {
    target: { value: "Ada Lane" },
  });
  fireEvent.change(screen.getByLabelText("ISBN"), {
    target: { value: "9781234567890" },
  });
  fireEvent.change(screen.getByLabelText("Category"), {
    target: { value: "1" },
  });
}
describe("book form", () => {
  it("shows validation before sending invalid input", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Save book" }));
    expect(await screen.findByText("Enter a title.")).toBeVisible();
    expect(screen.getByText("Use 10 or 13 digits.")).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("submits valid values and signals success", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ id: 1 }),
      });
    vi.stubGlobal("fetch", fetch);
    const { saved } = setup();
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Save book" }));
    await waitFor(() => expect(saved).toHaveBeenCalledOnce());
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({
      title: "The River House",
      categoryId: 1,
      totalCopies: 1,
    });
  });
  it("shows a server conflict and keeps the entered values", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: false,
          json: async () => ({ title: "ISBN already exists." }),
        }),
    );
    setup();
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Save book" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ISBN already exists.",
    );
    expect(screen.getByLabelText("Title")).toHaveValue("The River House");
  });
  it("cancels without submitting", () => {
    const { cancel } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(cancel).toHaveBeenCalledOnce();
  });
});
