# 0032 — Informes

## Decisión

Informes consulta, resume y presenta datos que ADMIN ya registra en el resto de los módulos — sin Business Intelligence, sin gráficos obligatorios, **sin ninguna tabla nueva**. Es el primer módulo del roadmap puramente de lectura: ninguna de sus pantallas inserta, modifica ni anula nada.

**Sin tablas nuevas, pero con algunas consultas nuevas** — la mayoría de lo que ya existe en ADMIN está pensado "por entidad" (los pagos de tal proveedor, no todos los pagos de todos los proveedores), porque así están armadas las Fichas. Informes necesitó dos consultas nuevas y livianas (`useTodosLosMovimientos`, `useTodosLosPagosEmpleados`) que leen exactamente las mismas tablas de siempre, sin filtrar por una entidad puntual — mismo dato, otra forma de pedirlo.

**"Aguinaldos registrados" se sacó de esta primera versión** (decisión aprobada, punto 1) — no hay ningún dato estructurado que distinga un aguinaldo de un pago común en `pagos_empleados` (es texto libre en Concepto), y depender de una búsqueda de texto para un informe fue explícitamente rechazado.

**Permiso doble**: cada categoría de Informes exige el permiso `informes` **y** el del módulo que consulta (decisión aprobada, punto 2) — `SeccionInforme` es el único lugar donde se resuelve esto, sin tocar la RLS de las tablas subyacentes (que ya exige el permiso del módulo por su cuenta, sin cambios).

**"Mayor deuda" muestra la lista completa**, sin recortar a un Top 10 (decisión aprobada, punto 3).

**Los informes de saldo (Clientes, Proveedores) no llevan filtro de período** (decisión aprobada, punto 4) — son una foto del momento actual, no algo que varíe por semana/mes/año sin recalcular todo el historial (justamente el tipo de cálculo contable que no se quería). Mismo criterio se extendió a "Pendientes" y "Vencidas" de Contador (también son estado-actual); "Próximos vencimientos" sí lleva filtro, porque "qué vence este mes" es una pregunta legítima sobre un rango de `fecha_vencimiento`.

**Exportar a PDF y Excel, transversal a todos los informes** (pedido explícito, sin tocar la filosofía): Excel reutiliza `xlsx` (SheetJS), ya instalada desde el Bloque 2 — la misma librería que lee también escribe, cero dependencias nuevas. PDF reutiliza el mismo criterio que Facturación: sin ninguna librería de PDF, se abre una ventana nueva con una tabla simple y se dispara el diálogo de impresión nativo del navegador. El botón de exportar terminó siendo dos botones chicos (PDF / Excel) en vez de un menú desplegable, para no sumar `@radix-ui/react-dropdown-menu` (no estaba instalada) solo para 2 opciones.

**Tabla de solo lectura compartida** (`TablaInforme`) en vez de reutilizar `DataTable`/`ListView` — mismo criterio que ya usa `LibroCuentaCorriente`: una sola tabla con scroll horizontal, sin buscador ni paginación ni acciones por fila, porque ninguno de esos hacía falta acá (Exportar ya cubre "quiero llevarme todo").

## Por qué

Es la aplicación del documento de diseño ya aprobado (`docs/sistemas/informes-diseno.md`), respondido en las 4 preguntas fijas, con las 4 confirmaciones y el pedido de exportación incorporados antes de programar.

## Alcance de lo implementado
- `src/modules/informes/`: `periodo.ts` (cálculo de rangos), `exportar.ts` (Excel/PDF), `FiltroPeriodo`, `BotonExportar`, `TablaInforme`, `SeccionInforme` (gating de permisos), `PaginaCategoriaInformes`, `Informes` (landing), y las 5 categorías (`InformesClientes`, `InformesProveedores`, `InformesFacturacion`, `InformesEmpleados`, `InformesContador`).
- Dos consultas nuevas en `informes/api.ts` (`useTodosLosMovimientos`, `useTodosLosPagosEmpleados`) — mismas tablas de siempre, sin entidad puntual.
- Sin ninguna migración — cero cambios de base de datos.

## Mejora futura registrada — sin implementar

Con el módulo aprobado y cerrado, queda anotada una idea para más adelante, explícitamente **no** para implementar ahora: que otros módulos de ADMIN se apoyen en las consultas e indicadores de Informes para advertir situaciones que requieren atención (pendientes, inconsistencias, vencimientos, etc.) — es decir, que el sistema use sus propios informes para autocontrolarse, no solo para que una persona los consulte.

Encaja con precedentes ya construidos (la sección "Pendientes" de Inicio ya hace algo parecido en chico, con Facturación y Contador como fuentes) — la idea es generalizar ese patrón, apoyándose en Informes como la fuente de verdad de esas consultas en vez de que cada módulo arme la suya por separado. Se implementa el día que aparezca una necesidad real de uso, no por anticipación (criterio explícito del cliente).

## Alternativas descartadas
- **Una ruta por informe** (14 rutas): descartada por exceso de navegación para algo que se quiere "rápido de consultar" — quedaron 5 categorías, cada una con sus informes como secciones de una sola pantalla.
- **DataTable/ListView reutilizados tal cual**: descartado por el mismo motivo que ya se aplicó a `LibroCuentaCorriente` — demasiada infraestructura (buscador, paginación, acciones por fila) para tablas de solo lectura donde Exportar ya resuelve "necesito todo".
