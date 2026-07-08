import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { formatearMoneda, formatearFecha } from '@/core/lib/format'
import { useFacturas } from '@/modules/facturacion/api'
import { formatearNumeroFactura } from '@/modules/facturacion/types'
import { EstadoFacturaBadge } from '@/modules/facturacion/EstadoFacturaBadge'
import { cardClassName } from '@/core/components/Card'
import { SeccionInforme } from './SeccionInforme'
import { TablaInforme, type ColumnaInforme } from './TablaInforme'
import { BotonExportar } from './BotonExportar'
import { FiltroPeriodo } from './FiltroPeriodo'
import { calcularRango, fechaEnRango, type RangoFechas } from './periodo'
import { useNumeracion } from '@/modules/configuracion/api'
import type { Factura } from '@/modules/facturacion/types'

type FacturaConCliente = Factura & { cliente: { nombre_apellido: string } }

function columnasFacturas(prefijo: string | undefined): ColumnaInforme<FacturaConCliente>[] {
  return [
    { clave: 'numero', encabezado: 'N°', render: (f) => f.numero_externo ?? formatearNumeroFactura(f.numero_interno, prefijo) },
    { clave: 'cliente', encabezado: 'Cliente', render: (f) => f.cliente.nombre_apellido },
    { clave: 'fecha', encabezado: 'Fecha', render: (f) => formatearFecha(f.fecha) },
    { clave: 'total', encabezado: 'Total', alineacion: 'right', render: (f) => formatearMoneda(f.total) }
  ]
}

/** Informes de Facturación — Emitidas y Total facturado llevan filtro de período; Pendientes de emitir es una foto del estado actual. */
export function InformesFacturacion() {
  const navigate = useNavigate()
  const { data: facturas, isLoading } = useFacturas()
  const { data: prefijos } = useNumeracion()
  const columnas = columnasFacturas(prefijos?.facturas)
  const [rango, setRango] = React.useState<RangoFechas>(() => calcularRango('mes'))

  const emitidasEnPeriodo = React.useMemo(
    () => (facturas ?? []).filter((f) => f.estado === 'emitida' && fechaEnRango(f.fecha, rango)),
    [facturas, rango]
  )
  const pendientesDeEmitir = React.useMemo(() => (facturas ?? []).filter((f) => f.estado === 'pendiente_emitir'), [facturas])
  const facturadoEnPeriodo = React.useMemo(() => (facturas ?? []).filter((f) => fechaEnRango(f.fecha, rango)), [facturas, rango])
  const totalPeriodo = facturadoEnPeriodo.reduce((acc, f) => acc + f.total, 0)

  function filasExportar(lista: FacturaConCliente[]) {
    return lista.map((f) => ({
      numero: f.numero_externo ?? formatearNumeroFactura(f.numero_interno, prefijos?.facturas),
      cliente: f.cliente.nombre_apellido,
      fecha: formatearFecha(f.fecha),
      total: f.total
    }))
  }

  return (
    <div className="space-y-6">
      <SeccionInforme modulo="facturacion">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Total facturado</h2>
          <FiltroPeriodo valor={rango} onChange={setRango} />
        </div>
        <div className={cardClassName() + ' p-4'}>
          <p className="text-xs text-muted-foreground">
            {rango.desde} a {rango.hasta} · {facturadoEnPeriodo.length} factura{facturadoEnPeriodo.length === 1 ? '' : 's'}
          </p>
          <p className="text-2xl font-bold tabular-nums text-foreground">{formatearMoneda(totalPeriodo)}</p>
        </div>
      </SeccionInforme>

      <SeccionInforme modulo="facturacion">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Facturas emitidas</h2>
          <BotonExportar
            titulo="Facturación — Emitidas"
            subtitulo={`${rango.desde} a ${rango.hasta}`}
            columnas={[
              { clave: 'numero', encabezado: 'N°' },
              { clave: 'cliente', encabezado: 'Cliente' },
              { clave: 'fecha', encabezado: 'Fecha' },
              { clave: 'total', encabezado: 'Total' }
            ]}
            filas={filasExportar(emitidasEnPeriodo)}
            nombreArchivo="facturas-emitidas"
          />
        </div>
        <TablaInforme
          items={emitidasEnPeriodo}
          getKey={(f) => f.id}
          columnas={columnas}
          emptyMensaje="No hay facturas emitidas en el período elegido."
          cargando={isLoading}
          onRowClick={(f) => navigate(`/facturacion/${f.id}`)}
        />
      </SeccionInforme>

      <SeccionInforme modulo="facturacion">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            Pendientes de emitir <EstadoFacturaBadge estado="pendiente_emitir" />
          </h2>
          <BotonExportar
            titulo="Facturación — Pendientes de emitir"
            columnas={[
              { clave: 'numero', encabezado: 'N°' },
              { clave: 'cliente', encabezado: 'Cliente' },
              { clave: 'fecha', encabezado: 'Fecha' },
              { clave: 'total', encabezado: 'Total' }
            ]}
            filas={filasExportar(pendientesDeEmitir)}
            nombreArchivo="facturas-pendientes-de-emitir"
          />
        </div>
        <TablaInforme
          items={pendientesDeEmitir}
          getKey={(f) => f.id}
          columnas={columnas}
          emptyMensaje="No hay facturas pendientes de emitir."
          cargando={isLoading}
          onRowClick={(f) => navigate(`/facturacion/${f.id}`)}
        />
      </SeccionInforme>
    </div>
  )
}
