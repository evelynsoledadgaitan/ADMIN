# 0010 — Transiciones entre pantallas y feedback táctil

## Decisión

**Transiciones:** una única animación CSS (`.animar-entrada-pantalla`, definida en `src/index.css`), aplicada por `AppShell` cada vez que cambia la ruta: 160ms, fade + 6px de desplazamiento vertical. Respeta `prefers-reduced-motion`. No se usó ninguna librería de animación (framer-motion, react-transition-group, etc.).

**Feedback táctil:** todo elemento tocable de ADMIN reduce ligeramente su escala al tocarlo (`active:scale-[0.97]`), ya incorporado en `Button` y en `Card`/`cardClassName`. Para cualquier otro elemento tocable que no sea ninguno de esos dos, existe la clase utilitaria `.tocable` con el mismo comportamiento, para no reinventarlo.

## Por qué

**Transiciones vía CSS y no una librería:** la Web Animations API / View Transitions API del navegador todavía no tiene soporte parejo en todos los navegadores Android, y una librería como framer-motion agrega un peso de bundle considerable para resolver algo que una animación CSS de dos propiedades (`opacity`, `transform`) resuelve igual de bien. Es la aplicación directa del principio del proyecto: "si existen dos maneras de resolver un problema, se elige la más simple". 160ms es deliberadamente corto — el pedido fue "suaves y rápidas", no un efecto de presentación tipo splash.

**Feedback táctil vía `active:` de Tailwind:** es CSS puro, sin JavaScript ni librería de gestos — responde en el mismo frame en que el dedo toca la pantalla, que es lo que hace que una interfaz se sienta "rápida" en un celular. Confirma al usuario que su toque fue reconocido incluso antes de que la acción (navegar, guardar) termine de procesarse.

**Nota de rendimiento (relacionada, mismo Sprint):** las 9 pantallas de módulo ahora se cargan con `React.lazy()` (ver `src/app/routes/index.tsx`) — el código de Cheques, Informes, etc. no se descarga hasta que el usuario realmente entra a ese módulo. El bundle principal (React, React Router, React Query, Radix, supabase-js) todavía pesa cerca de 530 KB sin comprimir / 155 KB comprimido — razonable para esta etapa, pero si el proyecto sigue creciendo en dependencias vale la pena revisar `manualChunks` de Vite para separar el código de librerías (vendor) del código propio.

## Alternativas descartadas
- **Librería de animación (framer-motion)**: descartada por peso de bundle innecesario para un efecto que CSS resuelve solo, en un proyecto que además prioriza velocidad de carga en celular.
- **View Transitions API nativa del navegador**: descartada por ahora por soporte disparejo en navegadores Android más viejos — se puede reconsiderar más adelante si deja de ser un problema, sin cambiar la experiencia visual (la clase `.animar-entrada-pantalla` seguiría siendo el punto de entrada).
- **Sin transición alguna** (cambio de pantalla instantáneo): descartado porque el cliente pidió explícitamente transiciones suaves — un cambio abrupto se siente "roto" en una app que se supone se comporta como nativa.
