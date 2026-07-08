-- 0016: orden cronológico estable en Estado de cuenta (observación C,
-- Sprint 4): fecha descendente y, en caso de igualdad, created_at
-- descendente. Se ajustan los índices de `movimientos` (Sprint 3) para
-- que también cubran el desempate por created_at, igual que el índice
-- nuevo de `compras`.

drop index public.movimientos_cliente_idx;
drop index public.movimientos_proveedor_idx;

create index movimientos_cliente_idx on public.movimientos (cliente_id, fecha desc, created_at desc)
  where cliente_id is not null;
create index movimientos_proveedor_idx on public.movimientos (proveedor_id, fecha desc, created_at desc)
  where proveedor_id is not null;
