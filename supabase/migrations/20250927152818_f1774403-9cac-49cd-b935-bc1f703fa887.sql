-- Add diverse dummy answers for Customer Satisfaction Survey (form: a7bfea29-bd33-44ce-90ea-bfedca6c9624)

-- Service rating answers (spread across different ratings)
INSERT INTO answer (question_id, answer) VALUES 
-- Excellent ratings (30%)
('c7fa1e12-1616-4617-a3aa-4b2ba057fffa', 'Excellent'),
('c7fa1e12-1616-4617-a3aa-4b2ba057fffa', 'Excellent'),
('c7fa1e12-1616-4617-a3aa-4b2ba057fffa', 'Excellent'),
('c7fa1e12-1616-4617-a3aa-4b2ba057fffa', 'Excellent'),
('c7fa1e12-1616-4617-a3aa-4b2ba057fffa', 'Excellent'),
('c7fa1e12-1616-4617-a3aa-4b2ba057fffa', 'Excellent'),
-- Good ratings (40%)
('c7fa1e12-1616-4617-a3aa-4b2ba057fffa', 'Good'),
('c7fa1e12-1616-4617-a3aa-4b2ba057fffa', 'Good'),
('c7fa1e12-1616-4617-a3aa-4b2ba057fffa', 'Good'),
('c7fa1e12-1616-4617-a3aa-4b2ba057fffa', 'Good'),
('c7fa1e12-1616-4617-a3aa-4b2ba057fffa', 'Good'),
('c7fa1e12-1616-4617-a3aa-4b2ba057fffa', 'Good'),
('c7fa1e12-1616-4617-a3aa-4b2ba057fffa', 'Good'),
('c7fa1e12-1616-4617-a3aa-4b2ba057fffa', 'Good'),
-- Average ratings (20%)
('c7fa1e12-1616-4617-a3aa-4b2ba057fffa', 'Average'),
('c7fa1e12-1616-4617-a3aa-4b2ba057fffa', 'Average'),
('c7fa1e12-1616-4617-a3aa-4b2ba057fffa', 'Average'),
('c7fa1e12-1616-4617-a3aa-4b2ba057fffa', 'Average'),
-- Poor ratings (10%)
('c7fa1e12-1616-4617-a3aa-4b2ba057fffa', 'Poor'),
('c7fa1e12-1616-4617-a3aa-4b2ba057fffa', 'Poor');

-- Email addresses for contact
INSERT INTO answer (question_id, answer) VALUES 
('d2d6b970-3952-4aee-a51e-e55276cd9149', 'john.doe@email.com'),
('d2d6b970-3952-4aee-a51e-e55276cd9149', 'mary.smith@gmail.com'),
('d2d6b970-3952-4aee-a51e-e55276cd9149', 'alex.jones@company.com'),
('d2d6b970-3952-4aee-a51e-e55276cd9149', 'sarah.wilson@outlook.com'),
('d2d6b970-3952-4aee-a51e-e55276cd9149', 'mike.brown@yahoo.com'),
('d2d6b970-3952-4aee-a51e-e55276cd9149', 'lisa.taylor@hotmail.com'),
('d2d6b970-3952-4aee-a51e-e55276cd9149', 'david.davis@email.com'),
('d2d6b970-3952-4aee-a51e-e55276cd9149', 'emma.clark@company.org'),
('d2d6b970-3952-4aee-a51e-e55276cd9149', 'chris.martin@startup.io'),
('d2d6b970-3952-4aee-a51e-e55276cd9149', 'anna.white@tech.com');

-- Comments (varied feedback)
INSERT INTO answer (question_id, answer) VALUES 
('8dc7ff87-49ff-48f3-8d34-5809d386745f', 'Excellent customer service, very responsive team!'),
('8dc7ff87-49ff-48f3-8d34-5809d386745f', 'Great product, could use better documentation'),
('8dc7ff87-49ff-48f3-8d34-5809d386745f', 'Love the new features, keep up the good work'),
('8dc7ff87-49ff-48f3-8d34-5809d386745f', 'Pricing is a bit high but quality is worth it'),
('8dc7ff87-49ff-48f3-8d34-5809d386745f', 'Support response time could be faster'),
('8dc7ff87-49ff-48f3-8d34-5809d386745f', 'User interface is intuitive and easy to use'),
('8dc7ff87-49ff-48f3-8d34-5809d386745f', 'Would recommend to other businesses'),
('8dc7ff87-49ff-48f3-8d34-5809d386745f', 'Mobile app needs improvement'),
('8dc7ff87-49ff-48f3-8d34-5809d386745f', 'Overall satisfied with the service');