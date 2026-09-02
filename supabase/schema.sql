-- ============================================================================
-- مواعيد حامد بن عمر - Maw3idi Database Schema
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/_/sql
-- ============================================================================

-- Drop existing tables (safe re-run)
drop table if exists activity_log cascade;
drop table if exists notifications cascade;
drop table if exists appointments cascade;
drop table if exists drivers cascade;
drop table if exists users cascade;

-- ============================================================================
-- USERS (owner / assistant / admin)
-- ============================================================================
create table users (
  id text primary key,
  name text not null,
  role text not null check (role in ('owner','assistant','admin')),
  avatar text,
  phone text,
  created_at timestamptz default now()
);

-- ============================================================================
-- DRIVERS
-- ============================================================================
create table drivers (
  id text primary key,
  name text not null,
  phone text,
  avatar text,
  status text not null default 'available' check (status in ('available','busy','off')),
  joined_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- APPOINTMENTS
-- ============================================================================
create table appointments (
  id text primary key,
  title text not null,
  type text not null default 'meeting' check (type in ('lesson','meeting','visit','travel','personal','urgent')),
  start_iso timestamptz not null,
  end_iso timestamptz not null,
  location text,
  notes text,
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  needs_driver boolean default false,
  driver_id text references drivers(id) on delete set null,
  requested_driver_id text,
  status text not null default 'confirmed'
    check (status in ('pending','awaiting','confirmed','onway','arrived','completed','cancelled','declined')),
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index appointments_start_idx on appointments(start_iso);
create index appointments_driver_idx on appointments(driver_id);
create index appointments_status_idx on appointments(status);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================
create table notifications (
  id text primary key,
  target_role text not null,          -- 'owner' | 'assistant' | 'admin' | 'driver'
  target_id text,                      -- specific driver_id if role='driver'
  kind text not null,                  -- 'assign' | 'accept' | 'decline' | 'status' | 'conflict' | 'reminder' | 'urgent'
  title text not null,
  body text,
  appointment_id text,
  read boolean default false,
  created_at timestamptz default now()
);

create index notifications_target_idx on notifications(target_role, target_id);
create index notifications_created_idx on notifications(created_at desc);

-- ============================================================================
-- ACTIVITY LOG
-- ============================================================================
create table activity_log (
  id text primary key,
  actor_id text,
  actor_name text,
  actor_role text,
  action text not null,
  appointment_id text,
  details jsonb,
  created_at timestamptz default now()
);

create index activity_log_created_idx on activity_log(created_at desc);
create index activity_log_appt_idx on activity_log(appointment_id);

-- ============================================================================
-- ROW LEVEL SECURITY (permissive for MVP — team app with shared workspace)
-- ============================================================================
alter table users enable row level security;
alter table drivers enable row level security;
alter table appointments enable row level security;
alter table notifications enable row level security;
alter table activity_log enable row level security;

-- Allow anon key to read + write everything (shared team workspace)
-- Tighten these later if you add Supabase Auth
create policy "anon_all_users"        on users        for all using (true) with check (true);
create policy "anon_all_drivers"      on drivers      for all using (true) with check (true);
create policy "anon_all_appointments" on appointments for all using (true) with check (true);
create policy "anon_all_notifications" on notifications for all using (true) with check (true);
create policy "anon_all_activity"     on activity_log for all using (true) with check (true);

-- ============================================================================
-- REALTIME — enable live subscriptions on all tables
-- ============================================================================
alter publication supabase_realtime add table users;
alter publication supabase_realtime add table drivers;
alter publication supabase_realtime add table appointments;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table activity_log;

-- ============================================================================
-- AUTO-UPDATE updated_at
-- ============================================================================
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger drivers_touch      before update on drivers      for each row execute function touch_updated_at();
create trigger appointments_touch before update on appointments for each row execute function touch_updated_at();

-- ============================================================================
-- SEED DATA
-- ============================================================================
insert into users (id, name, role, phone, avatar) values
  ('u_hamed',    'الشيخ حامد بن عمر', 'owner',     '+967 771 000 001', '/logo.jpg'),
  ('u_abdullah', 'عبدالله المعلم',     'assistant', '+967 771 000 002', null),
  ('u_admin',    'إدارة المكتب',       'admin',     '+967 771 000 003', null);

insert into drivers (id, name, phone, status) values
  ('d_ahmed', 'أحمد سالم بامطرف',    '+967 771 111 111', 'available'),
  ('d_mohd',  'محمد بن سعيد باكثير', '+967 771 222 222', 'available');

-- Sample appointments anchored to "today"
-- These are examples; the app will let you create real ones from the UI
insert into appointments (id, title, type, start_iso, end_iso, location, priority, needs_driver, driver_id, status, created_by) values
  ('a_seed_1', 'درس الحكم العطائية', 'lesson',
   (current_date + interval '9 hours')::timestamptz,
   (current_date + interval '10 hours 30 minutes')::timestamptz,
   'رباط تريم', 'high', true, 'd_ahmed', 'completed', 'u_abdullah'),

  ('a_seed_2', 'استقبال وفد ماليزيا', 'meeting',
   (current_date + interval '11 hours 30 minutes')::timestamptz,
   (current_date + interval '13 hours')::timestamptz,
   'دار المصطفى', 'high', true, 'd_ahmed', 'confirmed', 'u_abdullah'),

  ('a_seed_3', 'اجتماع في سيئون', 'meeting',
   (current_date + interval '16 hours 30 minutes')::timestamptz,
   (current_date + interval '18 hours')::timestamptz,
   'سيئون', 'normal', true, null, 'pending', 'u_abdullah'),

  ('a_seed_4', 'مجلس المغرب', 'lesson',
   (current_date + interval '19 hours 30 minutes')::timestamptz,
   (current_date + interval '21 hours')::timestamptz,
   'مسجد المحضار', 'normal', false, null, 'confirmed', 'u_hamed');

insert into notifications (id, target_role, target_id, kind, title, body, appointment_id) values
  ('n_seed_1', 'driver', 'd_ahmed', 'assign', 'تم تعيينك لموعد جديد',   'استقبال وفد ماليزيا - دار المصطفى', 'a_seed_2'),
  ('n_seed_2', 'admin',   null,     'conflict','موعد بدون سائق',        'اجتماع في سيئون يحتاج تعيين سائق', 'a_seed_3');

insert into activity_log (id, actor_id, actor_name, actor_role, action, appointment_id, details) values
  ('l_seed_1', 'u_abdullah', 'عبدالله المعلم',     'assistant', 'appointment.created',  'a_seed_2', '{}'),
  ('l_seed_2', 'u_abdullah', 'عبدالله المعلم',     'assistant', 'appointment.assigned', 'a_seed_2', '{"driver":"أحمد"}'),
  ('l_seed_3', 'd_ahmed',    'أحمد سالم بامطرف',   'driver',    'trip.accepted',        'a_seed_2', '{}');

-- ============================================================================
-- DONE
-- ============================================================================
select 'Setup complete. Tables: users, drivers, appointments, notifications, activity_log' as status;
