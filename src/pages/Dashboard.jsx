import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { listItems } from "../services/records";
import { reportError } from "../lib/errors";

const statusLabels = {
  fresh: "Fresh",
  expiring_soon: "Expiring soon",
  expired: "Expired",
};

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Dashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listItems(user)
      .then((rows) => {
        if (!active) return;
        setItems(rows);
      })
      .catch((loadError) => {
        if (active) setError(reportError("Dashboard data load failed:", loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [user]);

  const countFor = (status) => items.filter((item) => item.status === status).length;

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR INVENTORY</p>
          <h1>Dashboard</h1>
          <p className="page-description">Keep track of what you have and use it before it expires.</p>
        </div>
        <Link className="primary-button" to="/items">＋ Add item</Link>
      </div>

      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <div className="metrics-grid">
        {[
          ["Total items", items.length, "green"],
          ["Fresh", countFor("fresh"), "blue"],
          ["Expiring soon", countFor("expiring_soon"), "amber"],
          ["Expired", countFor("expired"), "rose"],
        ].map(([label, count, color]) => (
          <article className="metric-card" key={label}>
            <div className="metric-top"><span className={`metric-icon ${color}`}>◈</span></div>
            <p>{label}</p>
            <strong>{loading ? "…" : count}</strong>
          </article>
        ))}
      </div>

      <section className="panel overview-panel">
        <div className="panel-heading">
          <div><h2>Expiring first</h2><p>Items that need your attention</p></div>
          <Link className="text-button" to="/expiration">View tracker <span>→</span></Link>
        </div>
        {loading ? <p className="loading-banner">Loading inventory…</p> : items.length === 0 ? (
          <div className="empty-state"><span>□</span><strong>Your inventory is empty</strong><p>Add your first item to start tracking expiration dates.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ITEM</th><th>CATEGORY</th><th>EXPIRES</th><th>STATUS</th></tr></thead>
              <tbody>
                {items.slice(0, 5).map((item) => (
                  <tr key={item.id}>
                    <td><span className="item-name"><span className={`item-dot ${item.status === "expired" ? "expired" : item.status === "expiring_soon" ? "soon" : ""}`} /><strong>{item.name}</strong></span></td>
                    <td>{item.category || "Uncategorized"}</td>
                    <td>{formatDate(item.expiry_date)}</td>
                    <td><span className={`status-badge ${item.status === "expired" ? "expired" : item.status === "expiring_soon" ? "soon" : ""}`}>{statusLabels[item.status]}<small>{item.days_left < 0 ? `${Math.abs(item.days_left)} days ago` : item.days_left === 0 ? "Today" : `${item.days_left} days left`}</small></span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
