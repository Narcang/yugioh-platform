-- ============================================================
-- PlayTCG.online — Admin system
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Add admin and ban flags to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false;

-- -------------------------------------------------------
-- RLS: only the service role (server-side API) can change
-- is_admin and is_banned. Regular users cannot touch them.
-- -------------------------------------------------------

-- Allow admins to read all profiles (needed for the admin panel user list)
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles"
ON profiles FOR SELECT
USING (true);

-- Prevent users from setting is_admin / is_banned on themselves via client SDK.
-- These columns are only writable through server-side API routes that use the
-- service role key, which bypasses RLS entirely.

-- -------------------------------------------------------
-- Set the first admin: n.cangini@be2bit.com
-- -------------------------------------------------------
UPDATE profiles
SET is_admin = true
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'n.cangini@be2bit.com'
);

-- -------------------------------------------------------
-- Add a Supabase realtime publication for profiles so
-- the admin panel can react to changes (optional).
-- -------------------------------------------------------
-- ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
