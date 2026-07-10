import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { formatearMoneda, formatearFecha } from '@/core/lib/format'
import { useMediosPago } from '@/modules/pagos/api'
import { useTodosLosPagosEmpleados } from './api'
import { SeccionInforme } from './SeccionInforme'
import { TablaSimple, type ColumnaTablaSimple } from '@/core/components/TablaSimple'
import { BotonExportar } from './BotonExportar'
import { FiltroPeriodo } from './FiltroPeriodo'
import { calcularRango, fechaEnRango, type RangoFechas } from './periodo'
import type { PagoEmpleado } from '@/modules/empleados/types'

type PagoConEmpleado = PagoEmpleado & { empleado: { nombre_apellido: string } | null }

/**
 * Informes de Empleados — Pagos y Adelantos, con filtro de período. El
 * informe "Aguinaldos registrados" se sacó de esta primera versión
 * (decisión aprobada, punto 1) — no hay ningún dato estructurado que lo
 * identifique, solo texto libre en Concepto, y no querías depender de
 * eso.
 */
export function InformesEmpleados() {
  const navigate = useNavigate()
  const { data: pagos, isLoading } = useTodosLosPagosEmpleados()
  const { data: mediosPago } = useMediosPago()
  const [rango, setRango] = React.useState<RangoFechas>(() => calcularRango('mes'))

  const pagosFiltrados = React.useMemo(
    () => (pagos ?? []).filter((p) => p.tipo === 'pago' && fechaEnRango(p.fecha, rango)),
    [pagos, rango]
  )
  const adelantosFiltrados = React.useMemo(
    () => (pagos ?? []).filter((p) => p.tipo === 'adelanto' && fechaEnRango(p.fecha, rango)),
    [pagos, rango]
  )

  const columnas: ColumnaTablaSimple<PagoConEmpleado>[] = [
    { clave: 'fecha', encabezado: 'Fecha', render: (p) => formatearFecha(p.fecha) },
    { clave: 'empleado', encabezado: 'Empleado', render: (p) => p.empleado?.nombre_apellido ?? '—' },
    { clave: 'concepto', encabezado: 'Concepto', render: (p) => p.concepto },
    {
      clave: 'medio',
      encabezado: 'Medio de pago',
      render: (p) => mediosPago?.find((m) => m.id === p.medio_pago_id)?.nombre ?? '—'
    },
    { clave: 'monto', encabezado: 'Monto', alineacion: 'right', render: (p) => formatearMoneda(p.monto) }
  ]

  function filasExportar(lista: PagoConEmpleado[]) {
    return lista.map((p) => ({
      fecha: formatearFecha(p.fecha),
      empleado: p.empleado?.nombre_apellido ?? '—',
      concepto: p.concepto,
      medio: mediosPago?.find((m) => m.id === p.medio_pago_id)?.nombre ?? '—',
      monto: p.monto
    }))
  }

  return (
    <div className="space-y-6">
      <SeccionInforme modulo="empleados">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Pagos realizados</h2>
          <div className="flex items-center gap-2">
            <FiltroPeriodo valor={rango} onChange={setRango} />
            <BotonExportar
              titulo="Empleados — Pagos realizados"
              subtitulo={`${rango.desde} a ${rango.hasta}`}
              columnas={[
                { clave: 'fecha', encabezado: 'Fecha' },
                { clave: 'empleado', encabezado: 'Empleado' },
                { clave: 'concepto', encabezado: 'Concepto' },
                { clave: 'medio', encabezado: 'Medio de pago' },
                { clave: 'monto', encabezado: 'Monto' }
              ]}
              filas={filasExportar(pagosFiltrados)}
              nombreArchivo="empleados-pagos-realizados"
            />
          </div>
        </div>
        <TablaSimple
          items={pagosFiltrados}
          getKey={(p) => p.id}
          columnas={columnas}
          emptyMensaje="No hay pagos en el período elegido."
          cargando={isLoading}
          onRowClick={(p) => p.empleado_id && navigate(`/empleados/${p.empleado_id}`)}
        />
      </SeccionInforme>

      <SeccionInforme modulo="empleados">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Adelantos</h2>
          <BotonExportar
            titulo="Empleados — Adelantos"
            subtitulo={`${rango.desde} a ${rango.hasta}`}
            columnas={[
              { clave: 'fecha', encabezado: 'Fecha' },
              { clave: 'empleado', encabezado: 'Empleado' },
              { clave: 'concepto', encabezado: 'Concepto' },
              { clave: 'medio', encabezado: 'Medio de pago' },
              { clave: 'monto', encabezado: 'Monto' }
            ]}
            filas={filasExportar(adelantosFiltrados)}
            nombreArchivo="empleados-adelantos"
          />
        </div>
        <TablaSimple
          items={adelantosFiltrados}
          getKey={(p) => p.id}
          columnas={columnas}
          emptyMensaje="No hay adelantos en el período elegido."
          cargando={isLoading}
          onRowClick={(p) => p.empleado_id && navigate(`/empleados/${p.empleado_id}`)}
        />
      </SeccionInforme>
    </div>
  )
}
