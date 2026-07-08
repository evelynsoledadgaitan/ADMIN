import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { formatearMoneda } from '@/core/lib/format'
import { useClientes } from '@/modules/clientes/api'
import { useSaldosClientes } from '@/modules/cuentaCorriente'
import { SeccionInforme } from './SeccionInforme'
import { TablaInforme, type ColumnaInforme } from './TablaInforme'
import { BotonExportar } from './BotonExportar'
import type { Cliente } from '@/modules/clientes/types'

interface FilaCliente {
  cliente: Cliente
  saldo: number
}

/**
 * Informes de Clientes — los 3 pedidos, todos sobre el saldo (una foto
 * del momento actual, sin filtro de período — ver
 * docs/sistemas/informes-diseno.md, sección 3 y punto 4 aprobado).
 * "Mayor deuda" muestra la lista completa ordenada, sin recortar a un
 * Top 10 (decisión aprobada, punto 3).
 */
export function InformesClientes() {
  const navigate = useNavigate()
  const { data: clientes, isLoading: cargandoClientes } = useClientes()
  const { data: saldos, isLoading: cargandoSaldos } = useSaldosClientes()

  const cargando = cargandoClientes || cargandoSaldos

  const filas: FilaCliente[] = React.useMemo(() => {
    if (!clientes || !saldos) return []
    return clientes.map((c) => ({ cliente: c, saldo: saldos.get(c.id) ?? 0 }))
  }, [clientes, saldos])

  const conDeuda = filas.filter((f) => f.saldo > 0).sort((a, b) => b.saldo - a.saldo)
  const conSaldoAFavor = filas.filter((f) => f.saldo < 0).sort((a, b) => a.saldo - b.saldo)

  const columnas: ColumnaInforme<FilaCliente>[] = [
    { clave: 'nombre', encabezado: 'Cliente', render: (f) => f.cliente.nombre_apellido },
    { clave: 'saldo', encabezado: 'Saldo', alineacion: 'right', render: (f) => formatearMoneda(Math.abs(f.saldo)) }
  ]

  function filasParaExportar(lista: FilaCliente[]) {
    return lista.map((f) => ({ nombre: f.cliente.nombre_apellido, saldo: Math.abs(f.saldo) }))
  }

  return (
    <div className="space-y-6">
      <SeccionInforme modulo="clientes">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Saldos pendientes</h2>
          <BotonExportar
            titulo="Clientes — Saldos pendientes"
            columnas={[{ clave: 'nombre', encabezado: 'Cliente' }, { clave: 'saldo', encabezado: 'Saldo' }]}
            filas={filasParaExportar(conDeuda)}
            nombreArchivo="clientes-saldos-pendientes"
          />
        </div>
        <TablaInforme
          items={conDeuda}
          getKey={(f) => f.cliente.id}
          columnas={columnas}
          emptyMensaje="Ningún cliente tiene saldo pendiente."
          cargando={cargando}
          onRowClick={(f) => navigate(`/clientes/${f.cliente.id}/cuenta`)}
        />
      </SeccionInforme>

      <SeccionInforme modulo="clientes">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Clientes con saldo a favor</h2>
          <BotonExportar
            titulo="Clientes — Saldo a favor"
            columnas={[{ clave: 'nombre', encabezado: 'Cliente' }, { clave: 'saldo', encabezado: 'Saldo a favor' }]}
            filas={filasParaExportar(conSaldoAFavor)}
            nombreArchivo="clientes-saldo-a-favor"
          />
        </div>
        <TablaInforme
          items={conSaldoAFavor}
          getKey={(f) => f.cliente.id}
          columnas={columnas}
          emptyMensaje="Ningún cliente tiene saldo a favor."
          cargando={cargando}
          onRowClick={(f) => navigate(`/clientes/${f.cliente.id}/cuenta`)}
        />
      </SeccionInforme>

      <SeccionInforme modulo="clientes">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Mayor deuda</h2>
          <BotonExportar
            titulo="Clientes — Mayor deuda"
            columnas={[{ clave: 'nombre', encabezado: 'Cliente' }, { clave: 'saldo', encabezado: 'Saldo' }]}
            filas={filasParaExportar(conDeuda)}
            nombreArchivo="clientes-mayor-deuda"
          />
        </div>
        <TablaInforme
          items={conDeuda}
          getKey={(f) => f.cliente.id}
          columnas={columnas}
          emptyMensaje="Ningún cliente tiene deuda."
          cargando={cargando}
          onRowClick={(f) => navigate(`/clientes/${f.cliente.id}/cuenta`)}
        />
      </SeccionInforme>
    </div>
  )
}
