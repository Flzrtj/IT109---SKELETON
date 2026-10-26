import { useEffect, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { listItems } from "../services/records";
import { reportError } from "../lib/errors";

const labels = { fresh: "Fresh", expiring_soon: "Expiring soon", expired: "Expired" };

export default function Reports() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listItems(user)
      .then((rows) => { if (active) setItems(rows); })
      .catch((loadError) => { if (active) setError(reportError("Report data load failed:", loadError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);

  const categories = [...items.reduce((map, item) => {
    const name = item.category || "Uncategorized";
    map.set(name, (map.get(name) || 0) + 1);
    return map;
  }, new Map()).entries()].sort((a, b) => b[1] - a[1]);
  const summary = ["fresh", "expiring_soon", "expired"].map((status) => ({
    status,
    item_count: items.filter((item) => item.status === status).length,
  }));
  const maxCount = Math.max(1, ...summary.map((row) => Number(row.item_count)));

  return (
    <section>
      <div className="page-heading">
        <div><p className="eyebrow">INVENTORY INSIGHTS</p><h1>Reports</h1><p className="page-description">A summary of product counts and expiration status.</p></div>
        <button className="secondary-button" type="button" onClick={() => window.print()}>Print report</button>
      </div>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <div className="report-metrics">
        <article className="metric-card"><p>Total products</p><strong>{loading ? "…" : items.length}</strong></article>
        <article className="metric-card"><p>Categories</p><strong>{loading ? "…" : categories.length}</strong></article>
        <article className="metric-card"><p>Units tracked</p><strong>{loading ? "…" : items.length}</strong></article>
      </div>
      <div className="reports-grid">
        <section className="panel report-panel">
          <div className="panel-heading"><div><h2>Expiry status</h2><p>Counts calculated from your inventory records.</p></div></div>
          {summary.map((row) => (
            <div className="bar-row" key={row.status}>
              <div><span>{labels[row.status] || row.status}</span><strong>{row.item_count}</strong></div>
              <div className="bar-track"><span className={`bar-fill ${row.status === "expiring_soon" ? "soon" : row.status}`} style={{ width: `${Math.max(0, Number(row.item_count) / maxCount * 100)}%` }} /></div>
            </div>
          ))}
        </section>
        <section className="panel report-panel">
          <div className="panel-heading"><div><h2>By category</h2><p>Inventory items in each category.</p></div></div>
          {categories.length === 0 ? <p className="empty-inline">No inventory data yet.</p> : categories.map(([name, count]) => (
            <div className="category-report-row" key={name}><span className={`category-report-dot ${name === "Uncategorized" ? "uncategorized" : ""}`} />{name}<strong>{count}</strong></div>
          ))}
        </section>
      </div>
    </section>
  );
}
