-- Enable RLS on all public tables
ALTER TABLE public.form ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form table
-- Form creators can see their own forms
CREATE POLICY "Users can view their own forms" 
ON public.form 
FOR SELECT 
USING (auth.uid() = user_id);

-- Form creators can create their own forms
CREATE POLICY "Users can create their own forms" 
ON public.form 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Form creators can update their own forms
CREATE POLICY "Users can update their own forms" 
ON public.form 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Form creators can delete their own forms
CREATE POLICY "Users can delete their own forms" 
ON public.form 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for question table
-- Form creators can see questions for their own forms
CREATE POLICY "Users can view questions for their forms" 
ON public.question 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.form 
    WHERE form.form_id = question.form_id 
    AND form.user_id = auth.uid()
  )
);

-- Form creators can create questions for their own forms
CREATE POLICY "Users can create questions for their forms" 
ON public.question 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.form 
    WHERE form.form_id = question.form_id 
    AND form.user_id = auth.uid()
  )
);

-- Form creators can update questions for their own forms
CREATE POLICY "Users can update questions for their forms" 
ON public.question 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.form 
    WHERE form.form_id = question.form_id 
    AND form.user_id = auth.uid()
  )
);

-- Form creators can delete questions for their own forms
CREATE POLICY "Users can delete questions for their forms" 
ON public.question 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.form 
    WHERE form.form_id = question.form_id 
    AND form.user_id = auth.uid()
  )
);

-- RLS Policies for answer table
-- Anyone can submit answers to forms (public form filling)
CREATE POLICY "Anyone can submit answers" 
ON public.answer 
FOR INSERT 
WITH CHECK (true);

-- Form creators can view answers for their forms
CREATE POLICY "Form creators can view answers for their forms" 
ON public.answer 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.question 
    JOIN public.form ON form.form_id = question.form_id
    WHERE question.question_id = answer.question_id 
    AND form.user_id = auth.uid()
  )
);

-- Form creators can update answers for their forms (if needed for moderation)
CREATE POLICY "Form creators can update answers for their forms" 
ON public.answer 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.question 
    JOIN public.form ON form.form_id = question.form_id
    WHERE question.question_id = answer.question_id 
    AND form.user_id = auth.uid()
  )
);

-- Form creators can delete answers for their forms (if needed for moderation)
CREATE POLICY "Form creators can delete answers for their forms" 
ON public.answer 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.question 
    JOIN public.form ON form.form_id = question.form_id
    WHERE question.question_id = answer.question_id 
    AND form.user_id = auth.uid()
  )
);