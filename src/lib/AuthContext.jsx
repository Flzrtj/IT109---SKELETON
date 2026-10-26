import { createContext, useContext, useEffect, useState } from "react";
import { getSession, onAuthChange } from "../services/authService";
import { isSupabaseConfigured } from "../supabase";
import { reportError } from "./errors";

const DEMO_STORAGE_KEY = "shelf-watch-demo-session";
const demoUser = {
  id: "shelf-watch-demo",
  email: "demo@shelfwatch.local",
  isDemo: true,
};

const AuthContext = createContext({
  user: null,
  loading: true,
  authError: null,
  startDemo: () => {},
  endDemo: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    window.localStorage.getItem(DEMO_STORAGE_KEY) === "true" ? demoUser : null,
  );
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (user?.isDemo) {
      setLoading(false);
      return undefined;
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return undefined;
    }

    let active = true;

    // Restore the session after a page refresh
    getSession()
      .then((session) => {
        if (active) {
          setUser(session?.user ?? null);
          setAuthError(null);
        }
      })
      .catch((error) => {
        if (active) {
          reportError("Could not restore Supabase session:", error);
          setAuthError(error);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    // Keep the user in sync with log in, log out and token refresh
    const stopListening = onAuthChange((session) => {
      setUser(session?.user ?? null);
      setAuthError(null);
      setLoading(false);
    });

    return () => {
      active = false;
      stopListening();
    };
  }, [user?.isDemo]);

  function startDemo() {
    window.localStorage.setItem(DEMO_STORAGE_KEY, "true");
    setAuthError(null);
    setUser(demoUser);
    setLoading(false);
  }

  function endDemo() {
    window.localStorage.removeItem(DEMO_STORAGE_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, authError, startDemo, endDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
