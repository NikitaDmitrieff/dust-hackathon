-- Create a simple email-based authentication table for tracking users
CREATE TABLE IF NOT EXISTS public.simple_users (
  email text PRIMARY KEY,
  display_name text,
  created_at timestamp with time zone DEFAULT now()
);

-- Insert dummy forms with email as user_id for testing
INSERT INTO public.form (user_id, title, description, creation_date) VALUES
('test@example.com', 'Customer Satisfaction Survey', 'Help us understand how we can better serve you. This survey takes about 5 minutes to complete and your feedback is valuable to us.', NOW() - INTERVAL '2 days'),
('test@example.com', 'Event Registration Form', 'Register for our upcoming tech conference. Join industry leaders and learn about the latest trends in technology and innovation.', NOW() - INTERVAL '5 days'),
('test@example.com', 'Product Feedback Collection', 'Share your experience with our latest product launch. Your insights help us improve and develop better solutions for our customers.', NOW() - INTERVAL '1 week');