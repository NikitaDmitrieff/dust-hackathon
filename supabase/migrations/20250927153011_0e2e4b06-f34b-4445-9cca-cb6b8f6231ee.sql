-- Add diverse dummy answers for Product Feedback Collection (form: 71922b5a-22bb-4190-a71a-fab2b294a9d5)

-- Product usage duration answers (varied experience levels)
INSERT INTO answer (question_id, answer) VALUES 
-- Long-term users (40%)
('12b938ee-9be7-40b7-92ac-3ab91d5a14fd', 'More than 2 years'),
('12b938ee-9be7-40b7-92ac-3ab91d5a14fd', 'More than 2 years'),
('12b938ee-9be7-40b7-92ac-3ab91d5a14fd', 'More than 2 years'),
('12b938ee-9be7-40b7-92ac-3ab91d5a14fd', 'More than 2 years'),
('12b938ee-9be7-40b7-92ac-3ab91d5a14fd', '1-2 years'),
('12b938ee-9be7-40b7-92ac-3ab91d5a14fd', '1-2 years'),
('12b938ee-9be7-40b7-92ac-3ab91d5a14fd', '1-2 years'),
('12b938ee-9be7-40b7-92ac-3ab91d5a14fd', '1-2 years'),
-- Medium-term users (35%)
('12b938ee-9be7-40b7-92ac-3ab91d5a14fd', '6-12 months'),
('12b938ee-9be7-40b7-92ac-3ab91d5a14fd', '6-12 months'),
('12b938ee-9be7-40b7-92ac-3ab91d5a14fd', '6-12 months'),
('12b938ee-9be7-40b7-92ac-3ab91d5a14fd', '3-6 months'),
('12b938ee-9be7-40b7-92ac-3ab91d5a14fd', '3-6 months'),
('12b938ee-9be7-40b7-92ac-3ab91d5a14fd', '3-6 months'),
('12b938ee-9be7-40b7-92ac-3ab91d5a14fd', '3-6 months'),
-- New users (25%)
('12b938ee-9be7-40b7-92ac-3ab91d5a14fd', '1-3 months'),
('12b938ee-9be7-40b7-92ac-3ab91d5a14fd', '1-3 months'),
('12b938ee-9be7-40b7-92ac-3ab91d5a14fd', '1-3 months'),
('12b938ee-9be7-40b7-92ac-3ab91d5a14fd', 'Less than 1 month'),
('12b938ee-9be7-40b7-92ac-3ab91d5a14fd', 'Less than 1 month');

-- Product ratings (1-10 scale with realistic distribution)
INSERT INTO answer (question_id, answer) VALUES 
-- High ratings (8-10) - 50%
('9d6a6a5f-472a-4fc3-a429-8fb5f63c3635', '10'),
('9d6a6a5f-472a-4fc3-a429-8fb5f63c3635', '9'),
('9d6a6a5f-472a-4fc3-a429-8fb5f63c3635', '9'),
('9d6a6a5f-472a-4fc3-a429-8fb5f63c3635', '8'),
('9d6a6a5f-472a-4fc3-a429-8fb5f63c3635', '8'),
('9d6a6a5f-472a-4fc3-a429-8fb5f63c3635', '8'),
('9d6a6a5f-472a-4fc3-a429-8fb5f63c3635', '8'),
('9d6a6a5f-472a-4fc3-a429-8fb5f63c3635', '9'),
('9d6a6a5f-472a-4fc3-a429-8fb5f63c3635', '10'),
('9d6a6a5f-472a-4fc3-a429-8fb5f63c3635', '8'),
-- Medium ratings (6-7) - 30%
('9d6a6a5f-472a-4fc3-a429-8fb5f63c3635', '7'),
('9d6a6a5f-472a-4fc3-a429-8fb5f63c3635', '7'),
('9d6a6a5f-472a-4fc3-a429-8fb5f63c3635', '6'),
('9d6a6a5f-472a-4fc3-a429-8fb5f63c3635', '6'),
('9d6a6a5f-472a-4fc3-a429-8fb5f63c3635', '7'),
('9d6a6a5f-472a-4fc3-a429-8fb5f63c3635', '6'),
-- Lower ratings (3-5) - 20%
('9d6a6a5f-472a-4fc3-a429-8fb5f63c3635', '5'),
('9d6a6a5f-472a-4fc3-a429-8fb5f63c3635', '4'),
('9d6a6a5f-472a-4fc3-a429-8fb5f63c3635', '5'),
('9d6a6a5f-472a-4fc3-a429-8fb5f63c3635', '3');

-- Improvement suggestions (varied feedback)
INSERT INTO answer (question_id, answer) VALUES 
('c3ac44ee-d9e6-49c6-9b6a-a77628490b1a', 'Better mobile app performance'),
('c3ac44ee-d9e6-49c6-9b6a-a77628490b1a', 'More customization options'),
('c3ac44ee-d9e6-49c6-9b6a-a77628490b1a', 'Improved user interface design'),
('c3ac44ee-d9e6-49c6-9b6a-a77628490b1a', 'Better integration with third-party tools'),
('c3ac44ee-d9e6-49c6-9b6a-a77628490b1a', 'Faster loading times'),
('c3ac44ee-d9e6-49c6-9b6a-a77628490b1a', 'More detailed analytics dashboard'),
('c3ac44ee-d9e6-49c6-9b6a-a77628490b1a', 'Enhanced security features'),
('c3ac44ee-d9e6-49c6-9b6a-a77628490b1a', 'Better customer support'),
('c3ac44ee-d9e6-49c6-9b6a-a77628490b1a', 'More pricing tiers'),
('c3ac44ee-d9e6-49c6-9b6a-a77628490b1a', 'Offline functionality');