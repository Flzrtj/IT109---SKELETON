import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { listItems } from "../services/records";
import { reportError } from "../lib/errors";

export default function Categories() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    listItems(user).then(setItems).catch((loadError) => setError(reportError("Category inventory load failed:", loadError)));
  }, [user]);

  const counts = items.reduce((result, item) => {
    const category = item.category || "Uncategorized";
    result.set(category, (result.get(category) || 0) + 1);
    return result;
  }, new Map());
  const categories = [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <section>
      <div className="page-heading">
        <div><p className="eyebrow">ORGANIZE</p><h1>Categories</h1><p className="page-description">Browse your inventory by category. Assign a category when adding or editing an item.</p></div>
        <Link className="primary-button" to="/items">＋ Add item</Link>
      </div>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <div className="category-layout">
        <section className="panel category-form-panel">
          <h2>Your categories</h2>
          <p>Categories are created automatically when you assign them to an item.</p>
          {categories.length === 0 ? (
            <div className="empty-state"><span>▦</span><strong>No categories yet</strong><p>Add an item with a category to see it here.</p></div>
          ) : categories.map(([name, count]) => (
            <Link className="category-report-row" key={name} to={`/items?category=${encodeURIComponent(name)}`}>
              <span className={`category-report-dot ${name === "Uncategorized" ? "uncategorized" : ""}`} />
              {name}<strong>{count} {count === 1 ? "item" : "items"}</strong>
            </Link>
          ))}
        </section>
        <section className="panel">
          <div className="panel-heading"><div><h2>How categories work</h2><p>Category names live on each inventory item.</p></div></div>
          <div className="upcoming-list">
            <div className="upcoming-item"><span className="metric-icon green">＋</span><div className="upcoming-name"><strong>Create a category</strong><small>Add or edit an item and enter a category name.</small></div></div>
            <div className="upcoming-item"><span className="metric-icon blue">⌕</span><div className="upcoming-name"><strong>Browse a category</strong><small>Select a category above to filter the item list.</small></div></div>
          </div>
        </section>
      </div>
    </section>
  );
}
