# Configuración: diseño funcional y técnico

Documento de diseño. No incluye implementación. Estructurado en las 4 preguntas fijas de siempre.

Marco: el lugar donde se administran los parámetros generales de ADMIN — nunca funciones operativas del negocio. Si algo ya vive naturalmente en otro módulo, se queda ahí.

---

## 1. ¿Qué reutiliza de lo que ya existe?

Más de lo que parece a primera vista — encontré dos piezas hechas desde la Fase 0 y nunca usadas:

- **La tabla `configuracion`** (clave/valor, `jsonb`) existe desde el primer Sprint del proyecto y **nunca se usó para nada**. Es el lugar perfecto para "Datos del negocio" y "Numeración" — no hace falta ninguna tabla nueva para eso.
- **Las tablas `usuarios` y `permisos`** están completas y en uso (son las que ya deciden quién puede hacer qué en toda la app) — lo único que falta es la pantalla para administrarlas. Hoy, dar de alta un permiso es una consulta SQL manual en Supabase.
- **El patrón de administración de catálogos** que ya construimos en Productos (`ListadoCategorias`/`CategoriaDialog`, con `EstadoFiltroTabs`, `useArchivable`/`useRestaurar`) — se reutiliza tal cual para los catálogos que todavía no tienen pantalla.
- **`DataTable`/`ListView`, `CampoSoloLectura`, `HistorialAuditoria`**: sin ninguna diferencia con el resto del sistema.

---

## 2. ¿Qué tablas nuevas necesita?

**Ninguna.** Todo lo que hace falta ya existe como tabla — lo que falta es la interfaz, y en un caso (los catálogos), completar 3 columnas que `categorias_productos` ya tiene y los demás catálogos no.

### Catálogos que hoy no se pueden administrar desde ninguna pantalla
`condiciones_iva`, `medios_pago`, `modalidades_pago_empleado` — hoy son tablas mínimas (`id`, `nombre`) sin `archived_at`. Para poder crear/editar/archivar como ya se puede con Categorías de Productos, necesitan la misma migración chica que se les hizo a esas: agregar `archived_at`/`created_at`/`updated_at` + el trigger de auditoría. Nada más.

---

## 3. ¿Qué pantallas y secciones incorpora?

Landing (`/configuracion`) con las secciones que sí encontré una razón real para construir — y las que evalué y decidí **no** construir, con el motivo.

### Se construyen

- **Datos del negocio**: nombre, CUIT, dirección, teléfono — un formulario simple, guardado en `configuracion`. No es decorativo: hoy el PDF de una factura dice literalmente "ADMIN" en el encabezado (hardcodeado) — esto lo reemplaza por el nombre real de tu negocio. Primer impacto concreto y visible.
- **Usuarios y permisos**: listado de usuarios existentes, activar/desactivar, y una matriz de permisos por módulo (Ver/Crear/Modificar/Archivar) — misma forma que ya tiene la tabla `permisos`, ahora editable con checkboxes en vez de SQL a mano.
- **Categorías generales**: administración de `condiciones_iva`, `medios_pago`, `modalidades_pago_empleado` — mismo patrón que Categorías de Productos, que **sigue viviendo en Productos** (no la muevo acá, aunque a primera vista parezca que "categorías" pertenece a Configuración — es una categoría de un solo módulo, estas tres son compartidas entre varios).
- **Numeración**: prefijo editable de cada comprobante (hoy "FAC-", "DEU-", "ING-", "MOV-" están fijos en el código) — ver la decisión técnica que necesito que confirmes en la sección 5, porque no es gratis.

### Evalué y decidí no construir (te explico el motivo en cada caso, no es una omisión)

- **Parámetros de Facturación / Clientes / Proveedores / Empleados / Contador** como secciones separadas: al revisar cada módulo, no encontré ningún parámetro genuino que no fuera ya, o un catálogo compartido (ver arriba), o algo que directamente no tiene sentido hacer configurable (las tasas de IVA son una categoría fija de la ley argentina, no un valor de negocio).
- **Copias de seguridad**: ADMIN corre sobre Supabase, que ya hace backups automáticos de la base a nivel de infraestructura. Construir un botón de "backup" adentro de la aplicación sería duplicar algo que la plataforma ya resuelve mejor, y agregaría una función operativa pesada (exportar/restaurar toda la base) que no encaja con "Configuración no contiene funciones operativas".
- **Apariencia/preferencias**: la identidad visual ya está cerrada y aprobada hace varios Sprints. No encontré una necesidad concreta que justifique construir un selector de tema — si en algún momento aparece una razón real, se agrega ahí.

---

## 4. ¿Qué impacto tiene sobre el resto del sistema?

- **Facturación**: el PDF/impresión deja de decir "ADMIN" fijo y pasa a usar el nombre real del negocio.
- **Clientes/Proveedores**: sin cambio de comportamiento — solo cambia dónde se administra el catálogo de Condición de IVA (antes: solo Supabase; ahora: Configuración).
- **Empleados**: mismo caso con Modalidades de pago.
- **Motor de Pagos** (Cobros/Pagos/pagos de empleados): mismo caso con Medios de pago.
- **Ningún módulo cerrado se reabre para tocar su lógica de negocio** — todo lo anterior es "ahora se administra desde acá", no "ahora funciona distinto".
- **Permisos**: `configuracion` y `usuarios` ya existían como módulos de permiso desde la Fase 0 — no hace falta ampliar ningún `CHECK`.

---

## 5. Dos decisiones que necesito que confirmes antes de programar

### 5.1 Numeración — el prefijo es fácil, pero toca módulos ya cerrados

Hoy cada número ("FAC-000123", "DEU-000045"...) lo arma una función chica en cada módulo, con el prefijo escrito directamente en el código. Hacerlo editable significa que esas funciones — que viven en Clientes, Proveedores, Facturación, Pagos y Empleados, **todos módulos que ya diste por cerrados** — necesitan leer el prefijo desde `configuracion` en vez de tenerlo fijo. Es un cambio chico y de bajo riesgo en sí mismo (leer un valor guardado en vez de una constante), pero es la primera vez que Configuración obliga a tocar código de módulos cerrados, y quiero que lo decidas con eso claro:

- **(a)** Lo hago igual — el riesgo es bajo y el beneficio es real.
- **(b)** Dejamos la numeración tal como está (fija) para no tocar nada de lo cerrado, y la sacamos de Configuración por ahora.

### 5.2 Alta de usuarios — límite técnico real, no una decisión de diseño

Crear un usuario nuevo (que pueda iniciar sesión) requiere privilegios que el sistema no le puede dar de forma segura al propio navegador — necesita la clave de administrador de Supabase, que nunca debe viajar al lado del cliente. Por eso, Configuración puede administrar (activar/desactivar, editar permisos) a los usuarios **que ya existen**, pero **no puede dar de alta un usuario nuevo** desde la propia pantalla — eso sigue haciéndose una vez, desde el panel de Supabase, y recién después se le configuran los permisos desde acá. No es una limitación que elegí por diseño — es un límite real de qué es seguro hacer desde el navegador. ¿Está bien así, o preferís que conversemos alguna alternativa (por ejemplo, seguir dejando también la asignación de permisos por SQL, o evaluar más adelante una función de servidor para esto)?
