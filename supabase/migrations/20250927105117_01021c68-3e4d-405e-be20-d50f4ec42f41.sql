-- Create forms table to store user-created forms
CREATE TABLE public.forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create form_responses table to store client responses
CREATE TABLE public.form_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  response_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  client_ip TEXT,
  user_agent TEXT
);

-- Enable Row Level Security
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for forms table
CREATE POLICY "Users can view their own forms" 
ON public.forms 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own forms" 
ON public.forms 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own forms" 
ON public.forms 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forms" 
ON public.forms 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for form_responses table
CREATE POLICY "Form owners can view responses" 
ON public.form_responses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.forms 
    WHERE forms.id = form_responses.form_id 
    AND forms.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can submit form responses" 
ON public.form_responses 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_forms_updated_at
  BEFORE UPDATE ON public.forms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_forms_user_id ON public.forms(user_id);
CREATE INDEX idx_form_responses_form_id ON public.form_responses(form_id);
CREATE INDEX idx_forms_created_at ON public.forms(created_at DESC);