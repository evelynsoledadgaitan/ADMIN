-- 0053: RLS de Notas — mismo patrón de siempre, permiso `notas` (ya
-- existía en permisos.modulo desde la Fase 0). Como la tabla admite
-- edición directa (a diferencia del resto del sistema), el UPDATE usa el
-- permiso `modificar` — no `archivar`, que queda reservado para la
-- acción de archivar en sí.

alter table public.notas enable row level security;

create policy notas_select on public.notas for select
  using (public.tiene_permiso('notas', 'ver'));
create policy notas_insert on public.notas for insert
  with check (public.tiene_permiso('notas', 'crear'));
create policy notas_update on public.notas for update
  using (public.tiene_permiso('notas', 'modificar') or public.tiene_permiso('notas', 'archivar'))
  with check (public.tiene_permiso('notas', 'modificar') or public.tiene_permiso('notas', 'archivar'));
