import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, ArrowLeft, Calendar, CheckCircle2, Clock, BookOpen, User, RotateCcw } from "lucide-react";
import { api, date, json } from "./api";
import type { Book, Borrower, Loan, Page } from "./api";
import { Dialog, Empty, ErrorBox, Field, Loading, Pager } from "./components";

export function LoanTable({ loans, onReturn }: { loans: Loan[]; onReturn?: (l: Loan) => void }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Book / borrower</th>
            <th>Issued</th>
            <th>Due date</th>
            <th>Status</th>
            {onReturn && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {loans.map((l) => (
            <tr key={l.id} className={l.isOverdue && !l.returnedAt ? "loan-row-overdue" : undefined}>
              <td>
                <strong>{l.title}</strong>
                <small>{l.borrowerName}</small>
              </td>
              <td className="mono">{date(l.issuedAt)}</td>
              <td className="mono">{date(l.dueAt)}</td>
              <td>
                <span className={`badge ${l.returnedAt ? "neutral" : l.isOverdue ? "danger" : "success"}`}>
                  {l.returnedAt ? <><CheckCircle2 size={12} /> Returned</> : l.isOverdue ? <><Clock size={12} /> {l.overdueDays}d overdue</> : <><BookOpen size={12} /> On loan</>}
                </span>
                {l.returnedAt && <small>{date(l.returnedAt)}{l.overdueDays > 0 ? ` · ${l.overdueDays}d late` : ""}</small>}
              </td>
              {onReturn && (
                <td>
                  {!l.returnedAt && (
                    <button type="button" className="secondary compact" onClick={() => onReturn(l)}>
                      <RotateCcw size={13} /> Return book
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Loans({ notify }: { notify: (text: string) => void }) {
  const client = useQueryClient(),
    [params, setParams] = useSearchParams(),
    [page, setPage] = useState(1),
    [returning, setReturning] = useState<Loan | null>(null);
  const status = params.get("status") ?? "", borrowerId = params.get("borrowerId") ?? "";

  const loans = useQuery({
    queryKey: ["loans", status, borrowerId, page],
    queryFn: () => api<Page<Loan>>(`/loans?${new URLSearchParams({ status, ...(borrowerId && { borrowerId }), page: String(page) })}`),
  });

  const mutation = useMutation({
    mutationFn: (id: number) => api(`/loans/${id}/return`, json("POST")),
    onSuccess: () => {
      setReturning(null);
      void client.invalidateQueries();
      notify("Return recorded. Availability updated.");
    },
  });

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CIRCULATION</p>
          <h1>{borrowerId ? "Borrowing history" : "Loans & returns"}</h1>
          <p>A complete circulation record, from checkout to return.</p>
        </div>
        <Link className="button" to="/loans/new">
          <Plus size={17} /> Issue book
        </Link>
      </div>

      <div className="toolbar">
        <div className="tabs" aria-label="Loan status">
          {[["", "All loans"], ["active", "On loan"], ["overdue", "Overdue"], ["returned", "Returned"]].map(([val, lbl]) => (
            <button key={val} type="button" className={status === val ? "selected" : ""} onClick={() => { setParams({ ...(borrowerId && { borrowerId }), ...(val && { status: val }) }); setPage(1); }}>
              {lbl}
            </button>
          ))}
        </div>
        {borrowerId && <Link to="/loans" className="text-button">Clear borrower filter</Link>}
      </div>

      <ErrorBox error={loans.error} />

      {loans.isPending ? <Loading /> : !loans.data?.items.length ? (
        <Empty title="No matching loans"><p>Issue an available book to start a borrowing record.</p></Empty>
      ) : (
        <section className="table-panel">
          <LoanTable loans={loans.data.items} onReturn={(l) => { mutation.reset(); setReturning(l); }} />
          <Pager page={page} total={loans.data.total} change={setPage} />
        </section>
      )}

      {returning && (
        <Dialog title="Confirm book return" close={() => setReturning(null)}>
          <p>Record the return of <strong>{returning.title}</strong> from <strong>{returning.borrowerName}</strong>?</p>
          {returning.isOverdue && (
            <div className="overdue-strip overdue-dialog-banner">
              <div>
                <Clock size={20} />
                <div>
                  <h3>This loan is {returning.overdueDays} days overdue</h3>
                  <p>The late return status will be preserved in circulation history.</p>
                </div>
              </div>
            </div>
          )}
          <ErrorBox error={mutation.error} />
          <footer className="form-actions">
            <button type="button" className="secondary" onClick={() => setReturning(null)}>Cancel</button>
            <button type="button" disabled={mutation.isPending} onClick={() => mutation.mutate(returning.id)}>
              {mutation.isPending ? "Recording…" : "Confirm return"}
            </button>
          </footer>
        </Dialog>
      )}
    </>
  );
}

const schema = z.object({
  bookId: z.number().min(1, "Choose a book."),
  borrowerId: z.number().min(1, "Choose a borrower."),
  dueDate: z.string().min(1, "Choose a due date."),
});
type Values = z.infer<typeof schema>;

export function IssueBook({ notify }: { notify: (text: string) => void }) {
  const navigate = useNavigate(), client = useQueryClient(),
    [bookSearch, setBookSearch] = useState(""), [readerSearch, setReaderSearch] = useState(""),
    [operationId] = useState(() => crypto.randomUUID());

  const books = useQuery({
    queryKey: ["issue-books", bookSearch],
    queryFn: () => api<Page<Book>>(`/books?available=true&size=100&search=${encodeURIComponent(bookSearch)}`),
  });
  const borrowers = useQuery({
    queryKey: ["issue-borrowers", readerSearch],
    queryFn: () => api<Page<Borrower>>(`/borrowers?size=100&search=${encodeURIComponent(readerSearch)}`),
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { bookId: 0, borrowerId: 0, dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10) },
  });

  const selectedBook = books.data?.items.find((b) => b.id === watch("bookId"));
  const selectedBorrower = borrowers.data?.items.find((b) => b.id === watch("borrowerId"));
  const selectedDueDate = watch("dueDate");

  const setDays = (d: number) => setValue("dueDate", new Date(Date.now() + d * 86400000).toISOString().slice(0, 10), { shouldValidate: true });

  const mutation = useMutation({
    mutationFn: (v: Values) => api("/loans", json("POST", { bookId: v.bookId, borrowerId: v.borrowerId, dueAt: `${v.dueDate}T23:59:59Z`, operationId })),
    onSuccess: () => { void client.invalidateQueries(); notify("Book issued successfully."); navigate("/loans"); },
  });

  return (
    <>
      <Link className="back-link" to="/loans"><ArrowLeft size={16} /> Back to loans</Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CHECKOUT</p>
          <h1>Issue a book</h1>
          <p>Choose an available title and a registered reader.</p>
        </div>
      </div>
      <section className="issue-layout">
        <form className="surface issue-form" onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
          <ErrorBox error={mutation.error || books.error || borrowers.error} />
          <h2>Loan details</h2>
          <Field label="Find a book"><input value={bookSearch} onChange={(e) => setBookSearch(e.target.value)} placeholder="Search title, author or ISBN" /></Field>
          <Field label="Available book" error={errors.bookId?.message}>
            <select {...register("bookId", { valueAsNumber: true })}>
              <option value={0}>{books.isPending ? "Loading books…" : "Select a book"}</option>
              {books.data?.items.map((b) => <option key={b.id} value={b.id}>{b.title} · {b.availableCopies} available</option>)}
            </select>
          </Field>
          <Field label="Find a borrower"><input value={readerSearch} onChange={(e) => setReaderSearch(e.target.value)} placeholder="Search name or email" /></Field>
          <Field label="Borrower" error={errors.borrowerId?.message}>
            <select {...register("borrowerId", { valueAsNumber: true })}>
              <option value={0}>{borrowers.isPending ? "Loading borrowers…" : "Select a borrower"}</option>
              {borrowers.data?.items.map((b) => <option key={b.id} value={b.id}>{b.name} · {b.email}</option>)}
            </select>
          </Field>
          <Field label="Due date (end of day, UTC)" error={errors.dueDate?.message}>
            <input type="date" min={new Date().toISOString().slice(0, 10)} max={new Date(Date.now() + 89 * 86400000).toISOString().slice(0, 10)} {...register("dueDate")} />
          </Field>
          <div className="duration-presets">
            <span className="duration-presets-label">Quick duration presets:</span>
            <div className="duration-presets-list">
              <button type="button" className="secondary compact" onClick={() => setDays(14)}><Calendar size={13} /> 14 Days (Standard)</button>
              <button type="button" className="secondary compact" onClick={() => setDays(7)}>7 Days (Short-term)</button>
              <button type="button" className="secondary compact" onClick={() => setDays(30)}>30 Days (Extended)</button>
            </div>
          </div>
          <footer className="form-actions">
            <Link className="button secondary" to="/loans">Cancel</Link>
            <button disabled={mutation.isPending || books.isPending || borrowers.isPending}>{mutation.isPending ? "Issuing…" : "Confirm checkout"}</button>
          </footer>
        </form>
        <aside className="checkout-note surface" style={{ height: "fit-content" }}>
          <span className="eyebrow">{selectedBook && selectedBorrower ? "LIVE CHECKOUT SUMMARY" : "A RELIABLE RECORD"}</span>
          {selectedBook && selectedBorrower ? (
            <div className="checkout-preview">
              <div className="checkout-preview-book">
                <BookOpen size={20} color="var(--accent)" />
                <div>
                  <strong style={{ color: "var(--accent)" }}>{selectedBook.title}</strong>
                  <small>{selectedBook.author} · {selectedBook.availableCopies} left</small>
                </div>
              </div>
              <div className="checkout-preview-reader">
                <User size={18} color="var(--muted)" />
                <div><strong>{selectedBorrower.name}</strong><small>{selectedBorrower.email}</small></div>
              </div>
              <div className="checkout-due-box">
                <div>Due by: <strong>{selectedDueDate} (23:59 UTC)</strong></div>
                <div style={{ marginTop: "4px" }}>Status will record as On Loan immediately upon confirmation.</div>
              </div>
            </div>
          ) : (
            <>
              <h2>From shelf<br />to reader.</h2>
              <p>Only available copies can be issued. Each checkout records the borrowing date and due date automatically.</p>
              <p>Returning a book restores availability and preserves its full borrowing history.</p>
            </>
          )}
        </aside>
      </section>
    </>
  );
}
