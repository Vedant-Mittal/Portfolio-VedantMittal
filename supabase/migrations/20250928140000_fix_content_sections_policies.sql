-- Fix content_sections RLS policies for development
-- Add fallback policy for authenticated users

begin;

-- Drop the strict instructor-only policies
drop policy if exists content_sections_insert_instructors on public.content_sections;
drop policy if exists content_sections_update_instructors on public.content_sections;

-- Create more permissive policies for development
-- Allow any authenticated user to insert/update content_sections
create policy content_sections_insert_auth_users
  on public.content_sections
  for insert
  to authenticated
  with check (true);

create policy content_sections_update_auth_users
  on public.content_sections
  for update
  to authenticated
  using (true)
  with check (true);

commit;