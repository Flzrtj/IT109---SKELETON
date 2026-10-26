import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { friendlyAuthError, logIn } from "../services/authService";
import { useAuth } from "../lib/AuthContext";
import { reportError } from "../lib/errors";

const fieldStyle = { display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "1rem" };
const inputStyle = { padding: "0.5rem", font: "inherit", boxSizing: "border-box", width: "100%" };

export default function Login() {
  const { user, startDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Already signed in: skip the form
  if (user) return <Navigate to={from} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await logIn(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      reportError("Log in failed:", err);
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ maxWidth: "24rem" }}>
      <h1>Log in</h1>
      <form onSubmit={handleSubmit}>
        <div style={fieldStyle}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={fieldStyle}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
        </div>

        {error && <p role="alert" style={{ color: "#b00020" }}>{error}</p>}

        <button type="submit" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p>
        New to Shelf Watch? <Link to="/signup">Create an account</Link>
      </p>
      <button
        type="button"
        className="secondary-button"
        onClick={() => {
          startDemo();
          navigate("/", { replace: true });
        }}
      >
        Explore demo without an account
      </button>
    </section>
  );
}
