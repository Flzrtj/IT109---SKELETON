# Shelf Watch — Architecture

## Project map answers

1. **Architecture:** Monolithic web application. One React/Vite codebase is appropriate for this small inventory system and is straightforward for the group to run, review, and deploy.
2. **Main record:** `items` has six fields: `id`, `user_id`, `name`, `category`, `expiry_date`, and `created_at`.
3. **Users and roles:** An authenticated inventory owner can manage their own records. Supabase Auth provides identity, while Row Level Security (RLS) restricts each user to their own items. Demo mode is local to one browser and is not a Supabase account.
4. **Track:** Web application, built with React and Vite.

## System diagram

```text
┌───────────────────────────────────────────────┐
│ React + Vite web app (one monolithic app)      │
│ Dashboard · Items · Categories · Expiration   │
│ Reminders · Reports · Login / Sign up         │
└──────────────────────┬────────────────────────┘
                       │ Supabase client + user session
          ┌────────────┴─────────────┐
          │                          │
┌─────────▼────────────┐  ┌──────────▼─────────────┐
│ Supabase Auth        │  │ Supabase PostgreSQL    │
│ email + password     │  │ items table + RLS      │
└──────────────────────┘  └────────────────────────┘
```

The app uses one React/Vite codebase, so the screens and services run together as a monolithic web application. Supabase provides authentication and PostgreSQL. Item create, read, update, and delete requests use Supabase's REST interface. RLS policies ensure that users can access only their own records. The main screens have working navigation.

## Main database record

The `items` table has six fields:

| Field | Type | Purpose |
|---|---|---|
| `id` | UUID | Item identifier |
| `user_id` | UUID | Owner; references Supabase Auth |
| `name` | text | Product or inventory item name |
| `category` | text | Category label |
| `expiry_date` | date | Expiration date |
| `created_at` | timestamptz | Creation time |

## Users and roles

The application has one role: an authenticated inventory owner. Users sign up and log in through Supabase Auth. PostgreSQL RLS policies restrict reads and writes to records whose `user_id` matches the current user. Authorization is enforced by PostgreSQL, not only by the interface.

## Track

**Web.** The responsive React/Vite client runs in desktop and mobile web browsers and uses the group's Supabase project for authentication and data storage.

## Project map

```text
.
├── docs/
│   ├── architecture.md
│   └── architecture.docx
├── src/
│   ├── App.jsx                 # Routes, navigation, and auth protection
│   ├── lib/
│   │   ├── AuthContext.jsx     # Supabase and local demo session
│   │   └── errors.js           # Friendly error messages
│   ├── pages/                  # Main screens and authentication forms
│   ├── services/
│   │   ├── authService.js      # Supabase Auth calls
│   │   └── records.js          # Inventory REST CRUD
│   └── supabase.js             # Client initialized from Vite environment
├── supabase/
│   └── migrations/
│       └── 001_init.sql        # items table and RLS policies
├── .env.example
├── index.html
└── package.json
```

## Security

- The browser uses only the Supabase URL and anon/publishable key from `.env`.
- Never put a Supabase service-role key in frontend code or commit it.
- RLS protects item rows so signed-in users can access only their own records.
- Authentication and database errors are logged for debugging; the UI displays friendly messages.
- Demo mode stores example items in this browser's local storage and does not write to Supabase.
