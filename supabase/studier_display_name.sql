alter table public.profiles
add column if not exists display_name text;

-- Optional, change your admin display name here.
-- Replace the email and display name values before running if you want.
-- update public.profiles
-- set display_name = 'Cafe'
-- where email = 'your.email@example.com';
