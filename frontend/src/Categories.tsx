import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, json } from "./api";
import type { Category } from "./api";
import { Dialog, Empty, ErrorBox, Field, Loading } from "./components";
import { Pencil, Trash2 } from "lucide-react";

export function Categories({ notify }: { notify: (text: string) => void }) {
  const client = useQueryClient(),
    [name, setName] = useState(""),
    [editing, setEditing] = useState<Category | null>(null),
    [deleting, setDeleting] = useState<Category | null>(null);
  const data = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Category[]>("/categories"),
  });
  const save = useMutation({
    mutationFn: () =>
      api(
        `/categories${editing ? `/${editing.id}` : ""}`,
        json(editing ? "PUT" : "POST", { name }),
      ),
    onSuccess: async () => {
      await client.invalidateQueries();
      setName("");
      setEditing(null);
      notify("Category saved.");
    },
  });
  const remove = useMutation({
    mutationFn: (id: number) => api(`/categories/${id}`, json("DELETE")),
    onSuccess: async () => {
      await client.invalidateQueries();
      setDeleting(null);
      notify("Category removed.");
    },
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ORGANIZATION</p>
          <h1>Categories</h1>
          <p>A considered home for every title.</p>
        </div>
      </div>
      <div className="category-layout">
        <form
          className="surface"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <h2>{editing ? "Edit category" : "New category"}</h2>
          <Field label="Category name">
            <input
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <ErrorBox error={save.error} />
          <div className="form-actions">
            {editing && (
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setEditing(null);
                  setName("");
                }}
              >
                Cancel
              </button>
            )}
            <button disabled={save.isPending || !name.trim()}>
              Save category
            </button>
          </div>
        </form>
        <section className="table-panel">
          <ErrorBox error={data.error} />
          {data.isPending ? (
            <Loading />
          ) : data.data?.length ? (
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label={`Edit ${c.name}`}
                          onClick={() => {
                            setEditing(c);
                            setName(c.name);
                            save.reset();
                          }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`Delete ${c.name}`}
                          onClick={() => {
                            setDeleting(c);
                            remove.reset();
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty title="Create your first category" />
          )}
        </section>
      </div>
      {deleting && (
        <Dialog title="Delete category?" close={() => setDeleting(null)}>
          <p>
            Delete “{deleting.name}”? Categories used by active or archived
            books are protected.
          </p>
          <ErrorBox error={remove.error} />
          <footer className="form-actions">
            <button className="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </button>
            <button
              disabled={remove.isPending}
              onClick={() => remove.mutate(deleting.id)}
            >
              Delete category
            </button>
          </footer>
        </Dialog>
      )}
    </>
  );
}
