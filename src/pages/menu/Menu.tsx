import { useNavigate } from 'react-router-dom'
import { MODULOS } from '@/core/theme/modulos'
import { cardClassName } from '@/core/components/Card'
import { useModuloOrden } from '@/core/hooks/useModuloOrden'

/**
 * Menú principal: acceso a todos los módulos. Grilla de tarjetas grandes
 * y táctiles (celular primero) — nada de listas angostas con filas chicas.
 * El orden de los módulos sale de useModuloOrden (ver ese hook para el
 * porqué): hoy siempre es 'definido', pero la grilla ya está armada para
 * cuando se agregue la opción de ordenar alfabético/frecuentes.
 */
export function Menu() {
  const navigate = useNavigate()
  const modulos = useModuloOrden(MODULOS, 'definido')

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <div className="grid grid-cols-2 gap-3">
        {modulos.map((modulo) => {
          const Icono = modulo.icono
          return (
            <button
              key={modulo.key}
              onClick={() => navigate(modulo.ruta)}
              className={cardClassName(true) + ' flex flex-col items-start gap-3 text-left'}
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-full ${modulo.fondo}`}>
                <Icono className={`h-6 w-6 ${modulo.color}`} />
              </span>
              <span className="text-sm font-semibold text-foreground">{modulo.nombre}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
