# ADMIN — Etapa 3: listados de escritorio (propuesta, módulo Clientes)

Documento de diseño. No incluye implementación. Alcance exclusivamente de interfaz — cero cambios a lógica de negocio, permisos, Supabase, migraciones o estructura de datos. Al final hay 2 mockups: Clientes en escritorio y Clientes en celular (celular queda igual que hoy — se muestra para confirmar que no hay regresión).

---

## 1. Aclaración necesaria: "Eliminar" no va a existir

Ya te lo dije arriba del documento, lo repito acá porque es parte formal de la propuesta: no hay botón de Eliminar en ningún lado. Cada fila tiene **Editar** y **Archivar** — nunca un borrado real. Es la misma regla que rige toda la aplicación desde el brief original.

## 1.1 Actualización: Ver, Editar, Archivar y Restaurar (aprobado en la ronda de ajuste)

Acciones por fila, versión final:

**Registro activo**: Ver (ojo) · Editar (lápiz) · Archivar (archivo) — 3 íconos.
**Registro archivado**: Ver (ojo) · Restaurar (con etiqueta, no solo ícono — es una acción menos frecuente y conviene que sea inconfundible) — 2 elementos.

**Cómo se llega a ver los archivados**: un selector de dos pestañas arriba del listado, "Activos" / "Archivados (n)" — mismo componente en celular y en escritorio, para que la capacidad de restaurar no quede exclusiva de un dispositivo.

**Confirmaciones**:
- Archivar → diálogo de confirmación explícito (ya existe, sin cambios): "El cliente dejará de aparecer en el listado principal. Su historial se conservará y podrá restaurarse más adelante." — pediste "confirmación clara antes de ejecutarse" y ya la tenía desde el Sprint 2.
- Restaurar → **sin diálogo de confirmación**, un solo toque + aviso de éxito (`toast.exito`). Es la contracara de una acción reversible (archivar), así que agregar fricción ahí no aporta seguridad, solo demora. Si preferís que sí tenga confirmación, decímelo y lo agrego — es un cambio de una línea.

**Lo nuevo a nivel de datos** (la única excepción a "sin cambios de lógica de negocio" de esta etapa, ya aclarada arriba): una consulta más por módulo (traer los registros con `archived_at` no nulo) y una mutación nueva (`useRestaurar`, hermana de `useArchivable` ya existente) que pone `archived_at` de vuelta en `NULL`. Sin migraciones, sin cambios de RLS ni de permisos — la política ya existente para "archivar" alcanza para autorizar también el camino inverso.

---

## 2. Arquitectura: un componente nuevo, compartido por los 7 módulos

Hoy `ListView` resuelve todo (buscador, orden, FAB, estado vacío/carga) con una sola implementación para celular y escritorio. Lo que se pide ahora — filtros, orden por columna, paginación, acciones por fila — es sustancialmente más que un ajuste de estilo, así que propongo un componente nuevo y paralelo:

- **`DataTable`** (`core/components/DataTable.tsx`) — la tabla de escritorio. Recibe columnas, filtros y acciones como configuración (props), no tiene nada de Clientes escrito adentro. Se reutiliza en los 7 módulos de esta etapa sin duplicar código.
- **`ListView`** — sigue existiendo tal cual, sin cambios, para celular.
- Cada pantalla de Listado (ej. `ListadoClientes.tsx`) va a renderizar uno u otro según el ancho de pantalla — mismo criterio de breakpoint que el Sidebar (`lg:`, 1024px): abajo de eso, `ListView`; desde ahí, `DataTable`.

Esto es justamente lo que pediste en el punto 4: no una interfaz única estirada, sino dos experiencias con la misma identidad visual, cada una pensada para su dispositivo.

---

## 3. Barra superior del módulo

Reemplaza el `TopBar` genérico actual en las pantallas de listado (solo ahí — Ficha, Alta, Modificación siguen con el `TopBar` de siempre):

```
Clientes
48 clientes

[ Buscar clientes...          ] [ Facturación: Todos ▾ ]      [+ Nuevo cliente]
```

- Título grande (misma escala Display que ya se usa en Inicio) + contador chico debajo, en gris.
- Buscador y filtros a la izquierda, alineados.
- Botón principal a la derecha, con el mismo tratamiento de protagonismo que ya aprobaste en la Etapa 2 (relleno sólido, sombra, ícono).
- En celular, esta barra no existe — se mantiene el patrón actual (`TopBar` + buscador dentro de `ListView` + FAB).

### Filtros — solo con datos que ya existen
Nada de esto agrega columnas nuevas a la base. Para Clientes, el único filtro con sentido hoy es **Facturación** (Todos / Siempre factura / Nunca factura / Pregunta cada vez) — usa el campo `factura_config` que ya existe. Cuando le toque el turno a cada módulo siguiente, su filtro sale de sus propios campos ya existentes (ej. Productos → categoría; Proveedores → condición frente al IVA) — nunca de un dato inventado para la ocasión.

---

## 4. La tabla

| Nombre y apellido ▾ | Razón social | Facturación | CUIT | |
|---|---|---|---|---|
| Fernández, José | — | Pregunta cada vez | — | ✏️ 📦 |
| Gómez, Ana | Distribuidora Gómez SRL | Siempre factura | 30712345678 | ✏️ 📦 |

- **Orden por columna**: tocar un encabezado ordena por esa columna (flecha indicando dirección). Se ordena sobre los datos ya cargados — no dispara una consulta nueva a Supabase, es una decisión de presentación, no de datos.
- **Números y CUIT**: alineados a la derecha, tabular nums (ya establecido desde la Fase 0).
- **Fila con hover** (ya lo tiene desde la Etapa 2) — clic en cualquier parte de la fila que no sea la columna de acciones navega a la Ficha, igual que hoy.
- **Acciones por fila**: dos íconos alineados a la derecha — lápiz (Editar, navega directo a Modificación) y archivo (Archivar, dispara el mismo diálogo de confirmación que ya existe). Ninguno de los dos es una capacidad nueva, son atajos más directos para mouse.

---

## 5. Paginación

Al pie de la tabla:

```
Mostrando 1–10 de 48                    [<]  1  2  3  4  5  [>]
```

Pagina sobre los datos ya traídos por la consulta existente (`useClientes()`, sin cambios) — es un slice en el cliente, no una consulta paginada a Supabase. Con los volúmenes de este proyecto (un negocio, no miles de filas simultáneas) alcanza y sobra; si algún día hiciera falta paginación real del lado del servidor, se resuelve después sin romper esta interfaz.

En celular no hay paginación — `ListView` sigue con scroll infinito natural, que es el patrón correcto para pantallas angostas.

---

## 6. Formularios

Sin cambios funcionales — ya quedaron con buena identidad en la Etapa 2 (labels editoriales, bloques con sombra, botones jerarquizados). Lo único que se ajusta en esta etapa es aprovechar mejor el ancho en escritorio: dentro de un mismo bloque, campos cortos relacionados (ej. CUIT + Condición frente al IVA) pueden ir en 2 columnas en vez de 1 — ya estaba previsto en el documento de identidad visual original, sección 11, y no se había aplicado todavía.

---

## 7. Celular — sin cambios

Todo lo que ya funciona (buscador fijo, FAB, tarjeta por fila, scroll) se mantiene exactamente igual. El mockup de abajo lo confirma.
