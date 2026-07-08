import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { formatearMoneda, formatearFecha } from '@/core/lib/format'
import { useProveedores, useSaldosProveedores } from '@/modules/proveedores/api'
import { useMediosPago } from '@/modules/pagos/api'
import { useTodosLosMovimientos } from './api'
import { SeccionInforme } from './SeccionInforme'
import { TablaInforme, type ColumnaInforme } from './TablaInforme'
import { BotonExportar } from './BotonExportar'
import { FiltroPeriodo } from './FiltroPeriodo'
import { calcularRango, fechaEnRango, type RangoFechas } from './periodo'
import type { Proveedor } from '@/modules/proveedores/types'
import type { Movimiento } from '@/modules/pagos/types'

interface FilaProveedor {
  proveedor: Proveedor
  saldo: number
}

/** Informes de Proveedores — Deudas pendientes (saldo, sin período) y Pagos realizados (con filtro de período). */
export function InformesProveedores() {
  const navigate = useNavigate()
  const { data: proveedores, isLoading: cargandoProveedores } = useProveedores()
  const { data: saldos, isLoading: cargandoSaldos } = useSaldosProveedores()
  const { data: pagos, isLoading: cargandoPagos } = useTodosLosMovimientos('pago')
  const { data: mediosPago } = useMediosPago()

  const [rango, setRango] = React.useState<RangoFechas>(() => calcularRango('mes'))

  const cargandoDeudas = cargandoProveedores || cargandoSaldos

  const filasDeuda: FilaProveedor[] = React.useMemo(() => {
    if (!proveedores || !saldos) return []
    return proveedores
      .map((p) => ({ proveedor: p, saldo: saldos.get(p.id) ?? 0 }))
      .filter((f) => f.saldo > 0)
      .sort((a, b) => b.saldo - a.saldo)
  }, [proveedores, saldos])

  const pagosFiltrados = React.useMemo(() => {
    if (!pagos) return []
    return pagos.filter((m) => fechaEnRango(m.fecha, rango))
  }, [pagos, rango])

  const columnasDeuda: ColumnaInforme<FilaProveedor>[] = [
    { clave: 'nombre', encabezado: 'Proveedor', render: (f) => f.proveedor.nombre },
    { clave: 'saldo', encabezado: 'Saldo', alineacion: 'right', render: (f) => formatearMoneda(f.saldo) }
  ]

  const columnasPagos: ColumnaInforme<Movimiento & { proveedor: { nombre: string } | null }>[] = [
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
          <h2 className="text-sm font-semibold text-foreground">Deudas pendientes</h2>
          <BotonExportar
            titulo="Proveedores — Deudas pendientes"
            columnas={[{ clave: 'nombre', encabezado: 'Proveedor' }, { clave: 'saldo', encabezado: 'Saldo' }]}
            filas={filasDeuda.map((f) => ({ nombre: f.proveedor.nombre, saldo: f.saldo }))}
            nombreArchivo="proveedores-deudas-pendientes"
          />
        </div>
        <TablaInforme
          items={filasDeuda}
          getKey={(f) => f.proveedor.id}
          columnas={columnasDeuda}
          emptyMensaje="No hay deudas pendientes con proveedores."
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
        <TablaInforme
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
