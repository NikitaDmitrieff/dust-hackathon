-- Update existing dummy forms to assign them to the current user
UPDATE public.form 
SET user_id = auth.uid() 
WHERE user_id IS NULL 
AND title IN ('Customer Satisfaction Survey', 'Event Registration Form', 'Product Feedback Collection');