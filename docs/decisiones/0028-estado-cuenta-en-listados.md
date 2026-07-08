# 0028 — Estado de cuenta en los listados de Clientes y Proveedores

## Decisión

Los listados principales de Clientes y Proveedores reemplazan sus columnas administrativas (Razón social, Facturación en Clientes; Razón social, CUIT en Proveedores) por una única columna **Estado de cuenta**: el saldo, en color y signo, sin texto ("Debe"/"Al día"/"A favor" no aparecen en ningún lado). Mismo criterio en Filtro (Todos/Con deuda/Al día/Saldo a favor) y en la fila de celular. La información administrativa sigue existiendo tal cual, solo que ahora vive exclusivamente en la Ficha de cada uno.

**Dos piezas técnicas no explícitas en el pedido, documentadas en detalle en `docs/sistemas/estado-cuenta-listado.md`:**

1. **`saldos_clientes()`/`saldos_proveedores()`** (migración `0031`): funciones nuevas que devuelven el saldo de todos los clientes/proveedores activos en una sola consulta, para no convertir el listado en N llamadas a Supabase (una por fila).
2. **Traducción de signo**: el saldo interno (positivo = hay una deuda, sea de quien sea) se muestra invertido (`mostrado = -saldo`) en un único componente compartido (`EstadoCuentaBadge`), para que rojo/negativo signifique siempre "hay algo pendiente" y azul/positivo "a favor" — igual en Clientes que en Proveedores, por construcción.

## Por qué

Es la aplicación directa de lo pedido, con la arquitectura necesaria para que funcione a la escala de un listado completo (no de una sola ficha) sin degradar el rendimiento, y con una única fuente de verdad para la representación visual — evita que el día de mañana alguien reimplemente la misma traducción de signo de otra forma en un tercer lugar y los números dejen de coincidir entre pantallas.

## Alcance de lo implementado
- Migración `0031`: `saldos_clientes()`, `saldos_proveedores()`.
- `modules/cuentaCorriente/EstadoCuentaBadge.tsx` (componente + `estadoCuentaDe()` + `valorOrdenEstadoCuenta()`).
- `useSaldosClientes()`, `useSaldosProveedores()`.
- `ListadoClientes.tsx`, `ListadoProveedores.tsx`: columna, filtro, orden, fila de celular.

## Alternativas descartadas
- **Una consulta de saldo por fila** (reusar `saldo_cliente()`/`saldo_proveedor()` tal cual): descartada por el problema N+1 — con más de una decena de filas ya se nota.
- **Mostrar el saldo interno tal cual, sin invertir el signo**: hubiera funcionado matemáticamente pero no habría dado la lectura unificada pedida ("rojo siempre es pendiente, sea cliente o proveedor").
