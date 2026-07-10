import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { formatearMoneda, formatearFecha } from '@/core/lib/format'
import { useVencimientos } from '@/modules/contador/api'
import { ETIQUETAS_TIPO, calcularEstadoVencimiento, type Obligacion } from '@/modules/contador/types'
import { TipoObligacionIcono } from '@/modules/contador/TipoObligacionIcono'
import { SeccionInforme } from './SeccionInforme'
import { TablaSimple, type ColumnaTablaSimple } from '@/core/components/TablaSimple'
import { BotonExportar } from './BotonExportar'
import { FiltroPeriodo } from './FiltroPeriodo'
import { calcularRango, fechaEnRango, type RangoFechas } from './periodo'

const hoyISO = () => {
  const hoy = new Date()
  const offset = hoy.getTimezoneOffset()
  return new Date(hoy.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

const COLUMNAS: ColumnaTablaSimple<Obligacion>[] = [
  {
    clave: 'concepto',
    encabezado: 'Concepto',
    render: (o) => (
      <span className="flex items-center gap-2">
        <TipoObligacionIcono tipo={o.tipo} />
        {o.concepto}
      </span>
    )
  },
  { clave: 'tipo', encabezado: 'Tipo', render: (o) => ETIQUETAS_TIPO[o.tipo] },
  { clave: 'vencimiento', encabezado: 'Vencimiento', render: (o) => formatearFecha(o.fecha_vencimiento) },
  {
    clave: 'monto',
    encabezado: 'Monto',
    alineacion: 'right',
    render: (o) => (o.monto !== null ? formatearMoneda(o.monto) : '—')
  }
]

function filasExportar(lista: Obligacion[]) {
  return lista.map((o) => ({
    concepto: o.concepto,
    tipo: ETIQUETAS_TIPO[o.tipo],
    vencimiento: formatearFecha(o.fecha_vencimiento),
    monto: o.monto ?? ''
  }))
}

/**
 * Informes de Contador — Pendientes y Vencidas son una foto del momento
 * actual (mismo criterio que los saldos de Clientes/Proveedores, no
 * llevan filtro de período). "Próximos vencimientos" sí lo lleva —
 * "qué vence este mes" es una pregunta legítima sobre un rango.
 */
export function InformesContador() {
  const navigate = useNavigate()
  const { data: vencimientos, isLoading } = useVencimientos()
  const [rango, setRango] = React.useState<RangoFechas>(() => calcularRango('mes'))
  const hoy = hoyISO()

  const pendientes = React.useMemo(
    () => (vencimientos ?? []).filter((o) => calcularEstadoVencimiento(o, hoy) === 'pendiente'),
    [vencimientos, hoy]
  )
  const vencidas = React.useMemo(
    () => (vencimientos ?? []).filter((o) => calcularEstadoVencimiento(o, hoy) === 'vencida'),
    [vencimientos, hoy]
  )
  const proximosEnPeriodo = React.useMemo(
    () =>
      (vencimientos ?? []).filter(
        (o) => o.fecha_pago === null && fechaEnRango(o.fecha_vencimiento, rango)
      ),
    [vencimientos, rango]
  )

  return (
    <div className="space-y-6">
      <SeccionInforme modulo="contador">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Vencidas</h2>
          <BotonExportar
            titulo="Contador — Vencidas"
            columnas={[
              { clave: 'concepto', encabezado: 'Concepto' },
              { clave: 'tipo', encabezado: 'Tipo' },
              { clave: 'vencimiento', encabezado: 'Vencimiento' },
              { clave: 'monto', encabezado: 'Monto' }
            ]}
            filas={filasExportar(vencidas)}
            nombreArchivo="contador-vencidas"
          />
        </div>
        <TablaSimple
          items={vencidas}
          getKey={(o) => o.id}
          columnas={COLUMNAS}
          emptyMensaje="No hay vencimientos vencidos."
          cargando={isLoading}
          onRowClick={(o) => navigate(`/contador/${o.id}`)}
        />
      </SeccionInforme>

      <SeccionInforme modulo="contador">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Pendientes</h2>
          <BotonExportar
            titulo="Contador — Pendientes"
            columnas={[
              { clave: 'concepto', encabezado: 'Concepto' },
              { clave: 'tipo', encabezado: 'Tipo' },
              { clave: 'vencimiento', encabezado: 'Vencimiento' },
              { clave: 'monto', encabezado: 'Monto' }
            ]}
            filas={filasExportar(pendientes)}
            nombreArchivo="contador-pendientes"
          />
        </div>
        <TablaSimple
          items={pendientes}
          getKey={(o) => o.id}
          columnas={COLUMNAS}
          emptyMensaje="No hay vencimientos pendientes."
          cargando={isLoading}
          onRowClick={(o) => navigate(`/contador/${o.id}`)}
        />
      </SeccionInforme>

      <SeccionInforme modulo="contador">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Próximos vencimientos</h2>
          <div className="flex items-center gap-2">
            <FiltroPeriodo valor={rango} onChange={setRango} />
            <BotonExportar
              titulo="Contador — Próximos vencimientos"
              subtitulo={`${rango.desde} a ${rango.hasta}`}
              columnas={[
                { clave: 'concepto', encabezado: 'Concepto' },
                { clave: 'tipo', encabezado: 'Tipo' },
                { clave: 'vencimiento', encabezado: 'Vencimiento' },
                { clave: 'monto', encabezado: 'Monto' }
              ]}
              filas={filasExportar(proximosEnPeriodo)}
              nombreArchivo="contador-proximos-vencimientos"
            />
          </div>
        </div>
        <TablaSimple
          items={proximosEnPeriodo}
          getKey={(o) => o.id}
          columnas={COLUMNAS}
          emptyMensaje="No hay vencimientos sin pagar en el período elegido."
          cargando={isLoading}
          onRowClick={(o) => navigate(`/contador/${o.id}`)}
        />
      </SeccionInforme>
    </div>
  )
}
