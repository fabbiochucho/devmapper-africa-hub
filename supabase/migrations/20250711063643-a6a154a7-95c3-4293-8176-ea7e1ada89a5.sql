-- Fix OTP expiry security issue by updating the expiration time validation
ALTER TABLE public.otp_settings 
ADD CONSTRAINT otp_expiration_time_check 
CHECK (expiration_time > 0 AND expiration_time <= 3600);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT otp_expiration_time_check ON public.otp_settings 
IS 'Ensures OTP expiration time is between 1 second and 1 hour (3600 seconds)';

-- Insert default OTP settings if none exist
INSERT INTO public.otp_settings (expiration_time) 
SELECT 300 -- 5 minutes default
WHERE NOT EXISTS (SELECT 1 FROM public.otp_settings);