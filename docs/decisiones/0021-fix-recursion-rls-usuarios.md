# 0021 — Corrección: recursión infinita en RLS de `usuarios`/`permisos`

## El bug
Desde la Fase 0, tres políticas de RLS (`usuarios_admin_write`, `permisos_select_propio`, `permisos_admin_write`, migración `0008`) resolvían "¿es admin este usuario?" con un `SELECT` directo contra `usuarios` **desde dentro de una política que protege esa misma tabla**. Evaluar la política requiere evaluar el `SELECT` interno, que vuelve a disparar la misma política, indefinidamente — PostgreSQL lo detecta y devuelve `infinite recursion detected in policy for relation "usuarios"`.

Ese error nunca se vio durante el desarrollo porque hasta el despliegue de la Beta 0.1, todo `build`/`tsc` corrió contra una URL de Supabase placeholder — nunca se había hecho un login real contra una base real hasta que el cliente lo probó. Se sumó un segundo problema que lo hizo invisible: `AuthProvider.tsx` no revisaba el `error` de esa consulta, así que la falla quedaba completamente en silencio — sin excepción, sin log, sin nada en consola. El síntoma reportado ("toco Ingresar y no pasa nada, sin errores en ningún lado") era la consecuencia exacta de estos dos problemas combinados.

## La corrección
1. **Migración `0022`**: nueva función `public.rol_actual()`, `security definer` — mismo mecanismo que ya usa `tiene_permiso()` en toda la app para evitar exactamente este problema. Al ser `security definer`, su `SELECT` interno no vuelve a disparar la política que la llama. Las tres políticas afectadas se recrearon usando esta función en vez del `SELECT` directo.
2. **`AuthProvider.tsx`**: se agregó el chequeo del `error` de las consultas a `usuarios` y `permisos`, con `console.error` si algo falla. No es una solución al bug en sí (eso lo resuelve la migración), es la garantía de que un problema de este tipo, si vuelve a aparecer por cualquier otra razón, se vea en la consola en vez de manifestarse como "no pasa nada".

## Por qué no se detectó antes
Es una limitación real de cómo se validó el proyecto hasta este punto: `tsc --noEmit` y `npm run build` verifican que el código compile, no que las políticas de RLS sean correctas — eso solo se puede probar contra una base de datos real ejecutando las políticas de verdad. Es exactamente el tipo de problema que la Beta 0.1 está para encontrar.

## Alternativas descartadas
- **Quitar la posibilidad de que un admin gestione usuarios/permisos vía RLS** (resolverlo todo desde el frontend): descartado — dejaría la tabla más sensible del sistema sin protección real a nivel de base de datos, todo el proyecto depende de que RLS sea la última línea de defensa, no el frontend.
- **Usar una claim personalizada en el JWT** (guardar el rol en el token de sesión en vez de consultarlo): es una alternativa válida y más eficiente a largo plazo, pero requiere configurar un Auth Hook en Supabase — una pieza de infraestructura nueva que no se justifica solo para resolver este bug puntual, cuando `rol_actual()` lo resuelve con lo que ya existe.
