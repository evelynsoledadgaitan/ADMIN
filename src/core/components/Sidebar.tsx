import { NavLink } from 'react-router-dom'
import { LogOut, Settings } from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { INICIO, CATEGORIAS_SIDEBAR, moduloPorKey } from '@/core/theme/modulos'
import { cn } from '@/core/lib/utils'

/**
 * Navegación de escritorio (≥768px) — identidad visual definitiva, Etapa 1.
 * Mismos 10 destinos que el celular (Inicio + 9 módulos), agrupados por
 * categoría (ver docs/decisiones y core/theme/modulos.ts) en vez de la
 * lista plana. Configuración vive aparte, junto a la sesión del usuario,
 * no mezclada con los módulos operativos — es sobre la herramienta, no
 * sobre el negocio.
 *
 * Responsive sin JavaScript: oculto en celular (`hidden md:flex`),
 * colapsado a solo íconos entre 768–1023px (las etiquetas de texto usan
 * `lg:inline`/`lg:block`), expandido completo desde 1024px — todo con
 * clases de Tailwind, ningún estado de "abierto/cerrado" que mantener.
 */
export function Sidebar() {
  const { usuario, logout } = useAuth()
  const configuracion = moduloPorKey('configuracion')!

  const inicial = (usuario?.nombre ?? '?').trim().charAt(0).toUpperCase()

  function itemClass({ isActive }: { isActive: boolean }) {
    return cn(
      'group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors duration-150',
      'justify-center lg:justify-start',
      isActive
        ? 'bg-white/[0.09] text-riel-activo font-semibold'
        : 'text-riel-texto font-medium hover:bg-riel-hover hover:text-riel-activo'
    )
  }

  function indicadorActivo(isActive: boolean) {
    return (
      <span
        className={cn(
          'absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-riel-indicador transition-opacity',
          isActive ? 'opacity-100' : 'opacity-0'
        )}
        aria-hidden="true"
      />
    )
  }

  return (
    <nav
      className="hidden md:flex md:w-[72px] lg:w-[216px] shrink-0 flex-col bg-riel px-2 py-4 transition-[width]"
      style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
      aria-label="Navegación principal"
    >
      <div className="flex items-center gap-2 px-1.5 pb-5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          A
        </span>
        <span className="hidden lg:inline text-[15px] font-bold tracking-tight text-riel-activo">ADMIN</span>
      </div>

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
        <div className="pb-3">
          <p className="hidden lg:block px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-riel-texto/70">
            General
          </p>
          <NavLink to={INICIO.ruta} end className={itemClass} title={INICIO.nombre}>
            {({ isActive }) => (
              <>
                {indicadorActivo(isActive)}
                <INICIO.icono className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                <span className="hidden lg:inline truncate">{INICIO.nombre}</span>
              </>
            )}
          </NavLink>
        </div>

        {CATEGORIAS_SIDEBAR.map((categoria, indice) => (
          <div
            key={categoria.nombre}
            className={cn('pb-3', indice > 0 && 'mt-2 border-t border-white/[0.07] pt-3')}
          >
            <p className="hidden lg:block px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-riel-texto/70">
              {categoria.nombre}
            </p>
            <div className="flex flex-col gap-0.5">
              {categoria.modulos.map((key) => {
                const modulo = moduloPorKey(key)
                if (!modulo) return null
                return (
                  <NavLink key={key} to={modulo.ruta} className={itemClass} title={modulo.nombre}>
                    {({ isActive }) => (
                      <>
                        {indicadorActivo(isActive)}
                        <modulo.icono className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                        <span className="hidden lg:inline truncate">{modulo.nombre}</span>
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-1 border-t border-white/[0.09] pt-3">
        <NavLink to={configuracion.ruta} className={itemClass} title={configuracion.nombre}>
          {({ isActive }) => (
            <>
              {indicadorActivo(isActive)}
              <Settings className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              <span className="hidden lg:inline truncate">{configuracion.nombre}</span>
            </>
          )}
        </NavLink>

        <div className="flex items-center gap-2 px-2.5 pt-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-riel-activo">
            {inicial}
          </span>
          <span className="hidden lg:block min-w-0 flex-1 truncate text-xs font-medium text-riel-texto">
            {usuario?.nombre}
          </span>
          <button
            onClick={logout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="hidden lg:flex shrink-0 rounded-md p-1 text-riel-texto transition-colors hover:bg-riel-hover hover:text-riel-activo"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </nav>
  )
}
