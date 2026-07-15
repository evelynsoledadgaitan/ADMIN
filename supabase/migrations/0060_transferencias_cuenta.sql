-- 0060: Transferencia entre cuentas (decisión aprobada, punto 4 del
-- diseño) — aplicar el saldo a favor de un cliente para reducir la
-- deuda de otro. Herramienta general, no acotada a un caso puntual
-- (decisión explícita del cliente). Ver
-- docs/sistemas/cheques-cartera-pagos-compuestos-diseno.md.
--
-- Por dentro, reutiliza `ajustes_cuenta` — no hace falta ningún cálculo
-- de saldo nuevo: una transferencia son dos ajustes con signo opuesto
-- (uno resta al origen, uno suma al destino), agrupados por
-- `transferencia_id`. `saldos_clientes()` ya suma ajustes_cuenta —
-- sigue funcionando sin ningún cambio.
--
-- "Quién realizó la operación" (pedido explícito) no se guarda en una
-- columna propia — lo captura `registrar_auditoria()`, el mismo trigger
-- de siempre, que ya registra quién y cuándo en cualquier alta.

create table public.transferencias_cuenta (
  id uuid primary key default gen_random_uuid(),
  numero_interno bigint generated always as identity unique,

  origen_cliente_id uuid not null references public.clientes(id),
  destino_cliente_id uuid not null references public.clientes(id),
  check (origen_cliente_id <> destino_cliente_id),

  importe numeric(12,2) not null check (importe > 0),
  fecha date not null default current_date check (fecha <= current_date),
  motivo text,

  archived_at timestamptz,
  anulado_por uuid references public.usuarios(id),
  motivo_anulacion text,
  check (archived_at is null or anulado_por is not null),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.transferencias_cuenta
  for each row execute function public.set_updated_at();

create trigger audit_transferencias_cuenta
  after insert or update on public.transferencias_cuenta
  for each row execute function public.registrar_auditoria();

alter table public.ajustes_cuenta add column transferencia_id uuid references public.transferencias_cuenta(id);

-- Mismo permiso que ya usan los Ajustes (0025) — es la misma naturaleza
-- de operación (una corrección manual de cuenta corriente), no un
-- módulo aparte.
alter table public.transferencias_cuenta enable row level security;

create policy transferencias_cuenta_select on public.transferencias_cuenta for select
  using (public.tiene_permiso('ajustes', 'ver'));
create policy transferencias_cuenta_insert on public.transferencias_cuenta for insert
  with check (public.tiene_permiso('ajustes', 'crear'));
create policy transferencias_cuenta_update on public.transferencias_cuenta for update
  using (public.tiene_permiso('ajustes', 'archivar'))
  with check (public.tiene_permiso('ajustes', 'archivar'));
