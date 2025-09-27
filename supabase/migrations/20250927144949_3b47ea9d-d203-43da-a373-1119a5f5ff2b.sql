-- First, drop all existing RLS policies that reference user_id
DROP POLICY IF EXISTS "Users can view their own forms" ON public.form;
DROP POLICY IF EXISTS "Users can create their own forms" ON public.form;
DROP POLICY IF EXISTS "Users can update their own forms" ON public.form;
DROP POLICY IF EXISTS "Users can delete their own forms" ON public.form;

DROP POLICY IF EXISTS "Users can view questions for their forms" ON public.question;
DROP POLICY IF EXISTS "Users can create questions for their forms" ON public.question;
DROP POLICY IF EXISTS "Users can update questions for their forms" ON public.question;
DROP POLICY IF EXISTS "Users can delete questions for their forms" ON public.question;

DROP POLICY IF EXISTS "Form creators can view answers for their forms" ON public.answer;
DROP POLICY IF EXISTS "Form creators can update answers for their forms" ON public.answer;
DROP POLICY IF EXISTS "Form creators can delete answers for their forms" ON public.answer;

-- Remove the foreign key constraint from form table to auth.users
ALTER TABLE public.form DROP CONSTRAINT IF EXISTS form_user_id_fkey;

-- Now we can safely modify user_id to accept text (email) instead of uuid
ALTER TABLE public.form ALTER COLUMN user_id TYPE text;