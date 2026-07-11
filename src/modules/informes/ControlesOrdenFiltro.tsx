import { Select } from '@/core/components/Select'
import { CurrencyField } from '@/core/components/CurrencyField'
import { ETIQUETAS_ORDEN_SALDO, ETIQUETAS_FILTRO_SALDO, type OrdenSaldo, type FiltroSaldo } from './ordenFiltroSaldo'

const OPCIONES_ORDEN = Object.entries(ETIQUETAS_ORDEN_SALDO).map(([value, label]) => ({ value, label: `Ordenar: ${label}` }))
const OPCIONES_FILTRO = Object.entries(ETIQUETAS_FILTRO_SALDO).map(([value, label]) => ({ value, label }))

export interface ControlesOrdenFiltroProps {
  orden: OrdenSaldo
  onOrdenChange: (orden: OrdenSaldo) => void
  filtro: FiltroSaldo
  onFiltroChange: (filtro: FiltroSaldo) => void
  importeDesde: number | null
  onImporteDesdeChange: (v: number | null) => void
  importeHasta: number | null
  onImporteHastaChange: (v: number | null) => void
}

/** Controles compartidos por los informes de saldo — Clientes y Proveedores usan exactamente los mismos 4 controles (decisión aprobada: misma experiencia en los dos). */
export function ControlesOrdenFiltro({
  orden,
  onOrdenChange,
  filtro,
  onFiltroChange,
  importeDesde,
  onImporteDesdeChange,
  importeHasta,
  onImporteHastaChange
}: ControlesOrdenFiltroProps) {
  return (
    <div className="mb-3 flex flex-wrap items-end gap-2">
      <Select label="" value={filtro} onValueChange={(v) => onFiltroChange(v as FiltroSaldo)} opciones={OPCIONES_FILTRO} className="w-44" />
      <Select label="" value={orden} onValueChange={(v) => onOrdenChange(v as OrdenSaldo)} opciones={OPCIONES_ORDEN} className="w-56" />
      <div className="w-32">
        <CurrencyField label="Desde" value={importeDesde} onValueChange={onImporteDesdeChange} />
      </div>
      <div className="w-32">
        <CurrencyField label="Hasta" value={importeHasta} onValueChange={onImporteHastaChange} />
      </div>
    </div>
  )
}
