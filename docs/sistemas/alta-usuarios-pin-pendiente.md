# Alta de usuarios desde ADMIN (email + PIN) — pendiente, pospuesto a pedido explícito

Este documento no es una decisión cerrada — es el diseño conversado hasta el momento en que se decidió posponerlo para el último Sprint del roadmap. Se retoma desde acá cuando llegue el momento.

## Separación de credenciales, confirmada
- **Administradora general**: email + contraseña, sin ningún cambio respecto a lo que ya existe.
- **Usuarios nuevos que ella cree**: email + PIN de 4 dígitos. Riesgo de seguridad explicado (10.000 combinaciones posibles) y aceptado explícitamente por el cliente — no es una recomendación de Claude, es una decisión de negocio informada.

## Por qué hace falta una pieza nueva de infraestructura
Todo lo construido en ADMIN hasta ahora corre en el navegador o directo contra la base de datos. Crear una cuenta que pueda iniciar sesión requiere un privilegio especial de Supabase (la clave de servicio) que nunca debe estar en el navegador. La solución estándar y segura es una Supabase Edge Function — código que corre del lado de Supabase, con ese privilegio guardado ahí como secreto, invocada desde ADMIN con un botón.

## Flujo propuesto
1. Formulario nuevo en Configuración → Usuarios y permisos: Nombre, Email, PIN.
2. ADMIN invoca la Edge Function, que:
   - Confirma que quien la llama tiene rol `admin`.
   - Crea la cuenta en Supabase Auth (email + PIN como password).
   - Inserta la fila correspondiente en `usuarios`.
3. La pantalla de login no cambia en nada — ya acepta cualquier "contraseña", sea un PIN corto o una contraseña larga, sin necesitar saber de antemano cuál es cuál.

## Dos puntos marcados, sin resolver todavía
1. **Mínimo de contraseña de Supabase**: hay que bajarlo de 6 a 4 caracteres en el panel de Supabase (Authentication → Policies) — un cambio manual, no de código. Afecta a toda la cuenta, no solo a los usuarios con PIN (no fuerza a nadie a tener una contraseña corta, pero técnicamente lo permitiría).
2. **Protección contra intentos repetidos**: Supabase ya aplica un límite de intentos por dirección IP, de fábrica. Un bloqueo específico por cuenta (ej. "esta cuenta se bloquea después de 5 intentos fallidos") sería una pieza aparte, más grande, no incluida en este diseño — se evalúa si hace falta cuando se retome.

## Próximo paso, cuando se retome
Confirmar el punto 2 (¿alcanza con la protección por IP que ya trae Supabase, o se construye además un bloqueo por cuenta?) y recién ahí programar.
