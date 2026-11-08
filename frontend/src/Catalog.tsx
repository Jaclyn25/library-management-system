import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Pencil, Archive, BookOpen, Layers } from "lucide-react";
import { api, json } from "./api";
import type { Book, Category, Page } from "./api";
import { Dialog, Empty, ErrorBox, Field, Loading, Pager } from "./components";

export const bookSchema = z.object({
  title: z.string().trim().min(1, "Enter a title.").max(200),
  author: z.string().trim().min(1, "Enter an author.").max(160),
  isbn: z.string().regex(/^(\d{10}|\d{13})$/, "Use 10 or 13 digits."),
  categoryId: z.number().min(1, "Choose a category."),
  publicationYear: z.number().int().min(1450).max(new Date().getFullYear() + 1),
  totalCopies: z.number().int().min(1).max(100000),
});
type BookValues = z.infer<typeof bookSchema>;

export function BookForm({ book, categories, saved, cancel }: { book?: Book; categories: Category[]; saved: () => void; cancel: () => void; }) {
  const { register, handleSubmit, formState: { errors } } = useForm<BookValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: book ?? { title: "", author: "", isbn: "", categoryId: 0, publicationYear: new Date().getFullYear(), totalCopies: 1 },
  });

  const mutation = useMutation({
    mutationFn: (v: BookValues) => api(`/books${book ? `/${book.id}` : ""}`, json(book ? "PUT" : "POST", v)),
    onSuccess: saved,
  });

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
      <ErrorBox error={mutation.error} />
      <div className="form-grid">
        <Field label="Title" error={errors.title?.message}><input autoFocus {...register("title")} placeholder="Full title of the book" /></Field>
        <Field label="Author" error={errors.author?.message}><input {...register("author")} placeholder="Primary author or editor" /></Field>
        <Field label="ISBN" error={errors.isbn?.message}><input inputMode="numeric" {...register("isbn")} placeholder="e.g. 9780000000001" /></Field>
        <Field label="Category" error={errors.categoryId?.message}>
          <select {...register("categoryId", { valueAsNumber: true })}>
            <option value={0}>Choose category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Publication year" error={errors.publicationYear?.message}><input type="number" {...register("publicationYear", { valueAsNumber: true })} /></Field>
        <Field label="Total copies" error={errors.totalCopies?.message}><input type="number" min={1} {...register("totalCopies", { valueAsNumber: true })} /></Field>
      </div>
      <footer className="form-actions">
        <button type="button" className="secondary" onClick={cancel}>Cancel</button>
        <button disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : "Save book"}</button>
      </footer>
    </form>
  );
}

export function Catalog({ notify }: { notify: (text: string) => void }) {
  const client = useQueryClient();
  const [search, setSearch] = useState(""), [category, setCategory] = useState(""), [availability, setAvailability] = useState(""), [page, setPage] = useState(1);
  const [editor, setEditor] = useState<Book | "new" | null>(null), [archive, setArchive] = useState<Book | null>(null), [detail, setDetail] = useState<Book | null>(null);

  const categories = useQuery({ queryKey: ["categories"], queryFn: () => api<Category[]>("/categories") });
  const books = useQuery({
    queryKey: ["books", search, category, availability, page],
    queryFn: () => api<Page<Book>>(`/books?${new URLSearchParams({ search, ...(category && { categoryId: category }), ...(availability && { available: availability }), page: String(page) })}`),
  });

  const refresh = () => { void client.invalidateQueries(); setEditor(null); setArchive(null); };
  const remove = useMutation({
    mutationFn: (id: number) => api(`/books/${id}`, json("DELETE")),
    onSuccess: () => { refresh(); notify("Book archived. Its history is preserved."); },
  });

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">COLLECTION</p>
          <h1>Book catalog</h1>
          <p>Every title, edition, and physical copy in one centralized inventory.</p>
        </div>
        <button onClick={() => setEditor("new")}><Plus size={17} /> Add book</button>
      </div>

      <div className="toolbar">
        <label className="search">
          <Search size={18} />
          <input aria-label="Search books" placeholder="Search title, author or ISBN" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </label>
        <select aria-label="Filter category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All categories</option>
          {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select aria-label="Filter availability" value={availability} onChange={(e) => { setAvailability(e.target.value); setPage(1); }}>
          <option value="">All availability</option>
          <option value="true">Available</option>
          <option value="false">On loan</option>
        </select>
      </div>

      <ErrorBox error={books.error || categories.error} />

      {books.isPending ? <Loading /> : !books.data?.items.length ? (
        <Empty title="No books found"><p>Add your first title or adjust the search and filter criteria.</p></Empty>
      ) : (
        <section className="table-panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Book / author</th>
                  <th>Category</th>
                  <th>ISBN</th>
                  <th>Availability</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.data.items.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="book-cell">
                        <span className={`book-spine tone-${b.categoryId % 4}`}>{b.title.slice(0, 1)}</span>
                        <div>
                          <button type="button" className="text-button title-link" onClick={() => setDetail(b)}>{b.title}</button>
                          <small>{b.author}</small>
                        </div>
                      </div>
                    </td>
                    <td>{b.category}</td>
                    <td className="mono">{b.isbn}</td>
                    <td>
                      <span className={`badge ${b.availableCopies ? "success" : "warning"}`}>{b.availableCopies} of {b.totalCopies} available</span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="icon-button" aria-label={`Edit ${b.title}`} title={`Edit ${b.title}`} onClick={() => setEditor(b)}><Pencil size={15} /></button>
                        <button type="button" className="icon-button" aria-label={`Archive ${b.title}`} title={`Archive ${b.title}`} onClick={() => { remove.reset(); setArchive(b); }}><Archive size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} total={books.data.total} change={setPage} />
        </section>
      )}

      {editor && (
        <Dialog title={editor === "new" ? "Add a book" : "Edit book"} close={() => setEditor(null)} size="md">
          <BookForm book={editor === "new" ? undefined : editor} categories={categories.data ?? []} cancel={() => setEditor(null)} saved={() => { refresh(); notify("Book saved successfully."); }} />
        </Dialog>
      )}

      {archive && (
        <Dialog title="Archive this book?" close={() => setArchive(null)} size="sm">
          <p>“<strong>{archive.title}</strong>” will leave the active library catalog.</p>
          <p style={{ marginTop: "8px", color: "var(--muted)" }}>Borrowing history stays safely available for reference. All copies must be returned to shelves first.</p>
          <ErrorBox error={remove.error} />
          <footer className="form-actions">
            <button type="button" className="secondary" onClick={() => setArchive(null)}>Cancel</button>
            <button type="button" disabled={remove.isPending} onClick={() => remove.mutate(archive.id)}>{remove.isPending ? "Archiving…" : "Archive book"}</button>
          </footer>
        </Dialog>
      )}

      {detail && (
        <Dialog title={detail.title} close={() => setDetail(null)} size="md">
          <div className="book-detail-hero">
            <span className={`book-spine tone-${detail.categoryId % 4}`} style={{ width: "42px", height: "54px", fontSize: "1.25rem" }}>{detail.title.slice(0, 1)}</span>
            <div>
              <h3 style={{ fontSize: "1.125rem", color: "var(--accent)" }}>{detail.title}</h3>
              <p style={{ fontSize: "0.875rem", color: "oklch(35% 0.04 320)" }}>By {detail.author} · Published {detail.publicationYear}</p>
            </div>
          </div>
          <dl className="details">
            <dt>Category</dt><dd><span className="badge neutral"><Layers size={11} /> {detail.category}</span></dd>
            <dt>ISBN</dt><dd className="mono">{detail.isbn}</dd>
            <dt>Availability</dt><dd><span className={`badge ${detail.availableCopies ? "success" : "warning"}`}><BookOpen size={11} /> {detail.availableCopies} available / {detail.totalCopies} total</span></dd>
            <dt>Status</dt><dd>{detail.archived ? <span className="badge neutral">Archived</span> : <span className="badge success">Active in circulation</span>}</dd>
          </dl>
          <footer className="form-actions" style={{ marginTop: "20px" }}>
            <button type="button" className="secondary" onClick={() => setDetail(null)}>Close</button>
          </footer>
        </Dialog>
      )}
    </>
  );
}
