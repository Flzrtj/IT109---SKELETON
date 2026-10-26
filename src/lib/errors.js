export function reportError(context, error) {
  console.error(context, error);
  return "Could not complete this action. Check your connection and Supabase setup, then try again.";
}
