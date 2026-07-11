import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { formatearMoneda, formatearFecha } from '@/core/lib/format'
import { useProveedores, useSaldosProveedoresConActividad } from '@/modules/proveedores/api'
import { useMediosPago } from '@/modules/pagos/api'
import { useTodosLosMovimientos } from './api'
import { SeccionInforme } from './SeccionInforme'
import { TablaSimple, type ColumnaTablaSimple } from '@/core/components/TablaSimple'
import { BotonExportar } from './BotonExportar'
import { FiltroPeriodo } from './FiltroPeriodo'
import { ControlesOrdenFiltro } from './ControlesOrdenFiltro'
import { ResumenSaldo } from './ResumenSaldo'
import { filtrarPorSaldo, ordenarPorCriterio, type OrdenSaldo, type FiltroSaldo } from './ordenFiltroSaldo'
import { calcularRango, fechaEnRango, type RangoFechas } from './periodo'
import type { Proveedor } from '@/modules/proveedores/types'
import type { Movimiento } from '@/modules/pagos/types'

interface FilaProveedor {
  proveedor: Proveedor
  nombre: string
  saldo: number
  ultimaActividad: string | null
}

/**
 * Informes de Proveedores — Deudas pendientes (saldo, sin período, con
 * Filtro + Orden + rango de importe, igual que Clientes — decisión
 * aprobada: misma experiencia en los dos) y Pagos realizados (con
 * filtro de período, sin cambios).
 */
export function InformesProveedores() {
  const navigate = useNavigate()
  const { data: proveedores, isLoading: cargandoProveedores } = useProveedores()
  const { data: saldos, isLoading: cargandoSaldos } = useSaldosProveedoresConActividad()
  const { data: pagos, isLoading: cargandoPagos } = useTodosLosMovimientos('pago')
  const { data: mediosPago } = useMediosPago()

  const [rango, setRango] = React.useState<RangoFechas>(() => calcularRango('mes'))
  const [orden, setOrden] = React.useState<OrdenSaldo>('mayor_deuda')
  const [filtro, setFiltro] = React.useState<FiltroSaldo>('con_deuda')
  const [importeDesde, setImporteDesde] = React.useState<number | null>(null)
  const [importeHasta, setImporteHasta] = React.useState<number | null>(null)

  const cargandoDeudas = cargandoProveedores || cargandoSaldos

  const filas: FilaProveedor[] = React.useMemo(() => {
    if (!proveedores || !saldos) return []
    return proveedores.map((p) => {
      const info = saldos.get(p.id)
      return { proveedor: p, nombre: p.nombre, saldo: info?.saldo ?? 0, ultimaActividad: info?.ultimaActividad ?? null }
    })
  }, [proveedores, saldos])

  const filasFiltradas = React.useMemo(
    () => ordenarPorCriterio(filtrarPorSaldo(filas, filtro, importeDesde, importeHasta), orden),
    [filas, filtro, importeDesde, importeHasta, orden]
  )

  const pagosFiltrados = React.useMemo(() => {
    if (!pagos) return []
    return pagos.filter((m) => fechaEnRango(m.fecha, rango))
  }, [pagos, rango])

  const columnasDeuda: ColumnaTablaSimple<FilaProveedor>[] = [
    { clave: 'nombre', encabezado: 'Proveedor', render: (f) => f.proveedor.nombre },
    {
      clave: 'saldo',
      encabezado: 'Saldo',
      alineacion: 'right',
      render: (f) => (
        <span className={f.saldo > 0 ? 'text-error' : f.saldo < 0 ? 'text-exito' : undefined}>{formatearMoneda(Math.abs(f.saldo))}</span>
      )
    }
  ]

  const columnasPagos: ColumnaTablaSimple<Movimiento & { proveedor: { nombre: string } | null }>[] = [
    { clave: 'fecha', encabezado: 'Fecha', render: (m) => formatearFecha(m.fecha) },
    { clave: 'proveedor', encabezado: 'Proveedor', render: (m) => m.proveedor?.nombre ?? '—' },
    {
      clave: 'medio',
      encabezado: 'Medio de pago',
      render: (m) => mediosPago?.find((mp) => mp.id === m.medio_pago_id)?.nombre ?? '—'
    },
    { clave: 'monto', encabezado: 'Monto', alineacion: 'right', render: (m) => formatearMoneda(m.monto) }
  ]

  return (
    <div className="space-y-6">
      <SeccionInforme modulo="proveedores">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Proveedores</h2>
          <BotonExportar
            titulo="Proveedores"
            columnas={[{ clave: 'nombre', encabezado: 'Proveedor' }, { clave: 'saldo', encabezado: 'Saldo' }]}
            filas={filasFiltradas.map((f) => ({ nombre: f.proveedor.nombre, saldo: Math.abs(f.saldo) }))}
            nombreArchivo="proveedores-saldos"
          />
        </div>

        <ResumenSaldo filas={filas} />

        <ControlesOrdenFiltro
          orden={orden}
          onOrdenChange={setOrden}
          filtro={filtro}
          onFiltroChange={setFiltro}
          importeDesde={importeDesde}
          onImporteDesdeChange={setImporteDesde}
          importeHasta={importeHasta}
          onImporteHastaChange={setImporteHasta}
        />

        <TablaSimple
          items={filasFiltradas}
          getKey={(f) => f.proveedor.id}
          columnas={columnasDeuda}
          emptyMensaje="No hay proveedores que cumplan ese filtro."
          cargando={cargandoDeudas}
          onRowClick={(f) => navigate(`/proveedores/${f.proveedor.id}/cuenta`)}
        />
      </SeccionInforme>

      <SeccionInforme modulo="proveedores">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Pagos realizados</h2>
          <div className="flex items-center gap-2">
            <FiltroPeriodo valor={rango} onChange={setRango} />
            <BotonExportar
              titulo="Proveedores — Pagos realizados"
              subtitulo={`${rango.desde} a ${rango.hasta}`}
              columnas={[
                { clave: 'fecha', encabezado: 'Fecha' },
                { clave: 'proveedor', encabezado: 'Proveedor' },
                { clave: 'medio', encabezado: 'Medio de pago' },
                { clave: 'monto', encabezado: 'Monto' }
              ]}
              filas={pagosFiltrados.map((m) => ({
                fecha: formatearFecha(m.fecha),
                proveedor: m.proveedor?.nombre ?? '—',
                medio: mediosPago?.find((mp) => mp.id === m.medio_pago_id)?.nombre ?? '—',
                monto: m.monto
              }))}
              nombreArchivo="proveedores-pagos-realizados"
            />
          </div>
        </div>
        <TablaSimple
          items={pagosFiltrados}
          getKey={(m) => m.id}
          columnas={columnasPagos}
          emptyMensaje="No hay pagos en el período elegido."
          cargando={cargandoPagos}
          onRowClick={(m) => m.proveedor_id && navigate(`/proveedores/${m.proveedor_id}/cuenta`)}
        />
      </SeccionInforme>
    </div>
  )
}
