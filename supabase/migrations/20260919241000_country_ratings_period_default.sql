-- rating_period had no column default, only the BEFORE INSERT trigger set
-- it - which made the generated TS Insert type demand a client-supplied
-- value it would just discard. Give it a matching default so a bare
-- insert (client or SQL) type-checks without one; the trigger still
-- unconditionally overwrites it either way.
ALTER TABLE public.country_ratings
ALTER COLUMN rating_period SET DEFAULT to_char(now(), 'YYYY-MM');
