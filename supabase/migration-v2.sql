-- ============================================================================
-- MIGRATION v2 — Run this ONCE if you already installed the old schema
-- ============================================================================
-- What it does:
--   1. Removes the CHECK constraint on `type` column so you can add custom
--      appointment types like "مقابلة إعلامية", "درس خارجي", etc.
--   2. Updates the الشيخ → الحبيب rename in the seed user.
--
-- How to run:
--   Open Supabase Dashboard → SQL Editor → New query → paste this → Run
-- ============================================================================

-- 1. Drop the type CHECK constraint (name may vary — try both)
alter table appointments drop constraint if exists appointments_type_check;

-- 2. Rename the seed user (if it still has the old title)
update users
   set name = 'الحبيب حامد بن عمر'
 where id = 'u_hamed' and name = 'الشيخ حامد بن عمر';

-- 3. Verify
select 'Migration complete' as status,
       (select count(*) from appointments) as appointments_count,
       (select name from users where id = 'u_hamed') as owner_name;
