-- First, let's get the form IDs for our dummy forms
DO $$
DECLARE
    customer_survey_id uuid;
    event_registration_id uuid;
    product_feedback_id uuid;
BEGIN
    -- Get form IDs
    SELECT form_id INTO customer_survey_id FROM public.form WHERE title = 'Customer Satisfaction Survey' AND user_id = 'test@example.com' LIMIT 1;
    SELECT form_id INTO event_registration_id FROM public.form WHERE title = 'Event Registration Form' AND user_id = 'test@example.com' LIMIT 1;
    SELECT form_id INTO product_feedback_id FROM public.form WHERE title = 'Product Feedback Collection' AND user_id = 'test@example.com' LIMIT 1;

    -- Add questions for Customer Satisfaction Survey
    INSERT INTO public.question (form_id, question, type_answer) VALUES
    (customer_survey_id, 'How would you rate our overall service?', 'radio'),
    (customer_survey_id, 'What is your email address?', 'email'),
    (customer_survey_id, 'Any additional comments?', 'textarea');

    -- Add questions for Event Registration Form
    INSERT INTO public.question (form_id, question, type_answer) VALUES
    (event_registration_id, 'What is your full name?', 'text'),
    (event_registration_id, 'Which sessions interest you most?', 'checkbox'),
    (event_registration_id, 'How did you hear about this event?', 'radio');

    -- Add questions for Product Feedback Collection
    INSERT INTO public.question (form_id, question, type_answer) VALUES
    (product_feedback_id, 'How long have you been using our product?', 'radio'),
    (product_feedback_id, 'Rate our product from 1-10', 'number'),
    (product_feedback_id, 'What improvements would you suggest?', 'textarea');
END $$;