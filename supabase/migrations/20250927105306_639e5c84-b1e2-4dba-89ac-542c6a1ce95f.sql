-- Fix user_id to be NOT NULL since RLS requires it
ALTER TABLE public.forms ALTER COLUMN user_id SET NOT NULL;