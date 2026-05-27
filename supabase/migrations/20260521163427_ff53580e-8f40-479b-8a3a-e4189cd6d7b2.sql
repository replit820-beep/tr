-- Roles enum
create type public.app_role as enum ('admin', 'user');

-- user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamp with time zone not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Security definer role check
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- RLS on user_roles: users can read their own roles; admins can read all
create policy "users read own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "admins read all roles"
  on public.user_roles for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "admins manage roles"
  on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Extend orders RLS for admins
create policy "admins view all orders"
  on public.orders for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "admins update all orders"
  on public.orders for update
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "admins delete orders"
  on public.orders for delete
  using (public.has_role(auth.uid(), 'admin'));

-- Profiles: admins read all (select_all already true; redundant but explicit)
create policy "admins update all profiles"
  on public.profiles for update
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
