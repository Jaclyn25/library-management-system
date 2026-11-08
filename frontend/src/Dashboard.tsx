import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { ArrowUpRight, Plus, BookOpen, Layers, ArrowRightLeft, Clock3 } from "lucide-react";
import { api } from "./api";
import type { Report } from "./api";
import { Empty, ErrorBox, Loading } from "./components";
import { LoanTable } from "./Loans";

export function Dashboard({ reports = false }: { reports?: boolean }) {
  const result = useQuery({ queryKey: ["reports"], queryFn: () => api<Report>("/reports"), refetchInterval: 60000 });
  const data = result.data;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{reports ? "COLLECTION INSIGHTS" : "YOUR LIBRARY AT A GLANCE"}</p>
          <h1>{reports ? "Reports & insights" : "A good day to turn a page."}</h1>
          <p>{reports ? "Understand your collection, borrowing patterns and stock availability." : "Keep your collection moving and your readers connected."}</p>
        </div>
        <Link className="button" to="/loans/new"><Plus size={17} /> Issue book</Link>
      </div>

      <ErrorBox error={result.error} />

      {result.isPending ? <Loading type="cards" /> : data && (
        <>
          {data.overdueBooks > 0 && !reports && (
            <section className="overdue-strip" aria-label="Action required for overdue books">
              <div>
                <Clock3 size={24} />
                <div>
                  <h3>{data.overdueBooks} overdue {data.overdueBooks === 1 ? "book needs" : "books need"} attention</h3>
                  <p>{data.overdue.length ? data.overdue.map((l) => `${l.title} (${l.borrowerName})`).join(" · ") : "There are overdue loans that need follow-up."}</p>
                </div>
              </div>
              <Link className="button secondary" to="/loans?status=overdue">Review overdue</Link>
            </section>
          )}

          <section className="metrics" aria-label="Library totals">
            {[
              { label: "Total copies", value: data.totalBooks, note: `${data.titles} unique titles`, icon: BookOpen, path: "/books" },
              { label: "Available copies", value: data.availableBooks, note: "Ready for the next reader", icon: Layers, path: "/books" },
              { label: "Currently on loan", value: data.borrowedBooks, note: `${data.borrowers} registered readers`, icon: ArrowRightLeft, path: "/loans?status=active" },
              { label: "Overdue loans", value: data.overdueBooks, note: data.overdueBooks ? "Need a little attention" : "Everything is on track", icon: Clock3, path: "/loans?status=overdue" },
            ].map((m, i) => (
              <Link className={`metric metric-${i}`} key={m.label} to={m.path}>
                <div className="metric-label">
                  <span className={`metric-icon-pill metric-icon-${i}`}><m.icon size={16} /></span>
                  {m.label}
                  <ArrowUpRight size={15} />
                </div>
                <strong>{m.value.toLocaleString()}</strong>
                <span>{m.note}</span>
              </Link>
            ))}
          </section>

          <div className="chart-grid">
            <section className="surface">
              <div className="section-heading">
                <div><p className="eyebrow">CIRCULATION</p><h2>Borrowing activity</h2></div>
                <span className="subtle">Last 6 months · UTC</span>
              </div>
              <div className="chart" role="img" aria-label={`Monthly loan counts: ${data.monthly.map((m) => `${m.month}: ${m.loans}`).join(", ")}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.monthly} margin={{ left: -20, right: 12, top: 15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="loanGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="var(--line)" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="loans" name="Loans" stroke="var(--accent)" fill="url(#loanGradient)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--accent)" }} activeDot={{ r: 5, fill: "var(--accent)" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="surface inventory">
              <div className="section-heading"><div><p className="eyebrow">THE COLLECTION</p><h2>Inventory overview</h2></div></div>
              <div className="inventory-number">
                <strong>{data.totalBooks ? Math.round((data.availableBooks / data.totalBooks) * 100) : 0}%</strong>
                <span>of copies available</span>
              </div>
              <div className="stock-track" aria-hidden="true">
                <span style={{ width: `${data.totalBooks ? (data.availableBooks / data.totalBooks) * 100 : 0}%` }} />
              </div>
              <div className="inventory-legend">
                <span><i />On the shelves</span>
                <strong>{data.availableBooks.toLocaleString()}</strong>
                <span><i className="loan-dot" />With readers</span>
                <strong>{data.borrowedBooks.toLocaleString()}</strong>
              </div>
              <Link className="text-button" to="/books">Explore catalog <ArrowUpRight size={15} /></Link>
            </section>
          </div>

          {reports && (
            <section className="surface category-chart">
              <div className="section-heading"><div><p className="eyebrow">INVENTORY BY GENRE</p><h2>Copies by category</h2></div></div>
              {data.categories.length ? (
                <div className="chart" role="img" aria-label={data.categories.map((c) => `${c.name}: ${c.total} copies, ${c.available} available`).join("; ")}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.categories} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--line)" />
                      <XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "12px" }} />
                      <Bar dataKey="total" name="Total copies" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="available" name="Available" fill="var(--sage)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <Empty title="No categories yet" />}
            </section>
          )}

          <section className="table-panel">
            <div className="section-heading">
              <div><p className="eyebrow">{reports ? "BORROWING HISTORY" : "LATEST CHECKOUTS"}</p><h2>Recent activity</h2></div>
              <Link className="text-button" to="/loans">View all loans <ArrowUpRight size={15} /></Link>
            </div>
            {data.recent.length ? <LoanTable loans={data.recent} /> : <Empty title="Your next chapter starts here"><p>Issue your first book to see circulation activity.</p></Empty>}
          </section>

          {(reports || data.overdueBooks === 0) && (
            <section className="overdue-strip">
              <div>
                <Clock3 size={22} />
                <div>
                  <h3>{data.overdueBooks ? `${data.overdueBooks} overdue ${data.overdueBooks === 1 ? "book needs" : "books need"} attention` : "All caught up"}</h3>
                  <p>{data.overdue.length ? data.overdue.map((l) => `${l.title} · ${l.borrowerName}`).join(" / ") : "There are no overdue loans right now."}</p>
                </div>
              </div>
              <Link className="button secondary" to="/loans?status=overdue">Review overdue</Link>
            </section>
          )}
        </>
      )}
    </>
  );
}
