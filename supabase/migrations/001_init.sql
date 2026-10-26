-- 001_init.sql: Shelf Watch (Expiration Tracking System)
-- Main table: items (6 fields). Serves all five subsystems:
--   Item Management      -> add / edit / delete / list rows
--   Categorization       -> the `category` column
--   Expiration Tracking  -> the `expiry_date` column + items_with_status view
--   Reminders            -> reads items nearing `expiry_date`
--   Reporting & Insights -> aggregates over items / items_with_status

create table public.items (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null default auth.uid()
                           references auth.users (id) on delete cascade,
  name         text        not null,
  category     text        not null default 'Uncategorized',
  expiry_date  date        not null,
  created_at   timestamptz not null default now()
);

create index items_user_expiry_idx on public.items (user_id, expiry_date);

-- Row level security: each user only sees and changes their own items
alter table public.items enable row level security;

create policy "Users can view their own items"
  on public.items for select
  using (auth.uid() = user_id);

create policy "Users can add their own items"
  on public.items for insert
  with check (auth.uid() = user_id);

create policy "Users can edit their own items"
  on public.items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own items"
  on public.items for delete
  using (auth.uid() = user_id);

-- Expiration tracking: days left and status are computed, not stored,
-- so they are always correct without a nightly update job.
create view public.items_with_status
with (security_invoker = true) as
select
  i.*,
  (i.expiry_date - current_date) as days_left,
  case
    when i.expiry_date < current_date       then 'expired'
    when i.expiry_date <= current_date + 7  then 'expiring_soon'
    else 'fresh'
  end as status
from public.items i;
