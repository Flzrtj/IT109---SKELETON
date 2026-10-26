import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { listItems } from "../services/records";
import { reportError } from "../lib/errors";

const WINDOWS = [3, 7, 14, 30];

export default function Reminders() {
  const { user } = useAuth();
  const [days, setDays] = useState(() =>
    Number(window.localStorage.getItem(`shelf-watch-reminder-${user.id}`)) || 7,
  );
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    listItems(user).then(setItems).catch((loadError) => setError(reportError("Reminder inventory load failed:", loadError)));
  }, [user]);

  function changeDays(event) {
    const value = Number(event.target.value);
    setDays(value);
    window.localStorage.setItem(`shelf-watch-reminder-${user.id}`, String(value));
  }

  const upcoming = items
    .filter((item) => item.days_left >= 0 && item.days_left <= days)
    .sort((a, b) => a.days_left - b.days_left);

  return (
    <section>
      <div className="page-heading">
        <div><p className="eyebrow">STAY AHEAD</p><h1>Reminders</h1><p className="page-description">Choose an in-app reminder window for items nearing their expiration date.</p></div>
      </div>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <div className="reminder-layout">
        <section className="panel category-form-panel reminder-settings">
          <div className="settings-title"><span className="metric-icon amber">◷</span><h2>Reminder window</h2><p>Show items expiring within this many days.</p></div>
          <label className="field-label" htmlFor="reminder-window">Notify me within</label>
          <select id="reminder-window" value={days} onChange={changeDays}>
            {WINDOWS.map((value) => <option key={value} value={value}>{value} days</option>)}
          </select>
          <p className="settings-footnote">This preference is saved in this browser. Reminders are shown in the app; no email or push notifications are sent.</p>
        </section>
        <section className="panel">
          <div className="panel-heading"><div><h2>Coming up</h2><p>{upcoming.length} {upcoming.length === 1 ? "item" : "items"} within {days} days</p></div><Link className="text-button" to="/expiration">Open tracker <span>→</span></Link></div>
          {upcoming.length === 0 ? <div className="empty-state"><span>✓</span><strong>Nothing coming up</strong><p>Items inside your reminder window will appear here.</p></div> : (
            <div className="upcoming-list">{upcoming.map((item) => (
              <div className="upcoming-item" key={item.id}>
                <div className="calendar-tile"><strong>{new Date(`${item.expiry_date}T00:00:00`).getDate()}</strong><small>{new Date(`${item.expiry_date}T00:00:00`).toLocaleDateString(undefined, { month: "short" })}</small></div>
                <div className="upcoming-name"><strong>{item.name}</strong><small>{item.category || "Uncategorized"} · {item.days_left === 0 ? "Expires today" : `${item.days_left} days left`}</small></div>
              </div>
            ))}</div>
          )}
        </section>
      </div>
    </section>
  );
}
