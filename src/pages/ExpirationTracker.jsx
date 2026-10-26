import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { listItems } from "../services/records";
import { reportError } from "../lib/errors";

const sections = [
  { status: "expired", title: "Expired", description: "Check these items and remove or replace them." },
  { status: "expiring_soon", title: "Expiring within 7 days", description: "Use these items soon." },
  { status: "fresh", title: "Fresh", description: "No immediate action needed." },
];

export default function ExpirationTracker() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    listItems(user).then(setItems).catch((loadError) => setError(reportError("Expiration tracker load failed:", loadError)));
  }, [user]);

  return (
    <section>
      <div className="page-heading">
        <div><p className="eyebrow">USE IT IN TIME</p><h1>Expiration tracker</h1><p className="page-description">Status is calculated from today's date and each item's expiration date.</p></div>
        <Link className="primary-button" to="/items">Manage items</Link>
      </div>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <div className="reports-grid">
        {sections.map(({ status, title, description }) => {
          const group = items.filter((item) => item.status === status);
          return (
            <section className="panel report-panel" key={status}>
              <div className="panel-heading"><div><h2>{title}</h2><p>{description}</p></div><span className={`upcoming-count ${status}`}>{group.length}</span></div>
              {group.length === 0 ? <p className="empty-inline">No items in this group.</p> : group.map((item) => (
                <div className="upcoming-item upcoming-list" key={item.id}>
                  <span className={`item-dot ${status === "expired" ? "expired" : status === "expiring_soon" ? "soon" : ""}`} />
                  <div className="upcoming-name"><strong>{item.name}</strong><small>{item.category || "Uncategorized"} · {item.expiry_date}</small></div>
                  <span className={`status-badge ${status === "expired" ? "expired" : status === "expiring_soon" ? "soon" : ""}`}>
                    {item.days_left < 0 ? `${Math.abs(item.days_left)}d ago` : item.days_left === 0 ? "Today" : `${item.days_left}d`}
                  </span>
                </div>
              ))}
            </section>
          );
        })}
      </div>
    </section>
  );
}
