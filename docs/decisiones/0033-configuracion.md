# 0033 — Configuración

## Decisión

Configuración es el lugar donde se administran los parámetros generales de ADMIN — nunca funciones operativas del negocio. Reutiliza dos piezas construidas desde la Fase 0 y nunca usadas: la tabla `configuracion` (clave/valor) y las tablas `usuarios`/`permisos`, que ya estaban completas pero sin ninguna pantalla.

**Cuatro secciones, ninguna tabla nueva:**

1. **Datos del negocio** — nombre, CUIT, dirección, teléfono, email, ciudad, provincia, condición de IVA, observaciones y logo (ampliado durante la aprobación, no estaba en el diseño original). Se guarda en `configuracion` (clave='datos_negocio'). Primer impacto visible: el encabezado impreso de una factura dejó de decir "ADMIN" fijo y ahora usa el nombre, CUIT, dirección y logo reales del negocio.
2. **Usuarios y permisos** — administra usuarios ya existentes (activar/desactivar, matriz de Ver/Crear/Modificar/Archivar por módulo). **No da de alta usuarios nuevos** — límite técnico real, no una decisión de diseño: crear una cuenta que pueda iniciar sesión exige privilegios que el navegador no puede tener de forma segura. El alta sigue siendo manual, una vez, desde Supabase.
3. **Categorías generales** — administración completa (crear/editar/archivar/restaurar) de los 3 catálogos que hasta ahora no tenían ninguna pantalla: Condición de IVA, Medios de pago, Modalidades de pago de Empleados. Categorías de Productos **sigue viviendo en Productos**, sin moverse — es la categoría de un solo módulo, estas tres son compartidas entre varios.
4. **Numeración** — prefijo editable de cada comprobante (FAC-, DEU-, AJ-, MOV-, ING-). Decisión aprobada 5.1: sí, aunque implicara tocar módulos ya cerrados.

**Lectura de `configuracion` ampliada a cualquier usuario autenticado** (migración `0050`, y el mismo criterio extendido al prefijo `configuracion` del bucket de Storage para el logo, migración `0051`) — Datos del negocio y Numeración aparecen en documentos que genera cualquier usuario, no solo quien administra Configuración. Escribir sigue exigiendo el permiso `configuracion`, sin cambios.

**Numeración — el cambio real en módulos cerrados**: las 5 funciones `formatearNumeroX` (Deudas, Ajustes, Facturas, Movimientos, Ingresos) ganaron un segundo parámetro opcional `prefijo`, con el valor hardcodeado de siempre como default — un cambio de firma no rompe ningún llamado existente. Se conectó el prefijo configurado en los ~15 lugares donde esos números se muestran (listados, fichas, el libro contable de Clientes/Proveedores, Informes) y en el único lugar donde se genera un texto al crear un registro (la Deuda automática de Facturación, que ahora lee el prefijo vigente en ese momento). Un cambio de prefijo **solo afecta a los comprobantes nuevos** — los textos ya guardados en registros inmutables no se reescriben, por diseño.

## Por qué

Es la aplicación del documento de diseño ya aprobado (`docs/sistemas/configuracion-diseno.md`), con las decisiones 5.1 y 5.2 confirmadas y Datos del negocio ampliado antes de programar.

## Alcance de lo implementado
- Migraciones `0049` (columnas archivables en los 3 catálogos), `0050` (SELECT amplio de `configuracion`), `0051` (prefijo `configuracion` en Storage).
- `src/modules/configuracion/`: `Configuracion` (landing con 4 secciones), `DatosNegocioForm`, `UsuariosPermisos` (+ matriz de permisos), `CatalogosGenerales` (componente único parametrizado por tabla), `NumeracionForm`.
- `useArchivable`/`useRestaurar` extendidos para los 3 catálogos.
- 5 funciones `formatearNumeroX` con prefijo configurable, conectado en ~15 puntos de visualización across Clientes, Proveedores, Facturación, Pagos, Cuenta Corriente e Informes.

## Alternativas descartadas
- **Copias de seguridad y Apariencia**: evaluadas y descartadas explícitamente en el documento de diseño — Supabase ya resuelve backups a nivel de infraestructura, y la identidad visual ya está cerrada sin una necesidad concreta de personalización.
- **Secciones de "Parámetros" separadas por módulo** (Facturación, Clientes, Proveedores, Empleados, Contador): no se encontró ningún parámetro genuino en cada una que no fuera ya un catálogo compartido (resuelto en "Categorías generales") o algo que no tiene sentido hacer configurable (las tasas de IVA son una categoría fija de la ley, no un valor de negocio).
