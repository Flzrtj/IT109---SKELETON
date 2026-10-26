import { supabase } from "../supabase";

const DEMO_ITEMS_KEY = "shelf-watch-demo-items";
const DAY_MS = 24 * 60 * 60 * 1000;

function dateOnly(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return dateOnly(date);
}

function getDemoItems() {
  const saved = window.localStorage.getItem(DEMO_ITEMS_KEY);
  if (saved) return JSON.parse(saved);

  const today = new Date();
  const seed = [
    { id: "demo-milk", name: "Fresh milk", category: "Dairy", expiry_on: 3 },
    { id: "demo-rice", name: "Jasmine rice", category: "Pantry", expiry_on: 120 },
    { id: "demo-yogurt", name: "Greek yogurt", category: "Dairy", expiry_on: -2 },
    { id: "demo-apples", name: "Red apples", category: "Produce", expiry_on: 6 },
  ].map(({ expiry_on, ...item }) => ({
    ...item,
    user_id: "shelf-watch-demo",
    expiry_date: addDays(expiry_on),
    created_at: today.toISOString(),
  }));
  window.localStorage.setItem(DEMO_ITEMS_KEY, JSON.stringify(seed));
  return seed;
}

function withExpiryStatus(item) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(`${item.expiry_date}T00:00:00`);
  const daysLeft = Math.round((expiry - today) / DAY_MS);
  return {
    ...item,
    days_left: daysLeft,
    status: daysLeft < 0 ? "expired" : daysLeft <= 7 ? "expiring_soon" : "fresh",
  };
}

function saveDemoItems(items) {
  window.localStorage.setItem(DEMO_ITEMS_KEY, JSON.stringify(items));
}

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export async function listItems(user) {
  if (user?.isDemo) return getDemoItems().map(withExpiryStatus).sort((a, b) => a.expiry_date.localeCompare(b.expiry_date));

  const { data, error } = await requireSupabase()
    .from("items")
    .select("id, user_id, name, category, expiry_date, created_at")
    .order("expiry_date", { ascending: true });
  if (error) throw error;
  return data.map(withExpiryStatus);
}

export async function createItem(values, user) {
  if (user?.isDemo) {
    const items = getDemoItems();
    const item = {
      ...values,
      id: crypto.randomUUID(),
      user_id: user.id,
      created_at: new Date().toISOString(),
    };
    saveDemoItems([...items, item]);
    return withExpiryStatus(item);
  }

  const { data, error } = await requireSupabase()
    .from("items")
    .insert({ ...values, user_id: user.id })
    .select("id, user_id, name, category, expiry_date, created_at")
    .single();
  if (error) throw error;
  return withExpiryStatus(data);
}

export async function updateItem(id, values, user) {
  if (user?.isDemo) {
    const items = getDemoItems().map((item) => item.id === id ? { ...item, ...values } : item);
    saveDemoItems(items);
    return withExpiryStatus(items.find((item) => item.id === id));
  }

  const { data, error } = await requireSupabase()
    .from("items")
    .update(values)
    .eq("id", id)
    .select("id, user_id, name, category, expiry_date, created_at")
    .single();
  if (error) throw error;
  return withExpiryStatus(data);
}

export async function deleteItem(id, user) {
  if (user?.isDemo) {
    saveDemoItems(getDemoItems().filter((item) => item.id !== id));
    return;
  }

  const { error } = await requireSupabase().from("items").delete().eq("id", id);
  if (error) throw error;
}
