import { Outlet, useLocation } from 'react-router-dom'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'

/**
 * Layout único de toda la app autenticada — identidad visual definitiva,
 * Etapa 1. Responsive sin JavaScript: `Sidebar` y `BottomNav` se
 * muestran/ocultan solos según el ancho de pantalla (cada uno decide su
 * propia visibilidad con `md:hidden` / `hidden md:flex`), así que este
 * componente no necesita saber en qué dispositivo está corriendo.
 *
 * Estructura:
 *   - Celular (<768px): columna vertical — TopBar, contenido, BottomNav.
 *   - Escritorio (≥768px): fila horizontal — Sidebar a la izquierda,
 *     columna (TopBar + contenido) a la derecha.
 *
 * Ningún módulo debe armar su propia barra superior, inferior o lateral —
 * todos viven dentro de este shell.
 *
 * Transición entre pantallas (docs/decisiones/0010): al cambiar de ruta,
 * React desmonta/monta el contenido porque la key cambia con el pathname,
 * lo que dispara la animación de entrada definida en index.css.
 */
export function AppShell() {
  const location = useLocation()

  return (
    <div className="flex h-screen bg-background print:block print:h-auto">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex flex-1 min-w-0 flex-col print:block">
        <div className="print:hidden">
          <TopBar />
        </div>
        <main className="flex-1 min-h-0 print:h-auto print:overflow-visible">
          <div key={location.pathname} className="h-full animar-entrada-pantalla print:h-auto">
            <Outlet />
          </div>
        </main>
        <div className="print:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  )
}
