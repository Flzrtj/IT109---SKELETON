import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { createItem, deleteItem, listItems, updateItem } from "../services/records";
import { reportError } from "../lib/errors";

const blankForm = { name: "", category: "", expiry_date: "" };

function ItemForm({ initialValue, onCancel, onSave, busy }) {
  const [form, setForm] = useState(initialValue);

  function change(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function submit(event) {
    event.preventDefault();
    onSave({ ...form, name: form.name.trim(), category: form.category.trim() || "Uncategorized" });
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="item-form-title">
        <div className="modal-heading">
          <h2 id="item-form-title">{initialValue.id ? "Edit item" : "Add inventory item"}</h2>
          <button className="icon-button" type="button" onClick={onCancel} aria-label="Close">×</button>
        </div>
        <form className="item-form" onSubmit={submit}>
          <label>Item name<input name="name" required maxLength="100" value={form.name} onChange={change} autoFocus /></label>
          <div className="form-grid">
            <label>Category<input name="category" maxLength="60" value={form.category} onChange={change} placeholder="Uncategorized" /></label>
            <label>Expiration date<input name="expiry_date" type="date" required value={form.expiry_date} onChange={change} /></label>
          </div>
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
            <button className="primary-button" type="submit" disabled={busy}>{busy ? "Saving…" : "Save item"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function todayString() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

export default function ItemList() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category") || "";
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      setItems(await listItems(user));
      setError("");
    } catch (loadError) {
      setError(reportError("Inventory load failed:", loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [user]);

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category || "Uncategorized"))].sort(),
    [items],
  );
  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase())
    && (!selectedCategory || (item.category || "Uncategorized") === selectedCategory)
    && (!status || item.status === status),
  );

  async function save(values) {
    setBusy(true);
    setError("");
    try {
      if (form.id) await updateItem(form.id, values, user);
      else await createItem(values, user);
      setForm(null);
      await refresh();
    } catch (saveError) {
      setError(reportError("Inventory save failed:", saveError));
    } finally {
      setBusy(false);
    }
  }

  async function remove(item) {
    if (!window.confirm(`Delete "${item.name}" from your inventory?`)) return;
    setError("");
    try {
      await deleteItem(item.id, user);
      await refresh();
    } catch (deleteError) {
      setError(reportError("Inventory delete failed:", deleteError));
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div><p className="eyebrow">INVENTORY</p><h1>Items</h1><p className="page-description">Add, search, update, and remove the things you track.</p></div>
        <button className="primary-button" type="button" onClick={() => setForm({ ...blankForm, expiry_date: todayString() })}>＋ Add item</button>
      </div>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <section className="panel">
        <div className="inventory-toolbar">
          <input className="search-box" type="search" aria-label="Search items" placeholder="Search inventory…" value={query} onChange={(event) => setQuery(event.target.value)} />
          <select aria-label="Filter by category" value={selectedCategory} onChange={(event) => setSearchParams(event.target.value ? { category: event.target.value } : {})}>
            <option value="">All categories</option>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
          <select aria-label="Filter by expiry status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option><option value="fresh">Fresh</option><option value="expiring_soon">Expiring soon</option><option value="expired">Expired</option>
          </select>
        </div>
        {loading ? <p className="loading-banner">Loading inventory…</p> : filtered.length === 0 ? (
          <div className="empty-state"><span>□</span><strong>{items.length ? "No matching items" : "No items yet"}</strong><p>{items.length ? "Change your search or filters." : "Add an item to begin tracking its expiration date."}</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ITEM</th><th>CATEGORY</th><th>EXPIRES</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
              <tbody>{filtered.map((item) => (
                <tr key={item.id}>
                  <td><span className="item-name"><span className={`item-dot ${item.status === "expired" ? "expired" : item.status === "expiring_soon" ? "soon" : ""}`} /><strong>{item.name}</strong></span></td>
                  <td>{item.category || "Uncategorized"}</td><td>{item.expiry_date}</td>
                  <td><span className={`status-badge ${item.status === "expired" ? "expired" : item.status === "expiring_soon" ? "soon" : ""}`}>{item.status === "expired" ? "Expired" : item.status === "expiring_soon" ? "Expiring soon" : "Fresh"}<small>{item.days_left < 0 ? `${Math.abs(item.days_left)} days ago` : item.days_left === 0 ? "Today" : `${item.days_left} days left`}</small></span></td>
                  <td><button className="text-button" type="button" onClick={() => setForm({ id: item.id, name: item.name, category: item.category || "", expiry_date: item.expiry_date })}>Edit</button>{" "}<button className="text-button" type="button" onClick={() => remove(item)}>Delete</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
      {form && <ItemForm initialValue={form} onCancel={() => setForm(null)} onSave={save} busy={busy} />}
    </section>
  );
}
