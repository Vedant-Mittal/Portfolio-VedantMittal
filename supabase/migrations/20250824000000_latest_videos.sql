-- Create latest_videos table and policies
create extension if not exists pgcrypto;

create table if not exists public.latest_videos (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  youtube_id text not null,
  order_index int not null check (order_index between 1 and 3),
  created_at timestamptz not null default now()
);

alter table public.latest_videos enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'latest_videos' and policyname = 'Anyone can read latest videos'
  ) then
    create policy "Anyone can read latest videos"
    on public.latest_videos
    for select
    to anon, authenticated
    using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'latest_videos' and policyname = 'Admins/Instructors can manage latest videos'
  ) then
    create policy "Admins/Instructors can manage latest videos"
    on public.latest_videos
    for all
    to authenticated
    using (
      exists (
        select 1 from public.profiles p
        where p.user_id = auth.uid()
          and p.role in ('admin','instructor')
      )
    )
    with check (
      exists (
        select 1 from public.profiles p
        where p.user_id = auth.uid()
          and p.role in ('admin','instructor')
      )
    );
  end if;
end $$;

create unique index if not exists latest_videos_order_idx
  on public.latest_videos(order_index);


