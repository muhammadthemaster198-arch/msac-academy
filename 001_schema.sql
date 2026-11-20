-- MSAC Academy: schema + Row Level Security + storage. Version 2.
-- Run ONCE on a fresh Supabase project (SQL Editor). Money is whole naira; Paystack amount = naira * 100.

-- ========== TABLES ==========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create table public.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  objectives text[] not null default '{}',
  level text not null default 'Beginner' check (level in ('Beginner','Intermediate','Advanced')),
  duration text not null default '',
  price_ngn integer not null check (price_ngn > 0),   -- every course is paid
  thumbnail_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  position integer not null default 0
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade, -- forced to match the module by a trigger
  title text not null,
  description text not null default '',
  objectives text[] not null default '{}',
  notes text not null default '',
  video_type text not null default 'youtube' check (video_type in ('youtube','storage')),
  video_url text,                          -- YouTube URL, or path in bucket lesson-files
  resources jsonb not null default '[]',   -- [{"name":"Brief.pdf","path":"<course_id>/brief.pdf"}]
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- payments.course_id has no cascade: a course with payment records cannot be deleted (unpublish it instead).
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id),
  reference text not null unique,
  amount_ngn integer not null check (amount_ngn > 0),
  status text not null default 'pending' check (status in ('pending','success','failed','abandoned')),
  paystack_transaction_id text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.enrolments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  payment_id uuid references public.payments(id),
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  instructions text not null default '',
  created_at timestamptz not null default now()
);

create table public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  text_answer text not null default '',
  file_path text,                          -- path in bucket submissions: <user_id>/<file>
  status text not null default 'submitted' check (status in ('submitted','approved','needs_revision')),
  feedback text,
  submitted_at timestamptz not null default now(),
  unique (assignment_id, user_id)
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  student_name text not null,              -- snapshot at issue time
  course_title text not null,              -- snapshot at issue time
  reference text not null unique,
  issued_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create index on public.lessons (course_id, position);
create index on public.modules (course_id, position);
create index on public.enrolments (user_id);
create index on public.payments (user_id);
create index on public.assignment_submissions (user_id);

-- ========== FUNCTIONS ==========
create function public.is_admin() returns boolean
language sql security definer stable set search_path = public as
$$ select exists (select 1 from public.admin_roles where user_id = auth.uid()) $$;

create function public.has_course_access(p_course uuid) returns boolean
language sql security definer stable set search_path = public as
$$ select public.is_admin() or exists (
     select 1 from public.enrolments where user_id = auth.uid() and course_id = p_course) $$;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.email);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- A lesson always belongs to the same course as its module.
create function public.set_lesson_course() returns trigger
language plpgsql set search_path = public as $$
begin
  select course_id into new.course_id from public.modules where id = new.module_id;
  return new;
end $$;
create trigger lessons_set_course before insert or update of module_id on public.lessons
  for each row execute function public.set_lesson_course();

-- Students may only resubmit work an admin marked needs_revision, and may only change their answer/file.
create function public.guard_submission_update() returns trigger
language plpgsql set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
  if old.status <> 'needs_revision' then raise exception 'This submission cannot be changed'; end if;
  new.assignment_id := old.assignment_id;
  new.user_id := old.user_id;
  new.feedback := old.feedback;
  new.status := 'submitted';
  new.submitted_at := now();
  return new;
end $$;
create trigger submissions_guard before update on public.assignment_submissions
  for each row execute function public.guard_submission_update();

-- Public curriculum: titles only (no video, notes or files), published courses only.
create function public.course_outline(p_course uuid)
returns table (module_id uuid, module_title text, module_position int, lesson_id uuid, lesson_title text, lesson_position int)
language sql security definer stable set search_path = public as $$
  select m.id, m.title, m.position, l.id, l.title, l.position
  from public.modules m left join public.lessons l on l.module_id = m.id
  join public.courses c on c.id = m.course_id
  where m.course_id = p_course and c.is_published
  order by m.position, l.position $$;

-- Certificate only after: paid enrolment + every lesson completed + every assignment APPROVED by an admin.
create function public.issue_certificate(p_course uuid) returns public.certificates
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); total int; done int; a_total int; a_ok int; sname text; ctitle text; cert public.certificates;
begin
  if uid is null then raise exception 'Not signed in'; end if;
  if not exists (select 1 from public.enrolments where user_id = uid and course_id = p_course) then
    raise exception 'Not enrolled in this course'; end if;
  select count(*) into total from public.lessons where course_id = p_course;
  select count(*) into done from public.lesson_progress p join public.lessons l on l.id = p.lesson_id
    where p.user_id = uid and l.course_id = p_course;
  select count(*) into a_total from public.assignments where course_id = p_course;
  select count(*) into a_ok from public.assignment_submissions s join public.assignments a on a.id = s.assignment_id
    where s.user_id = uid and a.course_id = p_course and s.status = 'approved';
  if total = 0 or done < total then raise exception 'Complete all lessons first'; end if;
  if a_ok < a_total then raise exception 'All assignments must be approved first'; end if;
  select full_name into sname from public.profiles where id = uid;
  if coalesce(trim(sname),'') = '' then raise exception 'Add your full name to your profile first'; end if;
  select title into ctitle from public.courses where id = p_course;
  insert into public.certificates (user_id, course_id, student_name, course_title, reference)
  values (uid, p_course, sname, ctitle, 'MSAC-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)))
  on conflict (user_id, course_id) do nothing;
  select * into cert from public.certificates where user_id = uid and course_id = p_course;
  return cert;
end $$;

create function public.verify_certificate(p_reference text)
returns table (student_name text, course_title text, issued_at timestamptz)
language sql security definer stable set search_path = public as $$
  select ce.student_name, ce.course_title, ce.issued_at from public.certificates ce where ce.reference = p_reference $$;

-- Function permissions
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.issue_certificate(uuid) from public, anon;
grant execute on function public.issue_certificate(uuid) to authenticated;
grant execute on function public.verify_certificate(text) to anon, authenticated;
grant execute on function public.course_outline(uuid) to anon, authenticated;

-- ========== TABLE PRIVILEGES (defence in depth, on top of RLS) ==========
revoke all on public.profiles, public.admin_roles, public.lessons, public.payments, public.enrolments,
  public.lesson_progress, public.assignments, public.assignment_submissions, public.certificates from anon;
revoke insert, update, delete on public.courses, public.modules from anon;
-- Only the server (service role) may write payments/enrolments; certificates only via issue_certificate().
revoke insert, update, delete on public.payments, public.enrolments from authenticated;
revoke insert, update on public.certificates from authenticated;
revoke all on public.admin_roles from authenticated;
grant select on public.admin_roles to authenticated;

-- ========== ROW LEVEL SECURITY ==========
alter table public.profiles enable row level security;
alter table public.admin_roles enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.payments enable row level security;
alter table public.enrolments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.certificates enable row level security;

create policy "profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profile update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- No insert/update/delete policy on admin_roles: admin rights can only be granted in the SQL Editor.
create policy "admin row read own" on public.admin_roles for select to authenticated using (user_id = auth.uid());

create policy "courses read" on public.courses for select using (is_published or public.is_admin());
create policy "courses admin write" on public.courses for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "modules read" on public.modules for select using (
  public.is_admin() or exists (select 1 from public.courses c where c.id = course_id and c.is_published));
create policy "modules admin write" on public.modules for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "lessons paid read" on public.lessons for select to authenticated using (public.has_course_access(course_id));
create policy "lessons admin write" on public.lessons for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "payments read own" on public.payments for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "enrolments read own" on public.enrolments for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy "progress read" on public.lesson_progress for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "progress insert own" on public.lesson_progress for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from public.lessons l where l.id = lesson_id and public.has_course_access(l.course_id)));
create policy "progress delete own" on public.lesson_progress for delete to authenticated using (user_id = auth.uid());

create policy "assignments read" on public.assignments for select to authenticated using (public.has_course_access(course_id));
create policy "assignments admin write" on public.assignments for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "submissions read" on public.assignment_submissions for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "submissions insert own" on public.assignment_submissions for insert to authenticated with check (
  user_id = auth.uid() and status = 'submitted' and feedback is null
  and exists (select 1 from public.assignments a where a.id = assignment_id and public.has_course_access(a.course_id)));
create policy "submissions resubmit own" on public.assignment_submissions for update to authenticated
  using (user_id = auth.uid() and status = 'needs_revision') with check (user_id = auth.uid());
create policy "submissions admin update" on public.assignment_submissions for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "certificates read own" on public.certificates for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "certificates admin delete" on public.certificates for delete to authenticated using (public.is_admin());

-- ========== STORAGE ==========
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('thumbnails',   'thumbnails',   true,  2097152,  array['image/png','image/jpeg','image/webp']),
  ('lesson-files', 'lesson-files', false, 52428800, array['application/pdf','application/zip','image/png','image/jpeg','image/webp','video/mp4','video/webm']),
  ('submissions',  'submissions',  false, 10485760, array['application/pdf','application/zip','image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

create policy "thumbnails public read" on storage.objects for select using (bucket_id = 'thumbnails');
create policy "thumbnails admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'thumbnails' and public.is_admin());
create policy "thumbnails admin update" on storage.objects for update to authenticated using (bucket_id = 'thumbnails' and public.is_admin()) with check (bucket_id = 'thumbnails' and public.is_admin());
create policy "thumbnails admin delete" on storage.objects for delete to authenticated using (bucket_id = 'thumbnails' and public.is_admin());

-- lesson-files: first folder = course id. Readable by enrolled students and admins; written by admins.
create policy "lesson files read" on storage.objects for select to authenticated using (
  bucket_id = 'lesson-files' and (public.is_admin() or exists (
    select 1 from public.enrolments e where e.user_id = auth.uid() and e.course_id::text = split_part(name, '/', 1))));
create policy "lesson files admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'lesson-files' and public.is_admin());
create policy "lesson files admin update" on storage.objects for update to authenticated using (bucket_id = 'lesson-files' and public.is_admin()) with check (bucket_id = 'lesson-files' and public.is_admin());
create policy "lesson files admin delete" on storage.objects for delete to authenticated using (bucket_id = 'lesson-files' and public.is_admin());

-- submissions: first folder = the student's user id. Students manage only their own folder; admins can read all.
create policy "submissions files read" on storage.objects for select to authenticated using (
  bucket_id = 'submissions' and (split_part(name, '/', 1) = auth.uid()::text or public.is_admin()));
create policy "submissions files insert own" on storage.objects for insert to authenticated with check (
  bucket_id = 'submissions' and split_part(name, '/', 1) = auth.uid()::text);
create policy "submissions files delete own" on storage.objects for delete to authenticated using (
  bucket_id = 'submissions' and split_part(name, '/', 1) = auth.uid()::text);
