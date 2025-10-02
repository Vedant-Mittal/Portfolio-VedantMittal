-- RLS policies for content_sections to enable Portfolio Editor
-- Allows: SELECT for all; INSERT/UPDATE for users with profile role in ('admin','instructor'); DELETE for admin only

begin;

-- Ensure RLS is enabled
alter table if exists public.content_sections enable row level security;

-- Drop existing policies if re-running
drop policy if exists content_sections_read_all on public.content_sections;
drop policy if exists content_sections_insert_instructors on public.content_sections;
drop policy if exists content_sections_update_instructors on public.content_sections;
drop policy if exists content_sections_delete_admin on public.content_sections;

-- Read for everyone (including anon)
create policy content_sections_read_all
  on public.content_sections
  for select
  using (true);

-- Insert for instructors/admins based on profiles.role
create policy content_sections_insert_instructors
  on public.content_sections
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('admin','instructor')
    )
  );

-- Update for instructors/admins based on profiles.role
create policy content_sections_update_instructors
  on public.content_sections
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('admin','instructor')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('admin','instructor')
    )
  );

-- Delete only for admins
create policy content_sections_delete_admin
  on public.content_sections
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.role = 'admin'
    )
  );

commit;


