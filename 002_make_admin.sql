-- Make YOUR account the first administrator. Run in Supabase SQL Editor AFTER your account exists.
-- Only the project owner can run SQL there, so nobody can grant themselves admin from the website.
-- 1. Replace the email below (keep the quotes). 2. Run.
do $$
declare uid uuid;
begin
  select id into uid from auth.users
  where lower(email) = lower('PUT_YOUR_EMAIL_HERE') and email_confirmed_at is not null;
  if uid is null then
    raise exception 'No CONFIRMED account found with that email. Create or confirm the account first.';
  end if;
  insert into public.admin_roles (user_id) values (uid) on conflict do nothing;
end $$;

-- Check: should return one row with your email.
select u.email, a.role from public.admin_roles a join auth.users u on u.id = a.user_id;
