# 0012 — Título dinámico de la TopBar y rendimiento del listado (Sprint 2)

## Decisión

**Título dinámico:** se agregó `PageTitleProvider` + `usePageTitle(titulo)` (`core/`), siguiendo el mismo patrón que `ToastProvider`/`ConfirmDialogProvider`. Cualquier pantalla puede anunciar su propio título; si no anuncia nada, la `TopBar` cae al nombre del módulo (comportamiento previo, sin cambios para los módulos que todavía no lo usan).

**Rendimiento del listado, pensado para miles de registros:**
- El **orden** de cualquier listado sale siempre de `ORDER BY` en la consulta a la base de datos (con el índice ya creado en la Fase 0), nunca de un `.sort()` en React. Así un cliente nuevo aparece en su posición alfabética correcta apenas se refresca la lista, sin lógica de reordenamiento en el cliente.
- El **filtro de búsqueda** en `ListView` usa `React.useDeferredValue` (built-in de React 18) en vez de un debounce manual con `setTimeout` — evita que cada tecla tipeada bloquee el hilo principal si la lista es grande, sin sumar ninguna dependencia.
- La **búsqueda** ahora es insensible a mayúsculas y acentos (`normalizarTexto` en `core/lib/utils.ts`, usada dentro de `ListView`) — "José" encuentra "jose".
- **No se implementó virtualización** (ej. `react-window`) todavía — no hace falta con los volúmenes actuales, y el cliente pidió explícitamente no meter optimizaciones complejas antes de que hagan falta. Cuando la cantidad real de filas lo justifique, se puede agregar sin cambiar la API pública de `ListView`, porque `renderItem` ya recibe un ítem a la vez (el prerequisito para virtualizar).

**Ficha sin datos técnicos:** `CampoSoloLectura` omite renderizar cualquier campo vacío (`null`/`undefined`/string vacío) — así ninguna Ficha necesita decidir caso por caso qué mostrar cuando un dato opcional no está cargado. Además, deliberadamente **no** se muestran `id`, `created_at` ni `updated_at` en la Ficha de Clientes (sí se ven fechas en "Actividad" del Estado de Cuenta, que es información de trabajo, no un dato técnico interno) — pedido explícito del cliente.

## Por qué

**Título dinámico vía provider y no vía `handle` de React Router:** se evaluaron las dos opciones en el documento de arquitectura del módulo Clientes (sección 3). `handle` alcanza para títulos estáticos ("Nuevo cliente") pero no resuelve el título de la Ficha, que depende de datos que todavía no llegaron cuando la ruta se resuelve. Un solo mecanismo para los dos casos es más simple que combinar dos.

**`useDeferredValue` en vez de una librería de debounce:** mismo criterio que ya se usó para las transiciones de pantalla (`docs/decisiones/0010`) — React ya trae una herramienta que resuelve esto, agregar una dependencia sería una complejidad que no aporta nada nuevo.

**Orden en la base de datos, no en el cliente:** es la única forma de que "aparecer en la posición correcta" siga siendo instantáneo sin importar si hay 50 o 5000 clientes — ordenar 5000 filas en JavaScript en cada render es exactamente el tipo de cosa que hay que evitar si se piensa en escala desde el diseño, aunque hoy no haga falta.

## Alternativas descartadas
- **Virtualizar el listado ya mismo**: descartado por ser una optimización prematura — el cliente pidió explícitamente diseñar pensando en el escenario, no resolverlo antes de tiempo.
- **Ordenar en el cliente después de traer todos los registros**: descartado por no escalar — con miles de registros, traer todo y ordenar en memoria es más lento y más pesado que dejar que PostgreSQL lo resuelva con el índice ya creado.
