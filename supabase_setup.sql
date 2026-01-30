
-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Cleanup (Reset Database)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.contest_entries;
drop table if exists public.contests;
drop table if exists public.influencer_stats_history; -- Added cleanup
drop table if exists public.influencers;
drop table if exists public.profiles;
drop type if exists public.user_role;
drop type if exists public.contest_status;

-- 3. Create Enums
create type public.user_role as enum ('admin', 'influencer', 'viewer');
create type public.contest_status as enum ('active', 'inactive', 'draft');

-- 4. Create Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  role user_role default 'viewer',
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on public.profiles for select using ( true );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

-- 5. Create Influencers Table
create table public.influencers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  handle_tiktok text,
  handle_instagram text,
  avatar_url text,
  country text,
  niches text[] default '{}',
  tiktok_followers bigint default 0,
  instagram_followers bigint default 0,
  total_followers bigint generated always as (tiktok_followers + instagram_followers) stored,
  last_updated timestamp with time zone default timezone('utc'::text, now()),
  -- NEW VERIFICATION COLUMNS
  is_verified boolean default false,
  campaign_streak integer default 0
);

alter table public.influencers enable row level security;

create policy "Influencers are viewable by everyone" 
  on public.influencers for select using (true);

create policy "Users can insert own influencer profile" 
  on public.influencers for insert 
  with check ( auth.uid() = id OR exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin') );

create policy "Users can update own influencer profile" 
  on public.influencers for update
  using ( auth.uid() = id OR exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin') );

-- 6. Create Contests Table
create table public.contests (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  cover_url text,
  status contest_status default 'draft',
  start_date date,
  end_date date,
  prize_pool text,
  song_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.contests enable row level security;

create policy "Contests are viewable by everyone" 
  on public.contests for select using (true);

create policy "Admins can manage contests" 
  on public.contests for all 
  using ( exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin') );

-- 7. Create Contest Entries Table
create table public.contest_entries (
  id uuid default uuid_generate_v4() primary key,
  contest_id uuid references public.contests(id) on delete cascade not null,
  influencer_id uuid references public.influencers(id) on delete cascade not null,
  video_url text not null,
  views bigint default 0,
  likes bigint default 0,
  submitted_at timestamp with time zone default timezone('utc'::text, now()),
  unique(contest_id, influencer_id)
);

alter table public.contest_entries enable row level security;

create policy "Entries viewable by everyone" 
  on public.contest_entries for select using (true);

create policy "Influencers can submit entries" 
  on public.contest_entries for insert 
  with check ( auth.uid() is not null ); 

-- 8. STORAGE SETUP (Fix for image upload hanging)
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Authenticated users can upload avatars."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

create policy "Users can update own avatars."
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.uid() = owner )
  with check ( bucket_id = 'avatars' and auth.uid() = owner );

-- 9. Auto-create Profile Trigger
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'viewer');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 10. Seed Data
insert into public.influencers (name, handle_tiktok, handle_instagram, country, niches, tiktok_followers, instagram_followers, avatar_url, is_verified, campaign_streak)
values 
('Sarah Jenkins', '@sarahj_music', 'sarah.jenkins', 'USA', '{Music, Lifestyle}', 1200000, 450000, 'https://picsum.photos/200', true, 5),
('Davide Rossi', '@davide_vibes', 'davide.official', 'Italy', '{Fashion, Dance}', 850000, 900000, 'https://picsum.photos/201', false, 2),
('K-Pop Stans', '@kpop_daily', 'kpop.updates', 'South Korea', '{K-Pop, Entertainment}', 3200000, 120000, 'https://picsum.photos/202', true, 12);

insert into public.contests (title, description, status, start_date, end_date, prize_pool, cover_url)
values 
('Midnight Sky - Viral Challenge', 'Create a transition video using the drop of Midnight Sky.', 'active', '2023-10-01', '2023-11-01', '$5,000', 'https://picsum.photos/800/400');

-- 11. Sync Existing Users
insert into public.profiles (id, email, full_name, role)
select id, email, raw_user_meta_data->>'full_name', 'viewer'
from auth.users
on conflict (id) do nothing;

-- 12. Create Stats History Table (For historical analysis)
create table public.influencer_stats_history (
  id uuid default uuid_generate_v4() primary key,
  influencer_id uuid references public.influencers(id) on delete cascade not null,
  recorded_at timestamp with time zone default timezone('utc'::text, now()),
  tiktok_followers bigint default 0,
  instagram_followers bigint default 0,
  total_followers bigint default 0
);

alter table public.influencer_stats_history enable row level security;

create policy "Stats history viewable by everyone" 
  on public.influencer_stats_history for select using (true);
