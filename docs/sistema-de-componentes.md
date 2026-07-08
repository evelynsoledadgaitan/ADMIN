# Sistema de componentes de ADMIN

Catálogo de referencia de todo lo que vive en `src/core/components/`. Si estás por construir una pantalla de un módulo, empezá acá — casi seguro que la pieza que necesitás ya existe.

Para el *porqué* de estas decisiones, ver `docs/decisiones/0008` a `0011`. Este documento es el manual de uso, no la justificación.

---

## Estructura y layout

### `AppShell`
Layout único de toda la app autenticada (TopBar + contenido + BottomNav). Se usa una sola vez, en el árbol de rutas — ningún módulo lo toca directamente.

### `TopBar`
Barra superior. Se arma sola a partir de la ruta actual (lee `core/theme/modulos.ts`); ninguna pantalla le pasa props.

### `BottomNav`
Navegación fija (Inicio / Menú). Igual que TopBar, no requiere configuración por pantalla.

### `Card` / `cardClassName(interactivo?)`
```tsx
<Card>contenido</Card>
<Card interactivo onClick={...}>tarjeta tocable</Card>
```
Tarjeta estándar: fondo blanco, borde negro sutil, radio consistente. Usar `cardClassName()` (no el componente) cuando el contenedor necesita ser otro elemento por accesibilidad, por ejemplo un `<button>` (ver `pages/menu/Menu.tsx`).

---

## Listados

### `ListView<T>`
```tsx
<ListView
  listKey="clientes"
  items={clientes}
  getKey={(c) => c.id}
  getSearchableText={(c) => c.nombre_apellido}
  renderItem={(c) => <FilaCliente cliente={c} />}
  onAgregar={() => navigate('/clientes/nuevo')}
  placeholderBusqueda="Buscar clientes..."
  emptyState="No hay clientes."
  cargando={isLoading}
/>
```
El componente que arma **todo listado** de la app: buscador (`SearchField`), orden (lo aplica quien pasa `items` ya ordenado), persistencia de búsqueda/scroll (`useListState`), botón flotante `+`, estado vacío (`EmptyState`) y estado de carga (`SkeletonFila` × 3 mientras `cargando` es `true`).

### `SearchField`
Buscador independiente, para usarlo fuera de un `ListView` si hiciera falta.
```tsx
<SearchField value={texto} onChange={setTexto} placeholder="Buscar..." />
```

### `EmptyState`
```tsx
<EmptyState mensaje="No hay clientes." />
<EmptyState mensaje="No hay clientes." accion={{ texto: 'Agregar el primero', onClick: ... }} />
```

### `Spinner` / `SpinnerPantallaCompleta`
`Spinner` para esperas cortas e inline. `SpinnerPantallaCompleta` para cuando toda la pantalla está esperando algo (ej. sesión cargando).

### `Skeleton` / `SkeletonFila`
Placeholders pulsantes para contenido cargando. `ListView` ya usa `SkeletonFila` automáticamente con `cargando`; usar `Skeleton` directo para formas custom.

---

## Formularios

Todo campo de formulario sigue el mismo patrón: `label` + control + `error?` opcional, mismo alto (44px, `h-11`), mismo foco.

### `FormBlock`
```tsx
<FormBlock titulo="Datos de facturación">
  <TextField label="Razón social" ... />
  <Select label="Condición frente al IVA" ... />
</FormBlock>
```
Agrupa campos relacionados, con título opcional. El brief pide formularios "organizados por bloques" — esta es la única forma de lograrlo.

### `TextField`
Input de una línea. Wrapper directo de `<input>`, cualquier prop HTML nativa pasa de largo (`type`, `required`, `maxLength`, etc.).
```tsx
<TextField label="Nombre y apellido" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
<TextField label="Email" type="email" error={errores.email} />
```

### `CampoTextoLargo` (en `FormBlock.tsx`)
Textarea con crecimiento automático, para campos largos (notas, observaciones).
```tsx
<CampoTextoLargo label="Nota" value={texto} onChange={(e) => setTexto(e.target.value)} />
```

### `Select`
```tsx
<Select
  label="Condición frente al IVA"
  value={condicionId}
  onValueChange={setCondicionId}
  opciones={condicionesIva.map((c) => ({ value: c.id, label: c.nombre }))}
/>
```
Para cualquier campo que se elige de una lista cerrada (catálogos, `factura_config`, estado de cheque, modalidad de pago).

Con creación rápida ("quick-add"), para catálogos que el usuario completa sobre la marcha (ej. categorías de producto):
```tsx
<Select
  label="Categoría"
  value={categoriaId}
  onValueChange={setCategoriaId}
  opciones={categorias.map((c) => ({ value: c.id, label: c.nombre }))}
  onCrearOpcion={(texto) => crearCategoria.mutateAsync(texto).then((c) => c.id)}
  textoCrearOpcion="Nueva categoría"
/>
```
Agrega una opción "+ {textoCrearOpcion}" al final de la lista; al elegirla, el selector se reemplaza por un campo de texto para crear la opción sin salir del formulario. `onCrearOpcion` debe devolver el `id` de la opción recién creada.

### `CurrencyField`
```tsx
<CurrencyField label="Precio" value={precio} onValueChange={setPrecio} />
```
Formato `$` es-AR (punto de miles, coma decimal). `value`/`onValueChange` trabajan en `number | null`, no en texto — la conversión de formato la resuelve el componente.

### `DateField`
```tsx
<DateField label="Fecha de vencimiento" value={fecha} onChange={(e) => setFecha(e.target.value)} />
```
Wrapper de `<input type="date">` nativo (abre el selector nativo de Android). `value`/`onChange` en formato ISO `YYYY-MM-DD`.

### `FileField`
```tsx
<FileField label="Foto del cheque" value={archivo} onChange={setArchivo} />
<FileField label="Archivo CSV" value={archivo} onChange={setArchivo} accept=".csv,text/csv" />
```
Selector de archivo con preview. Detecta automáticamente si el archivo elegido es una imagen (preview visual) o no (chip con el nombre del archivo) — no hace falta indicarlo por prop. `accept="image/*"` por defecto.

---

## Confirmaciones y feedback

### `useToast()` (Snackbar)
```tsx
const toast = useToast()
toast.exito('Cliente guardado')
toast.error('No se pudo guardar')
toast.advertencia('El CUIT no se pudo validar')
toast.info('Ya existía un cliente con ese nombre')
```
Para confirmar el resultado de cualquier acción. Nunca usar `alert()` ni armar un mensaje inline propio para esto.

### `useConfirm()` (diálogo de confirmación)
```tsx
const confirmar = useConfirm()

async function handleArchivar() {
  const ok = await confirmar({
    titulo: 'Archivar cliente',
    mensaje: 'El cliente dejará de aparecer en los listados. No se elimina.',
    accionConfirmar: 'archivar'
  })
  if (ok) archivarMutation.mutate(cliente.id)
}
```
Para cualquier acción que convenga confirmar antes de ejecutar (archivar, cancelar con cambios sin guardar). `accionConfirmar` acepta `'guardar' | 'modificar' | 'archivar'` — define el color del botón de confirmar, igual que en `Button`.

---

## Botones

### `Button`
```tsx
<Button accion="guardar">Guardar</Button>
<Button accion="modificar">Modificar</Button>
<Button accion="cancelar">Cancelar</Button>
<Button accion="archivar">Archivar</Button>
<Button accion="neutral">Ver más</Button>
```
Los primeros cuatro son los del brief — colores fijos, no se cambian. `neutral` es para cualquier acción que no sea ninguna de esas cuatro (ej. "Ver más", "Exportar"). Todos incluyen feedback táctil (`active:scale`).

### `FloatingActionButton`
Ya integrado en `ListView` — no se usa suelto salvo un caso fuera de un listado.

---

## Colores semánticos — cómo usarlos

| Clase Tailwind | Cuándo |
|---|---|
| `bg-guardar` / `text-guardar-foreground` | Solo en el botón "Guardar" |
| `bg-modificar` / `text-modificar-foreground` | Solo en el botón "Modificar" |
| `bg-cancelar` / `text-cancelar-foreground` | Solo en el botón "Cancelar" |
| `bg-archivar` / `text-archivar-foreground` | Solo en el botón "Archivar" |
| `bg-exito` / `text-exito` | Snackbar y mensajes de éxito |
| `bg-advertencia` / `text-advertencia` | Snackbar y mensajes de advertencia |
| `bg-error` / `text-error` | Snackbar, mensajes de error, borde de campo inválido |
| `bg-info` / `text-info` | Snackbar y mensajes informativos neutros |

Ningún otro color decorativo. La única excepción son los íconos de módulo en el Menú (`core/theme/modulos.ts`), que usan color con un propósito de reconocimiento visual, no decorativo (ver `docs/decisiones/0006`).

---

### `usePageTitle`
```tsx
usePageTitle('Nuevo cliente')
usePageTitle(cliente?.nombre_apellido ?? null) // se actualiza solo cuando el dato llega
```
Anuncia el título de la pantalla actual a la `TopBar` — para cuando el nombre del módulo no alcanza (ej. "Editar cliente", o el nombre real de un registro en su Ficha). Sin llamarlo, la `TopBar` muestra el nombre del módulo como siempre.

### `CampoSoloLectura`
```tsx
<CampoSoloLectura label="CUIT" valor={cliente.cuit} />
```
Para pantallas de Ficha: mismo layout visual que `TextField` pero de solo lectura. Si `valor` es `null`/`undefined`/vacío, no renderiza nada — una Ficha no debe mostrar campos vacíos como ruido (ver `docs/decisiones/0012`).

### `HistorialAuditoria`
```tsx
<HistorialAuditoria tabla="clientes" registroId={cliente.id} />
```
Historial de auditoría de un registro puntual (creado/modificado/archivado, quién, cuándo), para cualquier tabla con trigger de auditoría. De solo lectura — no es un `ListView` (no tiene buscador ni FAB). Requiere que el usuario tenga permiso de ver la tabla de origen o de Informes (ver migración `0010`).

---

## Referencia de implementación

El módulo **Clientes** (`src/modules/clientes/`) es el primer módulo funcional completo y sirve de referencia para todos los que siguen: `api.ts` (hooks de datos con React Query + Supabase), `validaciones.ts` (validación de formulario espejada en la base), `types.ts` (formas del formulario vs. fila real), `ClienteForm.tsx` (formulario compartido entre Alta y Modificación) y las 5 pantallas. Documento de diseño completo en `docs/sistemas/modulo-clientes-arquitectura.md`.

El módulo **Pagos** (`src/modules/pagos/`) es distinto: es infraestructura reutilizable, sin pantalla ni ruta propia. Expone `RegistrarMovimientoDialog` y `ListaMovimientos`, que Clientes y Proveedores importan directamente. Es el ejemplo a seguir para cualquier otra pieza de lógica que varios módulos necesiten compartir sin duplicar. Documento de diseño completo en `docs/sistemas/motor-de-pagos-arquitectura.md`.

El módulo **Proveedores** (`src/modules/proveedores/`) sigue el mismo patrón que Clientes, pero además incorpora **Compras** (`ListaCompras`, `RegistrarCompraDialog`) y un **saldo calculado** (`useSaldoProveedor`, vía la función SQL `saldo_proveedor()`) — es el primer módulo que combina el Motor de Pagos con lógica propia de "cuenta corriente". Documento de diseño completo en `docs/sistemas/modulo-proveedores-arquitectura.md`.

El módulo **Productos** (`src/modules/productos/`) suma el catálogo, el historial de precios (`HistorialPrecios`) y la importación masiva de listas (`ImportarProductos`, `csvParser.ts`) — la mayor parte de las reglas de negocio (historial automático, "no duplicar si el precio no cambió") ya venían resueltas desde la Fase 0 vía triggers; este módulo es sobre todo interfaz y el mecanismo de importación por lotes. Documento de diseño completo en `docs/sistemas/modulo-productos-arquitectura.md`.

El módulo **Cuenta Corriente** (`src/modules/cuentaCorriente/`) es, como Pagos, infraestructura compartida sin pantalla ni ruta propia — expone `RegistrarAjusteDialog` y `ListaAjustes`, usados tanto por Clientes como por Proveedores. A diferencia de Pagos (100% compartido), acá conviven piezas compartidas (Ajustes) con piezas "gemelas" separadas por módulo (Deuda en Clientes, Compra en Proveedores) — mismo patrón, campos propios donde el negocio realmente lo pide. Documento de diseño completo en `docs/sistemas/cuenta-corriente-arquitectura-compartida.md`.

---

### `DataTable` (escritorio, ≥1024px)
```tsx
<DataTable
  items={clientes}
  getKey={(c) => c.id}
  columnas={[
    { key: 'nombre', encabezado: 'Nombre y apellido', valorOrden: (c) => c.nombre_apellido, render: (c) => c.nombre_apellido },
    { key: 'cuit', encabezado: 'CUIT', alineacion: 'right', render: (c) => c.cuit ?? '—' }
  ]}
  getSearchableText={(c) => c.nombre_apellido}
  acciones={(c) => [{ icono: Pencil, etiqueta: 'Editar', onClick: (c) => navigate(`/clientes/${c.id}/editar`) }]}
  onRowClick={(c) => navigate(`/clientes/${c.id}`)}
  accionPrincipal={<Button accion="guardar" icono={Plus}>Nuevo cliente</Button>}
/>
```
La tabla de escritorio única de ADMIN: búsqueda, orden por columna, paginación con selector de filas por página, tooltips en acciones. Convive con `ListView` (celular) — no lo reemplaza. Ver `docs/sistemas/etapa3-listados-escritorio.md`.

### `EstadoFiltroTabs`
```tsx
<EstadoFiltroTabs valor={estado} onChange={setEstado} cantidadArchivados={archivados?.length} />
```
Selector Activos/Archivados — mismo componente en `ListView` y `DataTable`, para que ver y restaurar archivados no sea exclusivo de un dispositivo.

### `useRestaurar`
```tsx
const restaurar = useRestaurar('clientes')
restaurar.mutate(clienteId)
```
Restaura un registro archivado (`archived_at` → `NULL`). Sin confirmación (a diferencia de `useArchivable`) — es la contracara de una acción reversible.

### `Tooltip`
```tsx
<Tooltip texto="Editar">
  <button onClick={...}><Pencil className="h-4 w-4" /></button>
</Tooltip>
```
Para íconos sin texto visible (acciones por fila de `DataTable`). `TooltipProvider` ya está registrado globalmente en `AppProviders`.

---

## Regla general

Antes de escribir `className="rounded-lg border..."` a mano en un módulo: pará. Ya existe un componente acá que hace eso. Si de verdad no existe, se agrega a `core/components/` — nunca queda como un estilo suelto dentro de un módulo.
