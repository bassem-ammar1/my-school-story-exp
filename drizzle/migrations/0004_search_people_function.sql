create or replace function public.search_people(_term text)
returns table(id uuid, display_name text, avatar_url text, grade integer, role app_role)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.display_name, p.avatar_url, p.grade,
    coalesce((select ur.role from public.user_roles ur where ur.user_id = p.id order by case ur.role when 'school_admin' then 0 when 'teacher' then 1 else 2 end limit 1), 'student'::app_role) as role
  from public.profiles p
  where _term is null or btrim(_term) = '' or p.display_name ilike '%' || btrim(_term) || '%'
  order by p.display_name
  limit 20
$$;

revoke all on function public.search_people(text) from public;
grant execute on function public.search_people(text) to authenticated;