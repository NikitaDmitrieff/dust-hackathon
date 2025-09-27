-- Add diverse dummy answers for Event Registration Form (form: 20d5c7c3-8102-4038-a09c-f29d5fe41578)

-- Names for event registration
INSERT INTO answer (question_id, answer) VALUES 
('903005e7-acd4-4ecb-aed6-51cee32074dd', 'John Smith'),
('903005e7-acd4-4ecb-aed6-51cee32074dd', 'Maria Garcia'),
('903005e7-acd4-4ecb-aed6-51cee32074dd', 'David Wilson'),
('903005e7-acd4-4ecb-aed6-51cee32074dd', 'Sarah Johnson'),
('903005e7-acd4-4ecb-aed6-51cee32074dd', 'Michael Brown'),
('903005e7-acd4-4ecb-aed6-51cee32074dd', 'Lisa Davis'),
('903005e7-acd4-4ecb-aed6-51cee32074dd', 'Robert Taylor'),
('903005e7-acd4-4ecb-aed6-51cee32074dd', 'Jennifer White'),
('903005e7-acd4-4ecb-aed6-51cee32074dd', 'Thomas Anderson'),
('903005e7-acd4-4ecb-aed6-51cee32074dd', 'Emma Thompson');

-- Session interests (checkbox - multiple options per person)
INSERT INTO answer (question_id, answer) VALUES 
-- AI & Machine Learning (most popular)
('e0fb0e63-ffdf-42ab-b381-ae3f524c6044', 'AI & Machine Learning'),
('e0fb0e63-ffdf-42ab-b381-ae3f524c6044', 'AI & Machine Learning'),
('e0fb0e63-ffdf-42ab-b381-ae3f524c6044', 'AI & Machine Learning'),
('e0fb0e63-ffdf-42ab-b381-ae3f524c6044', 'AI & Machine Learning'),
('e0fb0e63-ffdf-42ab-b381-ae3f524c6044', 'AI & Machine Learning'),
('e0fb0e63-ffdf-42ab-b381-ae3f524c6044', 'AI & Machine Learning'),
('e0fb0e63-ffdf-42ab-b381-ae3f524c6044', 'AI & Machine Learning'),
-- Cloud Computing (second most popular)
('e0fb0e63-ffdf-42ab-b381-ae3f524c6044', 'Cloud Computing'),
('e0fb0e63-ffdf-42ab-b381-ae3f524c6044', 'Cloud Computing'),
('e0fb0e63-ffdf-42ab-b381-ae3f524c6044', 'Cloud Computing'),
('e0fb0e63-ffdf-42ab-b381-ae3f524c6044', 'Cloud Computing'),
('e0fb0e63-ffdf-42ab-b381-ae3f524c6044', 'Cloud Computing'),
-- Cybersecurity
('e0fb0e63-ffdf-42ab-b381-ae3f524c6044', 'Cybersecurity'),
('e0fb0e63-ffdf-42ab-b381-ae3f524c6044', 'Cybersecurity'),
('e0fb0e63-ffdf-42ab-b381-ae3f524c6044', 'Cybersecurity'),
('e0fb0e63-ffdf-42ab-b381-ae3f524c6044', 'Cybersecurity'),
-- Data Science
('e0fb0e63-ffdf-42ab-b381-ae3f524c6044', 'Data Science'),
('e0fb0e63-ffdf-42ab-b381-ae3f524c6044', 'Data Science'),
('e0fb0e63-ffdf-42ab-b381-ae3f524c6044', 'Data Science'),
-- Web Development
('e0fb0e63-ffdf-42ab-b381-ae3f524c6044', 'Web Development'),
('e0fb0e63-ffdf-42ab-b381-ae3f524c6044', 'Web Development');

-- How they heard about the event (radio - varied sources)
INSERT INTO answer (question_id, answer) VALUES 
-- Social Media (35%)
('177c267c-4097-4505-98bb-67d834d88c0a', 'Social Media'),
('177c267c-4097-4505-98bb-67d834d88c0a', 'Social Media'),
('177c267c-4097-4505-98bb-67d834d88c0a', 'Social Media'),
('177c267c-4097-4505-98bb-67d834d88c0a', 'Social Media'),
-- Email Newsletter (25%)
('177c267c-4097-4505-98bb-67d834d88c0a', 'Email Newsletter'),
('177c267c-4097-4505-98bb-67d834d88c0a', 'Email Newsletter'),
('177c267c-4097-4505-98bb-67d834d88c0a', 'Email Newsletter'),
-- Friend Referral (20%)
('177c267c-4097-4505-98bb-67d834d88c0a', 'Friend Referral'),
('177c267c-4097-4505-98bb-67d834d88c0a', 'Friend Referral'),
-- Company Website (15%)
('177c267c-4097-4505-98bb-67d834d88c0a', 'Company Website'),
('177c267c-4097-4505-98bb-67d834d88c0a', 'Company Website'),
-- Google Search (5%)
('177c267c-4097-4505-98bb-67d834d88c0a', 'Google Search');