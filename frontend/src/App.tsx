import { lazy, Suspense, useEffect, useState } from "react";
import { NavLink, Routes, Route, Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  LayoutDashboard,
  Library,
  Users,
  ArrowRightLeft,
  ChartNoAxesCombined,
  Tags,
  Menu,
  X,
  ArrowUpRight,
} from "lucide-react";
import { Catalog } from "./Catalog";
import { Borrowers } from "./Borrowers";
import { Categories } from "./Categories";
import { Loans, IssueBook } from "./Loans";
import { Loading } from "./components";
const Dashboard = lazy(() =>
  import("./Dashboard").then((module) => ({ default: module.Dashboard })),
);

const navigation = [
  { path: "/", label: "Overview", icon: LayoutDashboard },
  { path: "/books", label: "Book catalog", icon: Library },
  { path: "/borrowers", label: "Borrowers", icon: Users },
  { path: "/loans", label: "Loans & returns", icon: ArrowRightLeft },
  { path: "/categories", label: "Categories", icon: Tags },
  { path: "/reports", label: "Reports", icon: ChartNoAxesCombined },
];
export function App() {
  const [notice, setNotice] = useState(""),
    [open, setOpen] = useState(false),
    location = useLocation();
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span>
            <BookOpen size={25} />
          </span>
          folio<span className="brand-period">.</span>
        </Link>
        <p className="workspace-label">LIBRARY WORKSPACE</p>
        <nav aria-label="Main navigation">
          {navigation.map((n) => (
            <NavLink
              key={n.path}
              to={n.path}
              end={n.path === "/"}
              onClick={() => setOpen(false)}
            >
              <n.icon size={19} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="eyebrow">A PLACE FOR DISCOVERY</span>
          <p>
            Great stories.
            <br />
            Thoughtfully managed.
          </p>
          <Link to="/books" onClick={() => setOpen(false)}>
            Browse the collection <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="staff-profile">
          <span className="avatar">LS</span>
          <div>
            <strong>Library staff</strong>
            <small>Local workspace</small>
          </div>
        </div>
      </aside>
      {open && (
        <button
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="workspace">
        <header className="topbar">
          <div>
            <button
              className="icon-button mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
            <span>Workspace</span>
            <span className="breadcrumb-separator">/</span>
            <strong>
              {navigation.find(
                (n) => n.path !== "/" && location.pathname.startsWith(n.path),
              )?.label ?? "Overview"}
            </strong>
          </div>
          <div className="today">
            <span className="status-dot" />
            Local library{" "}
            <span className="topbar-date">
              {new Intl.DateTimeFormat("en", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }).format(new Date())}
            </span>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/books" element={<Catalog notify={setNotice} />} />
              <Route
                path="/borrowers"
                element={<Borrowers notify={setNotice} />}
              />
              <Route
                path="/categories"
                element={<Categories notify={setNotice} />}
              />
              <Route path="/loans" element={<Loans notify={setNotice} />} />
              <Route
                path="/loans/new"
                element={<IssueBook notify={setNotice} />}
              />
              <Route path="/reports" element={<Dashboard reports />} />
              <Route
                path="*"
                element={
                  <>
                    <h1>Page not found</h1>
                    <Link to="/">Return to overview</Link>
                  </>
                }
              />
            </Routes>
          </Suspense>
        </main>
        <footer className="workspace-footer">
          <span>Folio · Library Management System</span>
          <span>Auspify Technologies · Task 2</span>
        </footer>
      </div>
      {notice && (
        <div role="status" className="toast">
          {notice}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
