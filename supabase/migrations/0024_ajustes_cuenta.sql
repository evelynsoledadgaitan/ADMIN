-- 0024: Ajustes de cuenta corriente — la única pieza de este sistema que
-- es genuinamente compartida entre Clientes y Proveedores (no hay ninguna
-- diferencia real de negocio entre "ajustar el saldo de un cliente" y
-- "ajustar el saldo de un proveedor"). Mismo patrón de columnas
-- específicas por entidad que ya usa `movimientos` (Sprint 3) — no una
-- tabla polimórfica.
--
-- Un ajuste puede ser positivo o negativo (decisión aprobada, 6.3) — un
-- único `monto` con signo, no dos tipos separados. El motivo es siempre
-- obligatorio (6.5, sin excepción) — a diferencia de `motivo_anulacion`
-- en el resto del sistema, que es opcional: un ajuste ES una corrección
-- discrecional, así que la explicación no es opcional, es el dato
-- principal.
--
-- Mismo criterio de inmutabilidad que el resto: no se edita, solo se anula.

create table public.ajustes_cuenta (
  id uuid primary key default gen_random_uuid(),

  numero_interno bigint generated always as identity unique,

  cliente_id uuid references public.clientes(id),
  proveedor_id uuid references public.proveedores(id),

  monto numeric(12,2) not null check (monto <> 0), -- con signo: positivo o negativo, nunca cero
  motivo text not null,                             -- obligatorio siempre (6.5)
  fecha date not null default current_date check (fecha <= current_date),

  archived_at timestamptz,
  anulado_por uuid references public.usuarios(id),
  motivo_anulacion text,
  check (archived_at is null or anulado_por is not null),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (
    (cliente_id is not null and proveedor_id is null)
    or (proveedor_id is not null and cliente_id is null)
  )
);

create trigger set_updated_at
  before update on public.ajustes_cuenta
  for each row execute function public.set_updated_at();

create trigger audit_ajustes_cuenta
  after insert or update on public.ajustes_cuenta
  for each row execute function public.registrar_auditoria();

create index ajustes_cuenta_cliente_idx on public.ajustes_cuenta (cliente_id, fecha desc, created_at desc)
  where cliente_id is not null;
create index ajustes_cuenta_proveedor_idx on public.ajustes_cuenta (proveedor_id, fecha desc, created_at desc)
  where proveedor_id is not null;
