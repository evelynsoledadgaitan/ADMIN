-- 0032: nuevo permiso "facturacion" — mismo criterio que "ajustes"
-- (migración 0025): Facturación es una capacidad propia, no heredada de
-- Clientes. Alguien puede gestionar Clientes sin poder emitir facturas,
-- o viceversa.

do $$
declare
  v_nombre_constraint text;
begin
  select conname into v_nombre_constraint
  from pg_constraint
  where conrelid = 'public.permisos'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%modulo%';

  if v_nombre_constraint is not null then
    execute format('alter table public.permisos drop constraint %I', v_nombre_constraint);
  end if;
end $$;

alter table public.permisos
  add constraint permisos_modulo_check check (modulo in (
    'clientes', 'proveedores', 'productos', 'cheques', 'empleados',
    'contador', 'notas', 'informes', 'usuarios', 'configuracion',
    'ajustes', 'facturacion'
  ));
