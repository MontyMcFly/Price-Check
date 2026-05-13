-- Add package_size column to products table
-- This stores how many individual units are in one package (e.g. 6 for a 6-pack)
-- Run this in your Supabase SQL Editor

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS package_size INTEGER DEFAULT 1;

-- Also ensure quantity_amount and unit columns exist (from previous migration)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS quantity_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS unit TEXT;
