import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, json } from "./api";
import type { Category } from "./api";
import { Dialog, Empty, ErrorBox, Field, Loading } from "./components";
import { Pencil, Trash2, Tag, Layers, Check } from "lucide-react";

export function Categories({ notify }: { notify: (text: string) => void }) {
  const client = useQueryClient(), [name, setName] = useState(""), [editing, setEditing] = useState<Category | null>(null), [deleting, setDeleting] = useState<Category | null>(null);

  const data = useQuery({ queryKey: ["categories"], queryFn: () => api<Category[]>("/categories") });

  const save = useMutation({
    mutationFn: () => api(`/categories${editing ? `/${editing.id}` : ""}`, json(editing ? "PUT" : "POST", { name })),
    onSuccess: async () => { await client.invalidateQueries(); setName(""); setEditing(null); notify("Category saved."); },
  });

  const remove = useMutation({
    mutationFn: (id: number) => api(`/categories/${id}`, json("DELETE")),
    onSuccess: async () => { await client.invalidateQueries(); setDeleting(null); notify("Category removed."); },
  });

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ORGANIZATION</p>
          <h1>Categories</h1>
          <p>A considered, structured home for every title in your collection.</p>
        </div>
      </div>

      <div className="category-layout">
        <form className="surface" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Tag size={18} color="var(--accent)" />
            <h2 style={{ margin: 0 }}>{editing ? "Edit category" : "New category"}</h2>
          </div>
          <Field label="Category name"><input required maxLength={80} value={name} placeholder="Enter category name" onChange={(e) => setName(e.target.value)} /></Field>
          <ErrorBox error={save.error} />
          <div className="form-actions">
            {editing && <button type="button" className="secondary" onClick={() => { setEditing(null); setName(""); }}>Cancel</button>}
            <button disabled={save.isPending || !name.trim()}>{save.isPending ? "Saving…" : <><Check size={15} /> Save category</>}</button>
          </div>
        </form>

        <section className="table-panel">
          <ErrorBox error={data.error} />
          {data.isPending ? <Loading /> : data.data?.length ? (
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((c) => {
                  const isBeingEdited = editing?.id === c.id;
                  return (
                    <tr key={c.id} className={isBeingEdited ? "category-row-active" : undefined}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ display: "inline-flex", padding: "4px", borderRadius: "var(--radius-xs)", background: "oklch(94% 0.01 75)", color: "var(--muted)" }}>
                            <Layers size={13} />
                          </span>
                          <strong>{c.name}</strong>
                          {isBeingEdited && <span className="badge warning" style={{ marginLeft: "6px" }}>Editing</span>}
                        </div>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button type="button" className="icon-button" aria-label={`Edit ${c.name}`} title={`Edit ${c.name}`} onClick={() => { setEditing(c); setName(c.name); save.reset(); }}><Pencil size={15} /></button>
                          <button type="button" className="icon-button" aria-label={`Delete ${c.name}`} title={`Delete ${c.name}`} onClick={() => { setDeleting(c); remove.reset(); }}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : <Empty title="Create your first category"><p>Add genres, topics or collections to organize your books.</p></Empty>}
        </section>
      </div>

      {deleting && (
        <Dialog title="Delete category?" close={() => setDeleting(null)} size="sm">
          <p>Delete “<strong>{deleting.name}</strong>”?</p>
          <p style={{ marginTop: "8px", color: "var(--muted)" }}>Categories currently associated with active or archived books are safely protected and cannot be deleted.</p>
          <ErrorBox error={remove.error} />
          <footer className="form-actions">
            <button type="button" className="secondary" onClick={() => setDeleting(null)}>Cancel</button>
            <button type="button" disabled={remove.isPending} onClick={() => remove.mutate(deleting.id)}>{remove.isPending ? "Deleting…" : "Delete category"}</button>
          </footer>
        </Dialog>
      )}
    </>
  );
}
