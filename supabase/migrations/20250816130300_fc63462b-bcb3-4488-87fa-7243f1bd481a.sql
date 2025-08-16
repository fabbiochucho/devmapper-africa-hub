-- Fix OTP expiry security issue by setting proper expiration times
UPDATE otp_settings 
SET expiration_time = 3600 -- 1 hour in seconds for OTP expiry
WHERE id = 1;

-- Insert default OTP settings if none exist
INSERT INTO otp_settings (id, expiration_time) 
SELECT 1, 3600
WHERE NOT EXISTS (SELECT 1 FROM otp_settings WHERE id = 1);