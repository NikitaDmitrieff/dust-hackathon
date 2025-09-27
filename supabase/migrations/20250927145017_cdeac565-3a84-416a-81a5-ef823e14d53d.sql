-- Create a simple email-based authentication table for tracking users
CREATE TABLE IF NOT EXISTS public.simple_users (
  email text PRIMARY KEY,
  display_name text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on simple_users
ALTER TABLE public.simple_users ENABLE ROW LEVEL SECURITY;

-- Allow users to see and manage their own records
CREATE POLICY "Users can view their own profile" ON public.simple_users
FOR SELECT USING (email = current_setting('app.user_email', true));

CREATE POLICY "Users can insert their own profile" ON public.simple_users  
FOR INSERT WITH CHECK (email = current_setting('app.user_email', true));

-- Recreate RLS policies for form table to use email instead of auth.uid()
CREATE POLICY "Users can view their own forms" ON public.form
FOR SELECT USING (user_id = current_setting('app.user_email', true));

CREATE POLICY "Users can create their own forms" ON public.form
FOR INSERT WITH CHECK (user_id = current_setting('app.user_email', true));

CREATE POLICY "Users can update their own forms" ON public.form
FOR UPDATE USING (user_id = current_setting('app.user_email', true));

CREATE POLICY "Users can delete their own forms" ON public.form
FOR DELETE USING (user_id = current_setting('app.user_email', true));

-- Recreate question RLS policies to work with email-based system
CREATE POLICY "Users can view questions for their forms" ON public.question
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.form 
  WHERE form.form_id = question.form_id 
  AND form.user_id = current_setting('app.user_email', true)
));

CREATE POLICY "Users can create questions for their forms" ON public.question
FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM public.form 
  WHERE form.form_id = question.form_id 
  AND form.user_id = current_setting('app.user_email', true)
));

CREATE POLICY "Users can update questions for their forms" ON public.question
FOR UPDATE USING (EXISTS (
  SELECT 1 FROM public.form 
  WHERE form.form_id = question.form_id 
  AND form.user_id = current_setting('app.user_email', true)
));

CREATE POLICY "Users can delete questions for their forms" ON public.question
FOR DELETE USING (EXISTS (
  SELECT 1 FROM public.form 
  WHERE form.form_id = question.form_id 
  AND form.user_id = current_setting('app.user_email', true)
));

-- Recreate answer RLS policies
CREATE POLICY "Form creators can view answers for their forms" ON public.answer
FOR SELECT USING (EXISTS (
  SELECT 1 FROM question 
  JOIN form ON form.form_id = question.form_id
  WHERE question.question_id = answer.question_id 
  AND form.user_id = current_setting('app.user_email', true)
));

CREATE POLICY "Form creators can update answers for their forms" ON public.answer
FOR UPDATE USING (EXISTS (
  SELECT 1 FROM question 
  JOIN form ON form.form_id = question.form_id
  WHERE question.question_id = answer.question_id 
  AND form.user_id = current_setting('app.user_email', true)
));

CREATE POLICY "Form creators can delete answers for their forms" ON public.answer
FOR DELETE USING (EXISTS (
  SELECT 1 FROM question 
  JOIN form ON form.form_id = question.form_id
  WHERE question.question_id = answer.question_id 
  AND form.user_id = current_setting('app.user_email', true)
));

-- Create a dummy user for testing
INSERT INTO public.simple_users (email, display_name) VALUES 
('test@example.com', 'Test User')
ON CONFLICT (email) DO NOTHING;

-- Insert dummy forms with email as user_id
INSERT INTO public.form (user_id, title, description, creation_date) VALUES
('test@example.com', 'Customer Satisfaction Survey', 'Help us understand how we can better serve you. This survey takes about 5 minutes to complete and your feedback is valuable to us.', NOW() - INTERVAL '2 days'),
('test@example.com', 'Event Registration Form', 'Register for our upcoming tech conference. Join industry leaders and learn about the latest trends in technology and innovation.', NOW() - INTERVAL '5 days'),
('test@example.com', 'Product Feedback Collection', 'Share your experience with our latest product launch. Your insights help us improve and develop better solutions for our customers.', NOW() - INTERVAL '1 week');