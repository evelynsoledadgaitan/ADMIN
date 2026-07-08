-- 0025: nuevo permiso "ajustes" — independiente de Clientes y Proveedores
-- (decisión aprobada, 6.4). No es un módulo nuevo en el Menú ni una ruta
-- nueva: es exclusivamente un permiso más que un admin puede asignar,
-- porque ajustar el saldo de una cuenta es una operación sensible que no
-- necesariamente debería habilitar el mismo permiso de "modificar" un
-- cliente o un proveedor.
--
-- Se reemplaza el CHECK de permisos.modulo (no se puede alterar un CHECK
-- existente en PostgreSQL, hay que quitarlo y crearlo de nuevo). Se busca
-- el nombre real de la restricción en el catálogo en vez de asumirlo, por
-- las dudas de que Postgres le haya asignado un nombre distinto al
-- esperado.

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
    'ajustes'
  ));
