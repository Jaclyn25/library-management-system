import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X, AlertCircle, BookOpen, AlertTriangle } from "lucide-react";

export function Dialog({ title, close, children, size = "md" }: { title: string; close: () => void; children: ReactNode; size?: "sm" | "md" | "lg" }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const d = ref.current; if (d && !d.open) d.showModal(); }, []);
  const maxWidth = size === "sm" ? "440px" : size === "lg" ? "760px" : "600px";

  return (
    <dialog ref={ref} onCancel={close} aria-labelledby="dialog-title" style={{ maxWidth: `min(${maxWidth}, calc(100% - 32px))` }}>
      <header className="dialog-head">
        <h2 id="dialog-title">{title}</h2>
        <button type="button" className="icon-button" onClick={close} aria-label="Close dialog" title="Close dialog"><X size={18} /></button>
      </header>
      {children}
    </dialog>
  );
}

export function ErrorBox({ error }: { error: Error | string | null | undefined }) {
  if (!error) return null;
  return (
    <div role="alert" className="error">
      <AlertCircle size={18} />
      <div>{typeof error === "string" ? error : error.message}</div>
    </div>
  );
}

export function Loading({ type = "default" }: { type?: "default" | "cards" | "table" }) {
  if (type === "cards") {
    return (
      <div role="status" aria-label="Loading metrics" className="metrics">
        {[1, 2, 3, 4].map((i) => <div key={i} className="metric" style={{ minHeight: "110px" }} />)}
      </div>
    );
  }
  return (
    <div role="status" aria-label="Loading content" className="skeletons">
      <div /><div /><div />
    </div>
  );
}

export function Empty({ title, children, icon, action }: { title: string; children?: ReactNode; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      {icon ? <div style={{ display: "grid", placeItems: "center" }}>{icon}</div> : <BookOpen size={28} />}
      <h3>{title}</h3>
      {children}
      {action && <div style={{ marginTop: "16px" }}>{action}</div>}
    </div>
  );
}

export function Pager({ page, total, size = 12, change }: { page: number; total: number; size?: number; change: (v: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / size));
  return (
    <div className="pager">
      <span><strong>{total.toLocaleString()}</strong> records · Page <strong>{page}</strong> of <strong>{totalPages}</strong></span>
      <div>
        <button type="button" className="secondary" disabled={page <= 1} onClick={() => change(page - 1)} aria-label="Previous page">Previous</button>
        <button type="button" className="secondary" disabled={page >= totalPages} onClick={() => change(page + 1)} aria-label="Next page">Next</button>
      </div>
    </div>
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <span role="alert" className="field-error"><AlertTriangle size={13} />{error}</span>}
    </label>
  );
}

export function Badge({ children, variant = "neutral" }: { children: ReactNode; variant?: "success" | "warning" | "danger" | "neutral" }) {
  return <span className={`badge ${variant}`}>{children}</span>;
}
