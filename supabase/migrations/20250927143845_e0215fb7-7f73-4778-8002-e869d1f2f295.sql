-- Insert 3 dummy forms for demonstration
INSERT INTO public.form (form_id, title, description, user_id, creation_date) VALUES
(
  gen_random_uuid(),
  'Customer Satisfaction Survey',
  'Help us understand how we can better serve you. This survey takes about 5 minutes to complete and your feedback is valuable to us.',
  auth.uid(),
  NOW() - INTERVAL '2 days'
),
(
  gen_random_uuid(), 
  'Event Registration Form',
  'Register for our upcoming tech conference. Join industry leaders and learn about the latest trends in technology and innovation.',
  auth.uid(),
  NOW() - INTERVAL '5 days'
),
(
  gen_random_uuid(),
  'Product Feedback Collection',
  'Share your experience with our latest product launch. Your insights help us improve and develop better solutions for our customers.',
  auth.uid(),
  NOW() - INTERVAL '1 week'
);