# Módulo Clientes — Propuesta funcional y técnica (Sprint 2)

Documento de diseño. No incluye implementación — es para aprobación antes de escribir código, según la metodología acordada.

---

## 1. Modelo de datos

**No se necesita ninguna columna nueva.** El esquema de `clientes` ya definido en la Fase 0 (`supabase/migrations/0004_clientes_y_proveedores.sql`) cubre exactamente los campos del análisis funcional — este Sprint solo agrega **dos restricciones de formato** a nivel de base de datos (sección 5) y **cero campos**.

| Campo | Tipo | Obligatorio | Origen |
|---|---|---|---|
| `id` | uuid | — | generado |
| `nombre_apellido` | text | **Sí** — único campo obligatorio | input libre |
| `factura_config` | `'siempre' \| 'nunca' \| 'preguntar'` | Sí (default `'preguntar'`) | selección cerrada |
| `razon_social` | text | No | input libre |
| `cuit` | text | No | input libre, formato validado si se completa |
| `condicion_iva_id` | uuid → `condiciones_iva` | No | catálogo (Configuración) |
| `domicilio_fiscal` | text | No | input libre |
| `email` | text | No | input libre, formato validado si se completa |
| `archived_at` | timestamptz | — | se setea al archivar, nunca al crear |
| `created_at` / `updated_at` | timestamptz | — | automáticos |

No hay campo de teléfono, dirección genérica ni observaciones — coincide con la restricción explícita del brief original ("no agregar datos innecesarios"). No propongo agregar nada acá.

---

## 2. Pantallas

Recorrido general:

```
Menú ──► Listado ──► Ficha ──┬──► Modificación ──► (vuelve a Ficha)
              │               ├──► Estado de cuenta
              │               └──► Archivar (confirmación) ──► vuelve a Listado
              └──► Alta ──► (vuelve a Listado)
```

Rutas propuestas (todas dentro de `AppShell`, heredan TopBar + BottomNav):

| Ruta | Pantalla |
|---|---|
| `/clientes` | Listado |
| `/clientes/nuevo` | Alta |
| `/clientes/:id` | Ficha |
| `/clientes/:id/editar` | Modificación |
| `/clientes/:id/cuenta` | Estado de cuenta |

### 2.1 Listado de clientes

**Distribución:** `ListView` completo — buscador fijo, filas ordenadas alfabéticamente por `nombre_apellido`, FAB `+`.

**Componentes:** `ListView` (existente, sin cambios). Cada fila es una `Card` simple sin borde propio (el borde lo pone la lista, `divide-y`) mostrando `nombre_apellido` y, si existe, `razon_social` en gris debajo.

**Navegación:** tocar una fila → `/clientes/:id` (Ficha). Tocar `+` → `/clientes/nuevo` (Alta).

**Acciones:** ninguna acción inline en la fila (ni archivar ni editar desde el listado) — se accede siempre a través de la Ficha, para no ensuciar la fila con botones chicos difíciles de tocar. Es consistente con "excelente experiencia táctil".

**Estado vacío:** `"No hay clientes."` (ya implementado en el esqueleto del Sprint 1, se reemplaza `items={[]}` por la query real).

**Estado de carga:** `ListView` con `cargando={isLoading}` → 3 `SkeletonFila`.

**Estado de error:** si la query falla (ej. sin conexión), la lista muestra `EmptyState` con `mensaje="No se pudieron cargar los clientes."` y `accion={{ texto: 'Reintentar', onClick: refetch }}`. No se usa un componente nuevo — es el mismo `EmptyState` con distinto mensaje y una acción.

### 2.2 Alta de cliente

**Distribución:** un único `FormBlock` (no hay tantos campos como para justificar más de un bloque, salvo la separación conceptual que propongo abajo). Botones `Guardar` (verde) y `Cancelar` (gris) fijos al pie.

Propongo dos bloques, no uno, para que el formulario se lea igual que el brief lo pensó (dato obligatorio primero, facturación aparte):

```
┌ Datos del cliente ──────────────┐
│ Nombre y apellido *   [TextField]│
└──────────────────────────────────┘
┌ Facturación ─────────────────────┐
│ ¿Factura?    [Select: Siempre / Nunca / Preguntar]
│ Razón social         [TextField] │  (visible solo si Siempre o Preguntar — ver 4.1)
│ CUIT                 [TextField] │
│ Condición IVA        [Select]    │
│ Domicilio fiscal     [TextField] │
│ Email                [TextField] │
└──────────────────────────────────┘
[Cancelar]  [Guardar]
```

**Componentes:** `FormBlock` × 2, `TextField` × 4, `Select` × 2 (factura_config, condición IVA) — todos ya existen. **Ningún componente nuevo.**

**Navegación:** desde Listado (FAB). Al guardar con éxito → `toast.exito('Cliente guardado')` → vuelve a `/clientes`. Al tocar `Cancelar` con cambios sin guardar → `useConfirm()` ("¿Descartar los cambios?") antes de salir; sin cambios, sale directo.

**Acciones:** Guardar (crea el registro), Cancelar (descarta).

**Estado vacío:** no aplica (es un formulario, no un listado).

**Estado de carga:** mientras se envía, `Guardar` pasa a `disabled` con texto `"Guardando..."` (mismo patrón que `Login`) y los campos quedan `disabled`. El Select de condición IVA se carga al entrar a la pantalla (catálogo) — mientras tanto, `disabled` con placeholder `"Cargando..."`.

**Estado de error:** error de validación → mensaje bajo el campo (`error` prop de `TextField`/`Select`), sin Snackbar. Error de guardado (ej. RLS, sin conexión) → `toast.error('No se pudo guardar el cliente')`, el formulario conserva lo tipeado.

### 2.3 Modificación de cliente

Igual que Alta, pero:
- Los campos llegan precargados con los datos actuales (query a `clientes` por `id`).
- El botón principal es `Modificar` (amarillo) en vez de `Guardar` (verde) — regla del brief: amarillo es para modificar un registro existente.
- Al confirmar con éxito → `toast.exito('Cliente modificado')` → vuelve a `/clientes/:id` (Ficha), no al listado.

**Componentes:** los mismos que Alta. **Ningún componente nuevo.**

**Estado de carga inicial** (mientras llega el cliente a editar): `SpinnerPantallaCompleta`, no skeleton de formulario — es una espera corta y no vale la pena un esqueleto de campos para esto.

### 2.4 Ficha del cliente

**Distribución:** cabecera con el nombre, debajo los datos agrupados igual que en el formulario pero en modo lectura, y al pie las acciones.

```
┌──────────────────────────────────┐
│ [Nombre y Apellido]               │
│ [Razón social, si existe]         │
├───────────────────────────────────┤
│ Facturación: Siempre / Nunca / Preguntar
│ CUIT: ...        Condición IVA: ...
│ Domicilio fiscal: ...
│ Email: ...
└───────────────────────────────────┘
[Ver estado de cuenta]
[Modificar]  [Archivar]
```

**Componentes:** acá sí propongo **un componente nuevo, chico y genuinamente reutilizable**: `CampoSoloLectura` (label arriba, valor abajo — el mismo layout visual de `TextField` pero sin input). Justificación: toda Ficha futura (Proveedores, Productos, Empleados) va a necesitar mostrar datos en modo lectura con el mismo aspecto que el formulario de edición; sin este componente, cada Ficha terminaría inventando su propio párrafo de texto suelto. Es exactamente el tipo de componente que el Design System pide crear solo cuando es realmente reutilizable — este lo es, porque se va a repetir en cada módulo con Ficha.

Resto: `Card` para agrupar, `Button` (`modificar`, `archivar`, `neutral` para "Ver estado de cuenta").

**Navegación:** desde el Listado (tocar una fila). `Modificar` → `/clientes/:id/editar`. `Ver estado de cuenta` → `/clientes/:id/cuenta`. `Archivar` → diálogo de confirmación in-place (no navega).

**Acciones:**
- **Modificar** (amarillo) → navega a Modificación.
- **Archivar** (negro) → `useConfirm({ titulo: 'Archivar cliente', mensaje: 'Dejará de aparecer en el listado. No se elimina.', accionConfirmar: 'archivar' })`. Si confirma → `UPDATE archived_at = now()` → `toast.exito('Cliente archivado')` → vuelve a `/clientes`.
- **Ver estado de cuenta** (neutral) → navega, no requiere confirmación.

**Estado vacío:** no aplica.

**Estado de carga:** `SpinnerPantallaCompleta` mientras llega el cliente.

**Estado de error:** si el `id` no existe o no tiene permiso de ver → `EmptyState` de página completa: `"No se encontró el cliente."` con acción `"Volver al listado"`.

### 2.5 Estado de cuenta

Esta pantalla **no incluye pagos todavía** (Sprint aparte, según se pidió). Lo que sí puede mostrar hoy, con la infraestructura ya construida:

```
┌──────────────────────────────────┐
│ [Nombre y Apellido]               │
├───────────────────────────────────┤
│ Movimientos                       │
│  "Todavía no hay movimientos."    │  ← reservado para Pagos/Facturas
├───────────────────────────────────┤
│ Actividad                         │
│  Creado · vos · 2/7/2026 10:32    │  ← real, desde audit_log
│  Modificado · vos · 3/7/2026 09:10│
└───────────────────────────────────┘
```

**Componentes:** `Card` × 2, `EmptyState` para "Movimientos" (mismo componente que ya existe, mensaje distinto). Para "Actividad" propongo un segundo componente nuevo y reutilizable: **`HistorialAuditoria`** — una lista simple (no un `ListView`, no necesita buscador ni FAB) que recibe `tabla` y `registroId`, consulta `audit_log` y renderiza cada evento como "Creado/Modificado/Archivado · usuario · fecha". Justificación: **todos** los módulos con Ficha (Proveedores, Productos, Empleados) van a querer mostrar lo mismo — es auditoría genérica, no algo específico de Clientes. Construirlo acá y reusarlo después es más barato que reescribirlo cuatro veces.

**Navegación:** solo se llega desde la Ficha. TopBar con flecha "volver" (regla ya existente en `AppShell`, no requiere cambios).

**Acciones:** ninguna en esta pantalla en este Sprint (de solo lectura).

**Estado vacío:** "Movimientos" siempre vacío por ahora (correcto, no es un bug). "Actividad" no debería estar nunca vacía (todo cliente tiene al menos un evento de creación) — si lo estuviera, sería indicio de un problema de permisos (ver sección 6, pregunta abierta), no de falta de datos.

**Estado de carga:** `Skeleton` (2-3 líneas) mientras se consulta `audit_log`.

**Estado de error:** si la consulta de auditoría falla (más probable que sea un tema de permisos que de red — ver sección 6), mostrar el bloque "Actividad" con `EmptyState` chico: `"No se pudo cargar la actividad."`, sin Snackbar (no es una falla de una acción que el usuario disparó, es contenido que no cargó).

---

## 3. Necesidad técnica nueva: título dinámico en la TopBar

`TopBar` hoy arma su título únicamente a partir del registro estático `core/theme/modulos.ts` (siempre dice "Clientes" en cualquier ruta que empiece con `/clientes`). Para Alta, Modificación y Ficha conviene un título más específico: "Nuevo cliente", "Editar cliente", o el nombre real del cliente en la Ficha (que no se conoce hasta que la query responde).

**Propuesta:** agregar un `PageTitleProvider` liviano (mismo patrón que `ToastProvider`/`ConfirmDialogProvider`) con un hook `usePageTitle(titulo)` que cada pantalla llama para anunciar su propio título; `TopBar` lo lee y, si no hay ninguno anunciado, cae al nombre del módulo como hace hoy. Es un componente de infraestructura (va en `core/`), no específico de Clientes, y lo van a necesitar todos los módulos siguientes con pantallas de detalle.

**Alternativa descartada:** usar `handle` de React Router (`useMatches()`) para títulos estáticos. Funciona bien para "Nuevo cliente" pero no resuelve el caso de la Ficha, donde el título depende de datos que todavía no llegaron cuando se resuelve la ruta — necesitaría combinarse con algo como lo anterior de todos modos, así que no simplifica nada y suma un mecanismo más. Prefiero un solo mecanismo para los dos casos.

---

## 4. Preguntas abiertas (dudas funcionales — necesito tu decisión antes de programar)

### 4.1 Campos de facturación condicionales
Propongo que si `factura_config = 'nunca'`, los campos de facturación (razón social, CUIT, condición IVA, domicilio fiscal) queden ocultos en el formulario — no tiene sentido pedirlos si nunca se va a facturar. Si es `'siempre'` o `'preguntar'`, se muestran, pero **ninguno es obligatorio** salvo que me confirmes lo contrario (podría pedirse razón social + CUIT + condición IVA como obligatorios cuando es `'siempre'`, ya que ahí sí se sabe con certeza que van a hacer falta para facturar). ¿Cuál de las dos preferís?

### 4.2 Alcance de "Actividad" (permisos)
`audit_log` hoy solo es legible por usuarios con permiso de **Informes** (`tiene_permiso('informes', 'ver')`, definido en la Fase 0). Si un usuario tiene permiso de ver Clientes pero no de ver Informes, no va a poder ver la sección "Actividad" de la Ficha, aunque sea su propio cliente. Dos caminos:
- (a) Ampliar la policy de `audit_log` para que también sea visible a quien tenga permiso de **ver** la tabla de origen (`clientes`, `proveedores`, etc.) — más natural para este caso de uso, pero un poco más de lógica en la policy.
- (b) Dejarlo como está y aceptar que "Actividad" es exclusiva de usuarios con permiso de Informes.

Recomiendo (a). ¿Confirmás?

### 4.3 Validación de CUIT
Propongo validar en el formulario que el CUIT tenga 11 dígitos (ignorando guiones que el usuario escriba). **No** propongo validar el dígito verificador real (el algoritmo de AFIP) en este Sprint — es una regla más estricta y no vi que esté pedida; se puede agregar después sin romper nada. ¿Lo dejamos así o preferís el dígito verificador completo ya?

### 4.4 Selector de "¿Factura?" — Select vs. control segmentado
El campo `factura_config` tiene exactamente 3 opciones fijas. Puedo resolverlo con el `Select` ya existente (cero componentes nuevos) o con un control segmentado de 3 botones (más cómodo al tacto porque no hay que abrir un desplegable, pero es un componente nuevo). Mi recomendación es usar `Select` para este Sprint — es consistente con el resto del formulario y no suma una pieza nueva al Design System para un solo caso de uso. Si en el futuro aparecen más campos de 2-3 opciones fijas en otros módulos, ahí sí valdría la pena construir el control segmentado una vez y reusarlo. ¿Estás de acuerdo?

---

## 5. Validaciones

| Campo | Frontend | Base de datos |
|---|---|---|
| `nombre_apellido` | Requerido, no vacío (trim) | `NOT NULL` (ya existe) |
| `factura_config` | Siempre uno de los 3 valores (lo garantiza el `Select`) | `CHECK` (ya existe) |
| `email` | Si se completa, formato de email válido | **Nuevo:** `CHECK (email IS NULL OR email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')` |
| `cuit` | Si se completa, 11 dígitos (ver 4.3) | **Nuevo:** `CHECK (cuit IS NULL OR cuit ~ '^\d{11}$')` — se normaliza a solo dígitos antes de guardar |
| `razon_social`, `domicilio_fiscal` | Ninguna (texto libre opcional) | Ninguna |
| `condicion_iva_id` | Debe ser uno de los valores del catálogo (lo garantiza el `Select`, que solo ofrece opciones reales) | `FOREIGN KEY` (ya existe) |

**Por qué duplicar en base de datos lo que ya valida el frontend:** el frontend evita que un usuario normal mande un dato mal cargado, pero no protege contra una escritura directa (una futura integración, una corrección manual, un bug). Los `CHECK` nuevos son la migración `0009_validaciones_clientes.sql`, que se crea recién cuando apruebes este documento.

**No propongo** una restricción de unicidad sobre `nombre_apellido`: dos clientes distintos pueden compartir nombre y apellido en la vida real (no es un identificador), así que forzar unicidad generaría falsos rechazos.

---

## 6. Auditoría

No requiere ningún cambio: `clientes` ya tiene el trigger `audit_clientes` (migración `0006_auditoria.sql`) enganchado a `AFTER INSERT OR UPDATE`. Esto significa que **Alta**, **Modificación** y **Archivar** quedan auditados automáticamente sin que el módulo tenga que hacer nada explícito — ni una llamada extra, ni una tabla paralela. El trigger ya distingue `archive` de `update` mirando si `archived_at` pasó de `NULL` a una fecha.

Lo único nuevo que este módulo necesita de auditoría es **leerla** para la pantalla de Estado de cuenta (sección 2.5), lo cual depende de la decisión de la pregunta 4.2.

---

## 7. Casos de uso (flujo completo)

### Crear cliente
1. Usuario en Listado toca `+`.
2. Completa `nombre_apellido` (obligatorio) y, opcionalmente, los datos de facturación.
3. Toca `Guardar`. Frontend valida formato (email/CUIT si están completos).
4. `INSERT` a `clientes`. La base de datos valida `NOT NULL`, `CHECK` de `factura_config`, y los `CHECK` nuevos de email/CUIT.
5. El trigger `audit_clientes` registra `accion = 'insert'` con `usuario_id = auth.uid()`.
6. `toast.exito('Cliente guardado')`, navega a `/clientes`. El listado se refresca (invalidación de caché de React Query).

### Modificar cliente
1. Usuario en Ficha toca `Modificar`.
2. Formulario precargado con los datos actuales.
3. Cambia lo que necesite, toca `Modificar`.
4. `UPDATE` a `clientes` (mismas validaciones que en creación).
5. El trigger detecta que `archived_at` no cambió (sigue `NULL`) → registra `accion = 'update'`.
6. `toast.exito('Cliente modificado')`, vuelve a la Ficha con los datos actualizados.

### Archivar cliente
1. Usuario en Ficha toca `Archivar`.
2. `useConfirm()` — el usuario debe confirmar explícitamente.
3. Si confirma: `UPDATE clientes SET archived_at = now() WHERE id = ...`.
4. El trigger detecta que `archived_at` pasó de `NULL` a una fecha → registra `accion = 'archive'` (no `'update'`).
5. `toast.exito('Cliente archivado')`, navega a `/clientes`. El cliente ya no aparece en el listado (que siempre filtra `archived_at IS NULL`), pero el registro y todo su historial de auditoría siguen intactos — nunca se borra nada.

### Consultar estado de cuenta
1. Usuario en Ficha toca `Ver estado de cuenta`.
2. Navega a `/clientes/:id/cuenta`.
3. Se consulta `audit_log` filtrado por `tabla = 'clientes' AND registro_id = :id` (sujeto a la decisión de la pregunta 4.2).
4. "Movimientos" se muestra vacío — no hay todavía ninguna fuente de datos para llenarlo (eso es Pagos, Sprint aparte).
5. "Actividad" muestra la lista de eventos reales (creado/modificado/archivado, quién, cuándo).

---

## 8. Resumen de componentes del Design System utilizados

`ListView`, `SearchField` (vía ListView), `EmptyState`, `SkeletonFila`/`Skeleton`, `SpinnerPantallaCompleta`, `FormBlock`, `TextField`, `Select`, `Card`, `Button` (variantes `guardar`, `modificar`, `archivar`, `neutral`, `cancelar`), `useToast`, `useConfirm`. **Cero cambios** a ninguno de estos.

Componentes nuevos propuestos (justificados por reutilización futura en otros módulos, no específicos de Clientes):
- `CampoSoloLectura` — para toda Ficha de módulo.
- `HistorialAuditoria` — para toda pantalla que muestre auditoría de un registro.
- `PageTitleProvider` / `usePageTitle` — infraestructura de navegación, para todo módulo con pantallas de detalle.

---

## 9. Qué necesito de vos para arrancar

Las cuatro preguntas de la sección 4 (facturación condicional, alcance de permisos de auditoría, profundidad de validación de CUIT, Select vs. control segmentado). Con esas definiciones, la migración `0009_validaciones_clientes.sql` y la implementación completa del módulo quedan listas para programarse sin ninguna otra decisión pendiente.
