import { Users, Banknote, Calculator } from 'lucide-react'
import { cardClassName } from '@/core/components/Card'
import { formatearMoneda } from '@/core/lib/format'
import type { FilaConSaldo } from './ordenFiltroSaldo'

/**
 * Resumen superior — se calcula sobre lo que ya está filtrado en
 * pantalla (si se filtró "Sólo con deuda entre $10.000 y $50.000", el
 * resumen refleja ese subconjunto) — mismo criterio que "la exportación
 * respeta los filtros". Mismo patrón visual que ya usan Contador y el
 * "Total facturado" de Facturación.
 */
export function ResumenSaldo({ filas }: { filas: FilaConSaldo[] }) {
  const conDeuda = filas.filter((f) => f.saldo > 0)
  const totalAdeudado = conDeuda.reduce((acc, f) => acc + f.saldo, 0)
  const promedio = conDeuda.length > 0 ? totalAdeudado / conDeuda.length : 0

  const items = [
    { icono: Users, etiqueta: 'Con deuda', valor: String(conDeuda.length) },
    { icono: Banknote, etiqueta: 'Total adeudado', valor: formatearMoneda(totalAdeudado) },
    { icono: Calculator, etiqueta: 'Promedio de deuda', valor: formatearMoneda(promedio) }
  ]

  return (
    <div className="mb-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.etiqueta} className={cardClassName() + ' flex items-center gap-3 p-3'}>
          <item.icono className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tabular-nums text-foreground">{item.valor}</p>
            <p className="truncate text-xs text-muted-foreground">{item.etiqueta}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
