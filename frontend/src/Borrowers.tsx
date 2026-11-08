import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Search, History, Mail, Phone } from "lucide-react";
import { api, json, date } from "./api";
import type { Borrower, Page } from "./api";
import { Dialog, Empty, ErrorBox, Field, Loading, Pager } from "./components";

const schema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(160),
  email: z.email("Enter a valid email address.").max(254),
  phone: z.string().max(30),
});
type Values = z.infer<typeof schema>;

function BorrowerForm({ borrower, saved, cancel }: { borrower?: Borrower; saved: () => void; cancel: () => void; }) {
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: borrower ?? { name: "", email: "", phone: "" },
  });

  const mutation = useMutation({
    mutationFn: (v: Values) => api(`/borrowers${borrower ? `/${borrower.id}` : ""}`, json(borrower ? "PUT" : "POST", v)),
    onSuccess: saved,
  });

  return (
    <form noValidate onSubmit={handleSubmit((v) => mutation.mutate(v))}>
      <ErrorBox error={mutation.error} />
      <Field label="Full name" error={errors.name?.message}><input autoFocus {...register("name")} placeholder="e.g. Eleanor Vance" /></Field>
      <Field label="Email address" error={errors.email?.message}><input type="email" {...register("email")} placeholder="reader@example.com" /></Field>
      <Field label="Phone (optional)" error={errors.phone?.message}><input type="tel" {...register("phone")} placeholder="+1 (555) 000-0000" /></Field>
      <footer className="form-actions">
        <button className="secondary" type="button" onClick={cancel}>Cancel</button>
        <button disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : "Save borrower"}</button>
      </footer>
    </form>
  );
}

const PALETTES = [
  { bg: "oklch(93% 0.03 70)", color: "oklch(38% 0.08 60)" },
  { bg: "oklch(93% 0.03 155)", color: "oklch(35% 0.08 155)" },
  { bg: "oklch(94% 0.035 325)", color: "oklch(40% 0.1 325)" },
  { bg: "oklch(93% 0.03 250)", color: "oklch(38% 0.08 250)" },
];

export function Borrowers({ notify }: { notify: (text: string) => void }) {
  const client = useQueryClient(), [search, setSearch] = useState(""), [page, setPage] = useState(1), [editor, setEditor] = useState<Borrower | "new" | null>(null);

  const result = useQuery({
    queryKey: ["borrowers", search, page],
    queryFn: () => api<Page<Borrower>>(`/borrowers?${new URLSearchParams({ search, page: String(page) })}`),
  });

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">COMMUNITY</p>
          <h1>Borrowers</h1>
          <p>The readers and library members behind your active circulation.</p>
        </div>
        <button onClick={() => setEditor("new")}><Plus size={17} /> Register borrower</button>
      </div>

      <div className="toolbar">
        <label className="search">
          <Search size={18} />
          <input aria-label="Search borrowers" placeholder="Search name or email" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </label>
      </div>

      <ErrorBox error={result.error} />

      {result.isPending ? <Loading /> : !result.data?.items.length ? (
        <Empty title="No borrowers found"><p>Register a reader to start their borrowing history.</p></Empty>
      ) : (
        <section className="table-panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Borrower</th>
                  <th>Contact</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.data.items.map((b) => {
                  const pal = PALETTES[b.id % PALETTES.length];
                  return (
                    <tr key={b.id}>
                      <td>
                        <div className="book-cell">
                          <span className="avatar" style={{ background: pal.bg, color: pal.color }}>
                            {b.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                          </span>
                          <div><strong>{b.name}</strong><small>Reader #{String(b.id).padStart(4, "0")}</small></div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}><Mail size={12} color="var(--muted)" /> {b.email}</span>
                          <small style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Phone size={11} color="var(--muted)" /> {b.phone || "No phone provided"}</small>
                        </div>
                      </td>
                      <td className="mono">{date(b.registeredAt)}</td>
                      <td>
                        <div className="row-actions">
                          <Link className="text-button" to={`/loans?borrowerId=${b.id}`} title="View history"><History size={14} /> View history</Link>
                          <button type="button" className="icon-button" aria-label={`Edit ${b.name}`} title={`Edit ${b.name}`} onClick={() => setEditor(b)}><Pencil size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pager page={page} total={result.data.total} change={setPage} />
        </section>
      )}

      {editor && (
        <Dialog title={editor === "new" ? "Register borrower" : "Edit borrower"} close={() => setEditor(null)} size="sm">
          <BorrowerForm borrower={editor === "new" ? undefined : editor} cancel={() => setEditor(null)} saved={() => { setEditor(null); void client.invalidateQueries(); notify("Borrower saved successfully."); }} />
        </Dialog>
      )}
    </>
  );
}
