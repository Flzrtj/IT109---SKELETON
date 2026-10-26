# Shelf Watch

Shelf Watch is a monolithic web app for tracking inventory expiration dates. This repository is the group's IT 109 project skeleton: Supabase Auth, a six-field inventory table protected by Row Level Security, working page navigation, and project architecture documentation.

## Run locally

Requirements: Node.js 20 or newer and a Supabase project.

1. Install dependencies:

   ```sh
   npm install
   ```

2. In the Supabase SQL Editor, run [`001_init.sql`](./supabase/migrations/001_init.sql) to create the inventory table and Row Level Security policies.
3. Copy `.env.example` to `.env`, then add the Supabase project URL and anon/publishable key from **Project Settings → API**:

   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

   `.env` is ignored by Git. Never put a service-role key in this file or the browser app.
4. Start the app:

   ```sh
   npm run dev
   ```

5. Open the local URL printed by Vite. Choose **Explore demo without an account** to inspect and edit sample items in this browser, or sign up/log in for a real Supabase account. Demo-mode changes are stored only in this browser; use a real account to save items to Supabase.

If email confirmation prevents signup, configure a custom SMTP provider in Supabase **Authentication → SMTP Settings**. The app does not bypass confirmation or email rate limits. Demo mode lets you inspect the screens while email delivery is being configured.

## Architecture

Shelf Watch is one React/Vite web application backed by Supabase Auth and PostgreSQL. The main screens have working navigation and the inventory pages use Supabase REST for item CRUD. Per-user access is enforced with PostgreSQL Row Level Security.

See [architecture and project answers](./docs/architecture.md), also available as [Word](./docs/architecture.docx).

## Features

- Supabase email/password authentication and per-user Row Level Security.
- Inventory create, read, update, delete, search, and category/status filtering.
- Dashboard, category browser, expiration tracker, reminders, and reports.
- Local demo mode with sample items; changes stay in the browser.

Reminders are shown in-app and saved as a browser preference. This project does not send reminder emails or push notifications.

## Who did what

Each member should build their assigned part on their own feature branch, open their own pull request into the group branch, and review another teammate's pull request. Do not merge your own pull request. Fill in each member's real name, GitHub username, assigned part, and reviewed pull request number after the work is complete.

| Member name | GitHub username | Part (A–E) | Pull request # |
|---|---|---|---|
| _Add group member_ | _Add username_ | _Add part_ | _Add PR number_ |
| _Add group member_ | _Add username_ | _Add part_ | _Add PR number_ |
