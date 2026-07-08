# 0024 — Reorganización del flujo operativo

## Decisión

**Pantalla Principal:** los accesos rápidos pasan de altas de datos maestros (Nuevo cliente/proveedor/producto, Importar lista — ahora exclusivos del FAB de cada módulo) a las 4 operaciones diarias reales: Agregar deuda, Agregar ingreso de mercadería, Registrar cobro, Registrar pago. Cada una abre un flujo de 2 pasos: `SelectorEntidadDialog` (nuevo, `core/components/`, buscador con autocompletado, genérico — no sabe qué es un "cliente") → el formulario correspondiente, ya existente.

**"Ajuste" es una redirección, no un origen real.** Tanto en "Agregar deuda" como en "Agregar ingreso de mercadería", el selector de origen incluye "Ajuste" como una opción más — pero al elegirla, el diálogo se cierra y abre `RegistrarAjusteDialog` (el Ajuste real, con su permiso propio, su signo, su motivo obligatorio) en su lugar. `deudas_clientes.origen` y `compras.origen` **nunca** aceptan `'ajuste'` como valor almacenado — ese valor no existe en ninguno de los dos `CHECK`.

**Terminología "Ingreso de mercadería"** reemplaza a "Compra" en todo el texto visible de Proveedores (títulos de diálogo, botones, mensajes de éxito/error, el prefijo del número interno visible `ING-000001` en vez de `COMP-000001`). Los nombres técnicos internos (tabla `compras`, hooks `useCompras`/`useRegistrarCompra`, archivo `RegistrarCompraDialog.tsx`) no cambiaron — decisión explícita para no generar renombres de código innecesarios.

**Estado de Cuenta pasa a ser un libro contable único** (`LibroCuentaCorriente`, `modules/cuentaCorriente/`): Fecha, Concepto, Debe, Haber, Saldo acumulado, orden cronológico **ascendente** — la única lista de toda la app que no muestra "más reciente primero", a propósito. Se arma combinando (en el cliente, sin ninguna consulta nueva a Supabase) las deudas/ingresos, los movimientos del Motor de Pagos y los ajustes ya cargados. Los movimientos anulados se muestran en la tabla pero no alteran el saldo acumulado — mismo criterio que ya usan `saldo_cliente()`/`saldo_proveedor()`.

**Se preservó la capacidad de ver el detalle y anular un movimiento puntual**, que existía en las listas separadas que este Sprint reemplazó. Las filas del libro son clickeables (`onFilaClick`) y abren el mismo diálogo de detalle/anulación de siempre — identificado por un prefijo en el `id` de cada fila (`deuda-`, `cobro-`, `ingreso-`, `pago-`, `ajuste-`).

**Navegación tras guardar:** cualquier movimiento cargado desde los accesos rápidos de Inicio (deuda, ingreso, cobro, pago o el ajuste redirigido) navega automáticamente al Estado de cuenta de la entidad elegida al terminar — no vuelve a Inicio.

## Por qué

Es la aplicación directa de la propuesta ya aprobada (`docs/sistemas/reorganizacion-flujo-operativo.md`). Dos puntos vale la pena resaltar del proceso de implementación, no solo del diseño:

**Se encontró y corrigió una regresión antes de entregarla:** al reemplazar las 3 listas separadas de cada Estado de Cuenta (Deudas/Compras, Pagos, Ajustes) por el libro único, la primera versión perdía la posibilidad de tocar un movimiento para ver su detalle y anularlo — funcionalidad que ya existía. Se resolvió exportando los diálogos de detalle/anulación (que antes vivían privados dentro de cada lista) y conectándolos a los clics de fila del libro nuevo, sin duplicar ninguna lógica de anulación ya construida.

**El campo `origen` de Proveedores necesitó una migración nueva** (`0028`) porque `compras` nunca lo había tenido — a diferencia de `deudas_clientes`, que ya lo tenía desde el Sprint de Cuenta Corriente compartida. Se agregó con un valor por defecto transitorio (`'mercaderia'`) para no romper filas ya cargadas, y se quitó el default después — cualquier ingreso nuevo exige elegir el origen explícitamente.

## Alternativas descartadas
- **Un segundo tipo de "Ajuste" dentro de Deuda/Ingreso** (origen `'ajuste'` real, separado del Ajuste ya construido): descartado explícitamente por el cliente — hubiera significado dos conceptos con el mismo nombre y comportamiento distinto (uno con permiso especial y signo, el otro no).
- **Eliminar por completo las listas Detalle\*Dialog** al introducir el libro: descartado al detectar que eso quitaba la capacidad de anular un movimiento puntual — se conservaron, solo se les cambió cómo se llega a ellas (desde el libro, no desde una lista propia).
- **Orden "más reciente primero"** en el libro contable, por consistencia con el resto de la app: descartado explícitamente por el cliente — un saldo acumulado necesita leerse de más viejo a más nuevo.

## Nota de rendimiento
El bundle inicial de la app creció (~530KB → ~646KB sin comprimir) porque `PantallaPrincipal` ahora importa directamente los 4 diálogos de registro (antes solo los usaban pantallas con carga diferida). Con los volúmenes de este proyecto no es un problema real todavía, pero queda anotado como el próximo candidato a revisar si el tiempo de carga inicial se vuelve perceptible — la solución (cargar esos diálogos de forma diferida, mismo mecanismo que ya usan las rutas de módulo) no requiere ningún cambio de arquitectura, es un ajuste de importación.
