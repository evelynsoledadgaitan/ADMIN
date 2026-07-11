# 0038 — Informes: períodos, ordenamiento, filtros, resumen

## Decisión

Tercer ítem del documento "Mejoras para implementar en ADMIN". La regla ya aprobada se mantiene sin cambios: los informes de saldo (Clientes, Proveedores) siguen sin filtro de período — es la situación de hoy, no algo que varíe recalculando historial. Lo que se agrega es ordenamiento y filtros, que sí tienen sentido sobre una foto del momento.

**Reestructuración**: los informes de Clientes y Proveedores pasan de 3 secciones fijas (Saldos pendientes / Saldo a favor / Mayor deuda, que en la práctica mostraban el mismo dato con un filtro distinto cada una) a **una sola sección** con Filtro + Orden + rango de importe — más flexible, menos código repetido.

**"Más reciente/antigua actividad" — sin ninguna consulta nueva** (decisión aprobada explícita, ver conversación): se extendieron las funciones SQL que ya existían (`saldos_clientes()`, `saldos_proveedores()`, migración 0031) para que también calculen y devuelvan la fecha de actividad más reciente de cada cliente/proveedor, en la misma consulta de siempre — cero viajes nuevos a la base.

**Los hooks existentes (`useSaldosClientes`, `useSaldosProveedores`) no se tocaron** — siguen devolviendo `Map<id, saldo>` exactamente igual, usados sin cambios en 8 lugares de Clientes/Proveedores (los listados). Se sumaron `useSaldosClientesConActividad`/`useSaldosProveedoresConActividad`, hooks nuevos que llaman a la misma función SQL pero devuelven también la fecha — usados únicamente por Informes. Cero riesgo para módulos ya cerrados.

**Ambigüedades resueltas, ambas por decisión aprobada del cliente**:
- "Sin movimientos" = saldo exactamente $0, sin distinguir si alguna vez tuvo actividad.
- Los filtros de importe (Desde/Hasta) trabajan sobre el **valor absoluto** del saldo, sin importar el signo.

**Mismo ordenamiento para Clientes y Proveedores** (decisión aprobada: "prefiero mantener la misma experiencia de uso en ambos") — un único archivo de lógica compartida (`ordenFiltroSaldo.ts`) y un único componente de controles (`ControlesOrdenFiltro.tsx`), usados por los dos informes.

**La exportación ya respetaba los filtros por construcción** — `BotonExportar` siempre recibió las filas ya filtradas/ordenadas que se ven en pantalla, nunca la lista completa. No hizo falta tocar nada del exportador en sí.

## Por qué

Aplica el documento de diseño ya aprobado (`docs/sistemas/informes-mejoras-diseno.md`), con las 3 confirmaciones y el agregado de "más reciente/antigua actividad" incorporados antes de programar.

## Alcance de lo implementado
- Migración `0054`: `saldos_clientes()` y `saldos_proveedores()` devuelven también `ultima_actividad`.
- `useSaldosClientesConActividad`, `useSaldosProveedoresConActividad` (nuevos, sin tocar los existentes).
- `ordenFiltroSaldo.ts`, `ControlesOrdenFiltro.tsx`, `ResumenSaldo.tsx` (compartidos entre Clientes y Proveedores).
- `InformesClientes.tsx` reescrito (3 secciones → 1, con Filtro/Orden/Importe/Resumen).
- `InformesProveedores.tsx`: su sección de saldo reescrita igual; "Pagos realizados" sin cambios salvo las 2 opciones de período nuevas.
- `periodo.ts`: "Mes anterior" y "Año anterior" — a diferencia de los períodos existentes (que siempre terminan hoy), estos son el período calendario completo ya cerrado.

## Alternativas descartadas
- **Consulta nueva para "última actividad"**: descartada explícitamente por el cliente en favor de extender la función SQL existente — mismo número de consultas, un poco de migración en vez de tráfico de red adicional.
- **Cambiar el contrato de `useSaldosClientes`/`useSaldosProveedores`**: descartado para no tocar los 8 lugares que ya los usan en módulos cerrados — se prefirió sumar hooks nuevos en paralelo.
