import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { formatearMoneda } from '@/core/lib/format'
import { useClientes } from '@/modules/clientes/api'
import { useSaldosClientesConActividad } from '@/modules/cuentaCorriente'
import { SeccionInforme } from './SeccionInforme'
import { TablaSimple, type ColumnaTablaSimple } from '@/core/components/TablaSimple'
import { BotonExportar } from './BotonExportar'
import { ControlesOrdenFiltro } from './ControlesOrdenFiltro'
import { ResumenSaldo } from './ResumenSaldo'
import { filtrarPorSaldo, ordenarPorCriterio, type OrdenSaldo, type FiltroSaldo } from './ordenFiltroSaldo'
import type { Cliente } from '@/modules/clientes/types'

interface FilaCliente {
  cliente: Cliente
  nombre: string
  saldo: number
  ultimaActividad: string | null
}

/**
 * Informes de Clientes — una sola sección (antes eran 3: Saldos
 * pendientes/Saldo a favor/Mayor deuda, que en la práctica mostraban el
 * mismo dato con distinto filtro fijo) con Filtro + Orden + rango de
 * importe, tal como se pidió — ver docs/sistemas/informes-mejoras-diseno.md.
 * Sigue sin filtro de período (decisión ya aprobada: el saldo es la
 * situación de hoy, no algo que varíe por rango de fechas).
 */
export function InformesClientes() {
  const navigate = useNavigate()
  const { data: clientes, isLoading: cargandoClientes } = useClientes()
  const { data: saldos, isLoading: cargandoSaldos } = useSaldosClientesConActividad()

  const [orden, setOrden] = React.useState<OrdenSaldo>('mayor_deuda')
  const [filtro, setFiltro] = React.useState<FiltroSaldo>('con_deuda')
  const [importeDesde, setImporteDesde] = React.useState<number | null>(null)
  const [importeHasta, setImporteHasta] = React.useState<number | null>(null)

  const cargando = cargandoClientes || cargandoSaldos

  const filas: FilaCliente[] = React.useMemo(() => {
    if (!clientes || !saldos) return []
    return clientes.map((c) => {
      const info = saldos.get(c.id)
      return { cliente: c, nombre: c.nombre_apellido, saldo: info?.saldo ?? 0, ultimaActividad: info?.ultimaActividad ?? null }
    })
  }, [clientes, saldos])

  const filasFiltradas = React.useMemo(
    () => ordenarPorCriterio(filtrarPorSaldo(filas, filtro, importeDesde, importeHasta), orden),
    [filas, filtro, importeDesde, importeHasta, orden]
  )

  const columnas: ColumnaTablaSimple<FilaCliente>[] = [
    { clave: 'nombre', encabezado: 'Cliente', render: (f) => f.cliente.nombre_apellido },
    {
      clave: 'saldo',
      encabezado: 'Saldo',
      alineacion: 'right',
      render: (f) => (
        <span className={f.saldo > 0 ? 'text-error' : f.saldo < 0 ? 'text-exito' : undefined}>{formatearMoneda(Math.abs(f.saldo))}</span>
      )
    }
  ]

  function filasExportar(lista: FilaCliente[]) {
    return lista.map((f) => ({ nombre: f.cliente.nombre_apellido, saldo: Math.abs(f.saldo) }))
  }

  return (
    <div className="space-y-6">
      <SeccionInforme modulo="clientes">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Clientes</h2>
          <BotonExportar
            titulo="Clientes"
            columnas={[{ clave: 'nombre', encabezado: 'Cliente' }, { clave: 'saldo', encabezado: 'Saldo' }]}
            filas={filasExportar(filasFiltradas)}
            nombreArchivo="clientes-saldos"
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
          getKey={(f) => f.cliente.id}
          columnas={columnas}
          emptyMensaje="No hay clientes que cumplan ese filtro."
          cargando={cargando}
          onRowClick={(f) => navigate(`/clientes/${f.cliente.id}/cuenta`)}
        />
      </SeccionInforme>
    </div>
  )
}
