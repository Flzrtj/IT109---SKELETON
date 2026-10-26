import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { logOut } from "./services/authService";
import { isSupabaseConfigured } from "./supabase";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import ItemList from "./pages/ItemList";
import Categories from "./pages/Categories";
import ExpirationTracker from "./pages/ExpirationTracker";
import Reminders from "./pages/Reminders";
import Reports from "./pages/Reports";
import { reportError } from "./lib/errors";

// The navigation follows the system modules and the IT 109 integration test page.
const links = [
  { to: "/", label: "Dashboard", icon: "⌂", end: true },
  { to: "/items", label: "Items", icon: "▤" },
  { to: "/categories", label: "Categories", icon: "▦" },
  { to: "/expiration", label: "Expiration", icon: "◷" },
  { to: "/reminders", label: "Reminders", icon: "♧" },
  { to: "/reports", label: "Reports", icon: "▥" },
];

function NavBar() {
  const { user, endDemo } = useAuth();
  const location = useLocation();
  const currentPage = links.find(({ to, end }) =>
    end ? location.pathname === to : location.pathname.startsWith(to),
  )?.label || "Shelf Watch";

  async function handleLogOut() {
    if (user?.isDemo) {
      endDemo();
      return;
    }

    try {
      await logOut();
    } catch (err) {
      reportError("Log out failed:", err);
      alert("Could not log out. Check your connection and try again.");
    }
  }

  return (
    <>
      <aside className="sidebar">
        <NavLink className="brand" to="/" aria-label="Shelf Watch dashboard">
          <span className="brand-mark">S</span>
          <span><strong>Shelf Watch</strong><small>EXPIRY TRACKER</small></span>
        </NavLink>
        <p className="nav-caption">WORKSPACE</p>
        <nav className="main-nav" aria-label="Main">
          {user ? links.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
              <span className="nav-icon" aria-hidden="true">{icon}</span>{label}
            </NavLink>
          )) : (
            <>
              <NavLink className="nav-link" to="/login"><span className="nav-icon">↪</span>Log in</NavLink>
              <NavLink className="nav-link" to="/signup"><span className="nav-icon">＋</span>Sign up</NavLink>
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip"><span>✦</span><strong>Use it in time</strong><p>Check the expiration tracker to find items that need attention.</p></div>
          {user && <div className="user-card"><span className="avatar">{(user.email || "D").slice(0, 1).toUpperCase()}</span><span className="user-email">{user.isDemo ? "Demo account" : user.email}</span><button className="icon-button signout-button" type="button" onClick={handleLogOut} aria-label={user.isDemo ? "Exit demo" : "Log out"} title={user.isDemo ? "Exit demo" : "Log out"}>↪</button></div>}
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="breadcrumbs"><span>Shelf Watch</span><span className="crumb-separator">/</span><strong>{currentPage}</strong></div>
          <div className="topbar-right"><span className="today-label">{new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span><span className="top-avatar">{user ? (user.email || "D").slice(0, 1).toUpperCase() : "S"}</span></div>
        </header>
        <main className="page-content">
          <DemoNotice />
          <AuthErrorNotice />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/items" element={<ProtectedRoute><ItemList /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
            <Route path="/expiration" element={<ProtectedRoute><ExpirationTracker /></ProtectedRoute>} />
            <Route path="/reminders" element={<ProtectedRoute><Reminders /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

// Sends signed-out visitors to /login, then back to the page they wanted
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p>Loading…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function AuthErrorNotice() {
  const { authError } = useAuth();

  if (!authError) return null;
  return (
    <p className="alert alert-error" role="alert">
      Could not restore your session. Check your connection and Supabase configuration.
    </p>
  );
}

function DemoNotice() {
  const { user } = useAuth();

  if (!user?.isDemo) return null;
  return (
    <p className="alert demo-notice" role="status">
      Demo mode: explore the pages without creating an account. Demo activity is
      not saved to Supabase.
    </p>
  );
}

export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <main className="setup-screen">
        <section className="setup-card">
          <div className="brand-mark" aria-hidden="true">S</div>
          <p className="eyebrow">SETUP REQUIRED</p>
          <h1>Connect Shelf Watch to Supabase</h1>
          <p>
            Add your Supabase project URL and anon key to a <code>.env</code> file
            in the project root, then restart the development server.
          </p>
          <pre className="code-block">{`VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key`}</pre>
          <p className="setup-note">
            Use the anon/public key only. Never put your service-role key in this
            browser application.
          </p>
        </section>
      </main>
    );
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-shell"><NavBar /></div>
      </AuthProvider>
    </BrowserRouter>
  );
}
