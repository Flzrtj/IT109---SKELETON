// Every Supabase Auth call lives here, so pages never talk to Supabase directly.
import { supabase } from "../supabase";

function getSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Add the required values to .env and restart the app.");
  }
  return supabase;
}

export async function signUp(email, password) {
  const { data, error } = await getSupabase().auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;

  // With email confirmation on, Supabase hides duplicate emails by returning
  // a user with no identities instead of an error.
  if (data.user && data.user.identities?.length === 0) {
    throw new Error("An account with this email already exists. Log in instead.");
  }

  // session is null when the user still has to confirm their email
  return { user: data.user, needsConfirmation: !data.session };
}

export async function logIn(email, password) {
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function logOut() {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw error;
  return data.session;
}

// Calls back with the session on log in, log out and token refresh.
// Returns a function that stops listening.
export function onAuthChange(callback) {
  const { data } = getSupabase().auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

export function friendlyAuthError(err) {
  const message = (err?.message || "").toLowerCase();
  if (message.includes("invalid login credentials")) return "Email or password is incorrect.";
  if (message.includes("email not confirmed")) return "Confirm your email first. Check your inbox for the confirmation link.";
  if (message.includes("email") && message.includes("rate limit")) {
    return "Supabase's email sender has reached its limit or cannot send to this address. The app cannot bypass this limit. Check your inbox and Spam folder for an earlier confirmation email, then configure custom SMTP in Supabase before trying again.";
  }
  if (message.includes("error sending confirmation email")) {
    return "Supabase could not send the signup confirmation email. The account may not be usable until email delivery is fixed. Check Supabase Authentication logs and configure custom SMTP, or temporarily disable email confirmation for testing.";
  }
  if (message.includes("rate limit")) {
    return "Supabase has temporarily limited requests. Wait a few minutes before trying again, and avoid repeated submissions.";
  }
  return "Could not complete the authentication request. Try again or contact the project administrator.";
}
