-- Donations are now created by the create-payment edge function (service role), which takes the
-- currency from the campaign and the donor from the JWT. Clients could previously insert rows with
-- any status/currency; remove that path. Apply only after create-payment is deployed.
DROP POLICY IF EXISTS "Donors can insert their own donations" ON public.campaign_donations;
