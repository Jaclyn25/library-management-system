import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { LoanTable } from "./Loans";
import type { Loan } from "./api";

afterEach(cleanup);
const loan: Loan = {
  id: 1,
  bookId: 1,
  title: "River Notes",
  borrowerId: 1,
  borrowerName: "Sam Rowan",
  issuedAt: "2026-01-01T12:00:00Z",
  dueAt: "2026-01-15T12:00:00Z",
  returnedAt: null,
  isOverdue: true,
  overdueDays: 2,
};
it("shows overdue state and starts a return for an active loan", () => {
  const onReturn = vi.fn();
  render(<LoanTable loans={[loan]} onReturn={onReturn} />);
  expect(screen.getByText("2d overdue")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Return book" }));
  expect(onReturn).toHaveBeenCalledWith(loan);
});
it("preserves late return history without offering another return", () => {
  render(
    <LoanTable
      loans={[
        { ...loan, returnedAt: "2026-01-17T12:00:00Z", isOverdue: false },
      ]}
      onReturn={vi.fn()}
    />,
  );
  expect(screen.getByText("Returned")).toBeVisible();
  expect(screen.getByText(/2d late/)).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Return book" }),
  ).not.toBeInTheDocument();
});
