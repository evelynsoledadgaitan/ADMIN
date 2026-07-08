import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { moduloPorRuta } from '@/core/theme/modulos'
import { usePageTitleContext } from '@/core/components/pageTitle/PageTitleProvider'

/**
 * Barra superior única para toda la app. Muestra el título de la pantalla
 * actual y, si no estamos en Inicio o Menú (las dos raíces de la
 * navegación), una flecha para volver.
 *
 * El título sale de dos fuentes, en orden de prioridad:
 *   1. El título anunciado por la pantalla actual (usePageTitle) — para
 *      "Nuevo cliente", "Editar cliente", o el nombre real de un registro.
 *   2. Si nadie anunció nada, el nombre del módulo (core/theme/modulos.ts),
 *      igual que antes de este Sprint.
 */
export function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const modulo = moduloPorRuta(location.pathname)
  const { titulo } = usePageTitleContext()
  const esRaiz = location.pathname === '/' || location.pathname === '/menu'

  // En Inicio, el panel de saludo (PantallaPrincipal) ya cumple la función
  // de encabezado — un título "Inicio" arriba era redundante, y el
  // Sidebar/BottomNav ya indican que ese es el módulo activo.
  if (location.pathname === '/') return null

  return (
    <header
      className="sticky top-0 z-20 flex h-14 items-center gap-1 border-b border-border bg-surface px-2 md:px-4"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {!esRaiz && (
        <button
          onClick={() => navigate(-1)}
          aria-label="Volver"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-muted"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      <span className="truncate px-1 text-[17px] font-semibold tracking-tight text-foreground md:text-xl">
        {titulo ?? modulo?.nombre ?? 'ADMIN'}
      </span>
    </header>
  )
}
