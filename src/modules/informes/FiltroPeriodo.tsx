import * as React from 'react'
import { Select } from '@/core/components/Select'
import { DateField } from '@/core/components/DateField'
import { ETIQUETAS_PERIODO, calcularRango, type TipoPeriodo, type RangoFechas } from './periodo'

const OPCIONES = Object.entries(ETIQUETAS_PERIODO).map(([value, label]) => ({ value, label }))

export interface FiltroPeriodoProps {
  valor: RangoFechas
  onChange: (rango: RangoFechas) => void
}

/**
 * Filtro compartido — Hoy/Esta semana/Este mes/Este año/Rango
 * personalizado. El componente resuelve el cálculo de fechas
 * internamente (`calcularRango`); quien lo usa solo recibe el
 * `{desde, hasta}` resultante, sin preocuparse por el tipo elegido.
 */
export function FiltroPeriodo({ valor, onChange }: FiltroPeriodoProps) {
  const [tipo, setTipo] = React.useState<TipoPeriodo>('mes')

  function manejarCambioTipo(nuevoTipo: string) {
    const t = nuevoTipo as TipoPeriodo
    setTipo(t)
    if (t !== 'personalizado') onChange(calcularRango(t))
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Select label="" value={tipo} onValueChange={manejarCambioTipo} opciones={OPCIONES} className="w-48" />
      {tipo === 'personalizado' && (
        <>
          <DateField label="Desde" value={valor.desde} onChange={(e) => onChange({ ...valor, desde: e.target.value })} />
          <DateField label="Hasta" value={valor.hasta} onChange={(e) => onChange({ ...valor, hasta: e.target.value })} />
        </>
      )}
    </div>
  )
}
