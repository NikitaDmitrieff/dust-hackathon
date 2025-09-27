-- Add 10+ random answers for the dummy forms
DO $$
DECLARE
    service_rating_q_id uuid;
    email_q_id uuid;
    comments_q_id uuid;
    name_q_id uuid;
    sessions_q_id uuid;
    heard_about_q_id uuid;
    usage_time_q_id uuid;
    rating_q_id uuid;
    improvements_q_id uuid;
BEGIN
    -- Get question IDs for Customer Satisfaction Survey
    SELECT question_id INTO service_rating_q_id FROM public.question WHERE question = 'How would you rate our overall service?' LIMIT 1;
    SELECT question_id INTO email_q_id FROM public.question WHERE question = 'What is your email address?' LIMIT 1;
    SELECT question_id INTO comments_q_id FROM public.question WHERE question = 'Any additional comments?' LIMIT 1;

    -- Get question IDs for Event Registration Form
    SELECT question_id INTO name_q_id FROM public.question WHERE question = 'What is your full name?' LIMIT 1;
    SELECT question_id INTO sessions_q_id FROM public.question WHERE question = 'Which sessions interest you most?' LIMIT 1;
    SELECT question_id INTO heard_about_q_id FROM public.question WHERE question = 'How did you hear about this event?' LIMIT 1;

    -- Get question IDs for Product Feedback Collection
    SELECT question_id INTO usage_time_q_id FROM public.question WHERE question = 'How long have you been using our product?' LIMIT 1;
    SELECT question_id INTO rating_q_id FROM public.question WHERE question = 'Rate our product from 1-10' LIMIT 1;
    SELECT question_id INTO improvements_q_id FROM public.question WHERE question = 'What improvements would you suggest?' LIMIT 1;

    -- Insert answers for Customer Satisfaction Survey
    INSERT INTO public.answer (question_id, answer) VALUES
    (service_rating_q_id, 'Excellent'),
    (email_q_id, 'john.smith@email.com'),
    (comments_q_id, 'Great service, very satisfied with the quality and speed of delivery'),
    
    (service_rating_q_id, 'Good'),
    (email_q_id, 'sarah.johnson@gmail.com'),
    (comments_q_id, 'Overall positive experience, could improve communication'),
    
    (service_rating_q_id, 'Excellent'),
    (email_q_id, 'mike.wilson@company.com'),
    (comments_q_id, 'Outstanding customer support and product quality'),
    
    (service_rating_q_id, 'Fair'),
    (email_q_id, 'lisa.brown@email.com'),
    (comments_q_id, 'Service was okay but took longer than expected'),
    
    (service_rating_q_id, 'Good'),
    (email_q_id, 'david.lee@business.org'),
    (comments_q_id, 'Good value for money, will recommend to others');

    -- Insert answers for Event Registration Form
    INSERT INTO public.answer (question_id, answer) VALUES
    (name_q_id, 'Emma Thompson'),
    (sessions_q_id, 'AI & Machine Learning, Cloud Computing'),
    (heard_about_q_id, 'Social Media'),
    
    (name_q_id, 'Robert Chen'),
    (sessions_q_id, 'Cybersecurity, DevOps'),
    (heard_about_q_id, 'Google Search'),
    
    (name_q_id, 'Maria Rodriguez'),
    (sessions_q_id, 'Web Development, UX Design'),
    (heard_about_q_id, 'Friend Referral'),
    
    (name_q_id, 'Alex Kim'),
    (sessions_q_id, 'AI & Machine Learning, Blockchain'),
    (heard_about_q_id, 'LinkedIn'),
    
    (name_q_id, 'Jennifer Davis'),
    (sessions_q_id, 'Cloud Computing, Data Science'),
    (heard_about_q_id, 'Email Newsletter');

    -- Insert answers for Product Feedback Collection
    INSERT INTO public.answer (question_id, answer) VALUES
    (usage_time_q_id, '6 months'),
    (rating_q_id, '8'),
    (improvements_q_id, 'Better mobile app interface and faster loading times'),
    
    (usage_time_q_id, '1 year'),
    (rating_q_id, '9'),
    (improvements_q_id, 'More customization options and better integration capabilities'),
    
    (usage_time_q_id, '3 months'),
    (rating_q_id, '7'),
    (improvements_q_id, 'Improved documentation and tutorial videos'),
    
    (usage_time_q_id, '2 years'),
    (rating_q_id, '9'),
    (improvements_q_id, 'Advanced analytics dashboard and export features'),
    
    (usage_time_q_id, '6 months'),
    (rating_q_id, '6'),
    (improvements_q_id, 'Price reduction and better customer support response time');
END $$;