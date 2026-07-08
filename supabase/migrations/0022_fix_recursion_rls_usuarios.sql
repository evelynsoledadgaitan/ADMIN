-- 0022: corrige recursión infinita en RLS de `usuarios` y `permisos`.
--
-- Bug real encontrado durante el primer login contra una base de datos
-- real (Beta 0.1): las políticas `usuarios_admin_write`,
-- `permisos_select_propio` y `permisos_admin_write` (migración 0008)
-- resolvían "¿este usuario es admin?" con un SELECT directo contra
-- `usuarios` desde dentro de una política que protege esa misma tabla —
-- eso dispara la evaluación de RLS de nuevo, que vuelve a necesitar la
-- misma política, y así indefinidamente. PostgreSQL lo detecta y devuelve
-- "infinite recursion detected in policy for relation usuarios".
--
-- La solución es la misma que ya usa tiene_permiso() en toda la app desde
-- la Fase 0: una función `security definer` bypassea RLS en su propia
-- consulta interna, así que puede leer el rol del usuario sin volver a
-- evaluar la política que la está llamando.

create or replace function public.rol_actual()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.usuarios where id = auth.uid();
$$;

comment on function public.rol_actual() is
  'Devuelve el rol del usuario autenticado sin disparar RLS de usuarios (evita la recursión que tenían usuarios_admin_write/permisos_*). Usar esta función en cualquier policy que necesite saber si el usuario actual es admin, en vez de un SELECT directo a usuarios.';

drop policy usuarios_admin_write on public.usuarios;
create policy usuarios_admin_write on public.usuarios for all
  using (public.tiene_permiso('usuarios', 'ver') or public.rol_actual() = 'admin')
  with check (public.rol_actual() = 'admin');

drop policy permisos_select_propio on public.permisos;
create policy permisos_select_propio on public.permisos for select
  using (usuario_id = auth.uid() or public.rol_actual() = 'admin');

drop policy permisos_admin_write on public.permisos;
create policy permisos_admin_write on public.permisos for all
  using (public.rol_actual() = 'admin')
  with check (public.rol_actual() = 'admin');
