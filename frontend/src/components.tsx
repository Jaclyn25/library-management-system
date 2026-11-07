import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X, AlertCircle, BookOpen } from "lucide-react";

export function Dialog({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} onCancel={close} aria-labelledby="dialog-title">
      <header className="dialog-head">
        <h2 id="dialog-title">{title}</h2>
        <button
          className="icon-button"
          onClick={close}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function ErrorBox({ error }: { error: Error | null }) {
  return error ? (
    <div role="alert" className="error">
      <AlertCircle size={18} />
      {error.message}
    </div>
  ) : null;
}
export function Loading() {
  return (
    <div role="status" aria-label="Loading" className="skeletons">
      <div />
      <div />
      <div />
    </div>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <BookOpen size={30} />
      <h3>{title}</h3>
      {children}
    </div>
  );
}
export function Pager({
  page,
  total,
  size = 12,
  change,
}: {
  page: number;
  total: number;
  size?: number;
  change: (value: number) => void;
}) {
  return (
    <div className="pager">
      <span>
        {total} records · Page {page} of {Math.max(1, Math.ceil(total / size))}
      </span>
      <div>
        <button
          className="secondary"
          disabled={page === 1}
          onClick={() => change(page - 1)}
        >
          Previous
        </button>
        <button
          className="secondary"
          disabled={page * size >= total}
          onClick={() => change(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && (
        <span role="alert" className="field-error">
          {error}
        </span>
      )}
    </label>
  );
}
