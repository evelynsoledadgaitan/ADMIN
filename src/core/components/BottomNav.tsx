import { NavLink } from 'react-router-dom'
import { Home, LayoutGrid } from 'lucide-react'
import { cn } from '@/core/lib/utils'

/**
 * Navegación de celular (<768px) — identidad visual definitiva, Etapa 1.
 * Dos accesos fijos, siempre alcanzables con el pulgar:
 *   - Inicio: la pantalla de Pendientes.
 *   - Menú: grilla con acceso a los 9 módulos restantes.
 * Deliberadamente NO se pusieron 10 íconos en la barra inferior — no
 * entrarían con un tamaño de toque decente. El Menú resuelve el acceso a
 * todos los módulos sin saturar la barra.
 *
 * Color: mismo riel oscuro (azul petróleo) que el Sidebar de escritorio
 * (ver docs/decisiones) — es el mismo ancla de marca en los dos
 * dispositivos, no una barra blanca aparte.
 *
 * Importante: NO usa `position: fixed`. Es un ítem normal del `flex
 * h-screen flex-col` de AppShell (`shrink-0`, para que nunca se achique).
 * Con `fixed`, este nav queda flotando *encima* del contenido en vez de
 * ocupar su propio espacio, y `main` se extiende por detrás sin saberlo
 * — el síntoma era que el último elemento de cualquier pantalla con
 * scroll (o el pie de un formulario) quedaba tapado. Como ítem normal del
 * flex column, `main` calcula su altura real descontando esta barra, y
 * el arreglo vale para toda la app de una sola vez, no pantalla por
 * pantalla.
 *
 * Oculto desde 768px (`md:hidden`) — a partir de ahí la navegación la
 * resuelve `Sidebar.tsx`.
 */
export function BottomNav() {
  const itemClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium',
      isActive ? 'text-riel-activo' : 'text-riel-texto'
    )

  return (
    <nav
      className="md:hidden shrink-0 z-30 flex bg-riel"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <NavLink to="/" end className={itemClass}>
        {({ isActive }) => (
          <>
            <span className={cn('h-[3px] w-7 rounded-full', isActive ? 'bg-riel-indicador' : 'bg-transparent')} />
            <Home className="h-[22px] w-[22px]" aria-hidden="true" />
            Inicio
          </>
        )}
      </NavLink>
      <NavLink to="/menu" className={itemClass}>
        {({ isActive }) => (
          <>
            <span className={cn('h-[3px] w-7 rounded-full', isActive ? 'bg-riel-indicador' : 'bg-transparent')} />
            <LayoutGrid className="h-[22px] w-[22px]" aria-hidden="true" />
            Menú
          </>
        )}
      </NavLink>
    </nav>
  )
}
