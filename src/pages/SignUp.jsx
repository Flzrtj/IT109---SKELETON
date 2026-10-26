import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { friendlyAuthError, signUp } from "../services/authService";
import { useAuth } from "../lib/AuthContext";
import { reportError } from "../lib/errors";

const MIN_PASSWORD_LENGTH = 8;
const fieldStyle = { display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "1rem" };
const inputStyle = { padding: "0.5rem", font: "inherit", boxSizing: "border-box", width: "100%" };

export default function SignUp() {
  const { user, startDemo } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmSentTo, setConfirmSentTo] = useState("");

  // Already signed in: skip the form
  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const { needsConfirmation } = await signUp(email.trim(), password);
      if (needsConfirmation) {
        setConfirmSentTo(email.trim());
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      reportError("Sign up failed:", err);
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  if (confirmSentTo) {
    return (
      <section style={{ maxWidth: "24rem" }}>
        <h1>Check your email</h1>
        <p>
          We sent a confirmation link to <strong>{confirmSentTo}</strong>. Open it, then{" "}
          <Link to="/login">log in</Link>.
        </p>
      </section>
    );
  }

  return (
    <section style={{ maxWidth: "24rem" }}>
      <h1>Create an account</h1>
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
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={fieldStyle}>
          <label htmlFor="confirm">Confirm password</label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={inputStyle}
          />
        </div>

        {error && (
          <p role="alert" style={{ color: "#b00020" }}>
            {error}
            {(error.includes("email sender") || error.includes("confirmation email")) && (
              <>
                {" "}
                <a
                  href="https://supabase.com/dashboard/project/rrgzkvngjevxznfowsya/auth/smtp"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Supabase SMTP settings
                </a>
                {" "}and configure a custom email provider.
              </>
            )}
          </p>
        )}

        <button type="submit" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Log in</Link>
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
