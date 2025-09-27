-- Create a function to set session configuration for RLS policies
CREATE OR REPLACE FUNCTION public.set_config(setting_name text, setting_value text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT set_config(setting_name, setting_value, false);
$$;