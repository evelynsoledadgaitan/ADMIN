# 0004 — PWA instalable, sin funcionamiento offline

## Decisión
ADMIN se configura como PWA únicamente para lograr: instalación en Android, pantalla completa (`display: standalone`), sensación de app nativa y actualización automática. **No** se implementa ningún tipo de caché de datos ni de sincronización offline. El service worker (vía `vite-plugin-pwa`) precachea solo el shell de la aplicación (JS/CSS/HTML), con `runtimeCaching: []` y `navigateFallback: null` — es decir, cualquier llamada a Supabase va siempre a la red, nunca a una copia local.

## Por qué
Fue una definición explícita del cliente: la PWA requiere conexión a internet siempre, y no hace falta sincronización offline. Construir offline-first (cachear datos, resolver conflictos de escritura sin conexión, sincronizar al reconectar) es una categoría de complejidad completamente distinta — y el cliente priorizó explícitamente evitar complejidad innecesaria.

`registerType: 'autoUpdate'` además responde a "facilidad de actualización": el usuario nunca ve un cartel de "hay una nueva versión, recargá" — se actualiza solo.

## Alternativas descartadas
- **PWA offline-first completa** (cachear catálogos, permitir carga de datos sin conexión y sincronizar después): descartada explícitamente por el cliente. Además introduciría un problema nuevo y serio — qué hacer si dos usuarios editan el mismo registro sin conexión — que no tiene sentido resolver para un requisito que no existe.
- **No hacer PWA en absoluto** (web app común): descartada porque el cliente sí pidió instalabilidad tipo app nativa en Android, que es justamente lo que un manifest + service worker mínimo resuelven sin necesidad de ir a offline-first.
