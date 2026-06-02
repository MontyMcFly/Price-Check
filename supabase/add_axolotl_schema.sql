-- ============================================================
-- MIGRATION: Gamification / Axolotl Pet
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Add gamification columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS pet_name TEXT DEFAULT 'Axolito';

-- Allow users to update their own XP and level
-- (The existing "Users can update own profile" policy should cover this, 
--  but we can explicitly ensure it exists)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
