-- 0021: importación masiva de productos (Sprint 5). Un único UPSERT por
-- lote en la base de datos — nunca un loop fila por fila desde el
-- frontend (observación E, aprobada). El frontend ya filtró y validó las
-- filas antes de llamar a esta función (ver csvParser.ts); acá solo
-- llegan filas limpias.
--
-- Reglas aplicadas (decisiones aprobadas del Sprint 5):
--   - Si el código no existe: se crea, sin categoría ("Sin categorizar").
--   - Si existe y está activo: se actualiza precio y (si cambió) nombre.
--     La categoría NUNCA se toca.
--   - Si existe y está archivado: se reactiva, se actualiza precio y
--     nombre, se mantiene toda su historia (nada se borra ni se
--     reemplaza — el historial de precios sigue funcionando igual,
--     vía los triggers ya existentes desde la Fase 0).
--   - Si nada cambió (mismo precio, mismo nombre, ya estaba activo): no
--     se escribe nada — evita auditoría y updated_at innecesarios.
--
-- Sin `security definer`: corre con los permisos del usuario que importa,
-- así que las políticas de RLS de `productos` (crear/modificar/archivar)
-- se aplican igual que en cualquier alta o modificación manual.

create or replace function public.importar_productos(p_filas jsonb)
returns table (creados int, actualizados int, reactivados int)
language plpgsql
as $$
declare
  v_creados int;
  v_actualizados int;
  v_reactivados int;
begin
  create temporary table tmp_importacion (
    codigo_barras text,
    nombre text,
    precio numeric(12,2)
  ) on commit drop;

  insert into tmp_importacion (codigo_barras, nombre, precio)
  select x->>'codigo_barras', x->>'nombre', (x->>'precio')::numeric
  from jsonb_array_elements(p_filas) as x;

  select count(*) into v_reactivados
  from public.productos p
  join tmp_importacion t on t.codigo_barras = p.codigo_barras
  where p.archived_at is not null;

  select count(*) into v_actualizados
  from public.productos p
  join tmp_importacion t on t.codigo_barras = p.codigo_barras
  where p.archived_at is null
    and (p.precio_actual is distinct from t.precio or p.nombre is distinct from t.nombre);

  select count(*) into v_creados
  from tmp_importacion t
  left join public.productos p on p.codigo_barras = t.codigo_barras
  where p.id is null;

  insert into public.productos (codigo_barras, nombre, precio_actual, categoria_id, archived_at)
  select codigo_barras, nombre, precio, null, null
  from tmp_importacion
  on conflict (codigo_barras) do update set
    nombre = excluded.nombre,
    precio_actual = excluded.precio_actual,
    archived_at = null,
    updated_at = now()
  where public.productos.precio_actual is distinct from excluded.precio_actual
     or public.productos.nombre is distinct from excluded.nombre
     or public.productos.archived_at is not null;

  return query select v_creados, v_actualizados, v_reactivados;
end;
$$;

comment on function public.importar_productos(jsonb) is
  'Upsert por lotes para importación de listas de precios. Espera un jsonb con formato [{"codigo_barras": "...", "nombre": "...", "precio": 123.45}, ...], ya validado por el frontend.';
