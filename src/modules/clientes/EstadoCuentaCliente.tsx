import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePageTitle } from '@/core/hooks/usePageTitle'
import { SpinnerPantallaCompleta } from '@/core/components/Spinner'
import { EmptyState } from '@/core/components/EmptyState'
import { Card } from '@/core/components/Card'
import { Button } from '@/core/components/Button'
import { HistorialAuditoria } from '@/core/components/HistorialAuditoria'
import { formatearMoneda } from '@/core/lib/format'
import {
  useMovimientos,
  formatearNumeroMovimiento,
  RegistrarMovimientoDialog,
  DetalleMovimientoDialog,
  type MovimientoConUsuario
} from '@/modules/pagos'
import {
  RegistrarAjusteDialog,
  useSaldoCliente,
  useAjustes,
  LibroCuentaCorriente,
  DetalleAjusteDialog,
  formatearNumeroAjuste,
  type FilaLibroCC,
  type FilaLibroConSaldo,
  type AjusteConUsuario
} from '@/modules/cuentaCorriente'
import { useCliente, useDeudasCliente } from './api'
import { RegistrarDeudaDialog } from './RegistrarDeudaDialog'
import { DetalleDeudaDialog, type DeudaConUsuario } from './ListaDeudas'
import { ETIQUETAS_ORIGEN_DEUDA } from './types'
import { useFacturasCliente } from '@/modules/facturacion/api'
import { formatearNumeroFactura } from '@/modules/facturacion/types'
import { useNumeracion } from '@/modules/configuracion/api'
import { EstadoFacturaBadge } from '@/modules/facturacion/EstadoFacturaBadge'

/**
 * Estado de cuenta del cliente — libro contable unificado (Fecha /
 * Concepto / Debe / Haber / Saldo), orden cronológico ascendente. Ver
 * docs/sistemas/reorganizacion-flujo-operativo.md, sección 6. Reemplaza
 * la versión anterior (3 listas separadas: Deudas, Pagos, Ajustes).
 */
export function EstadoCuentaCliente() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const clienteId = id ?? ''
  const { data: cliente, isLoading, isError } = useCliente(id)
  const { data: saldo } = useSaldoCliente(clienteId)
  const { data: deudas, isLoading: cargandoDeudas } = useDeudasCliente(clienteId)
  const { data: cobros, isLoading: cargandoCobros } = useMovimientos('cobro', clienteId)
  const { data: ajustes, isLoading: cargandoAjustes } = useAjustes('cliente', clienteId)
  const { data: facturas } = useFacturasCliente(clienteId)
  const { data: prefijos } = useNumeracion()

  const [registrandoDeuda, setRegistrandoDeuda] = React.useState(false)
  const [registrandoCobro, setRegistrandoCobro] = React.useState(false)
  const [registrandoAjuste, setRegistrandoAjuste] = React.useState(false)

  const [deudaSeleccionada, setDeudaSeleccionada] = React.useState<DeudaConUsuario | null>(null)
  const [cobroSeleccionado, setCobroSeleccionado] = React.useState<MovimientoConUsuario | null>(null)
  const [ajusteSeleccionado, setAjusteSeleccionado] = React.useState<AjusteConUsuario | null>(null)

  usePageTitle(cliente ? `Estado de cuenta · ${cliente.nombre_apellido}` : 'Estado de cuenta')

  if (isLoading) return <SpinnerPantallaCompleta />
  if (isError || !cliente) {
    return (
      <EmptyState
        mensaje="No se encontró el cliente."
        accion={{ texto: 'Volver al listado', onClick: () => navigate('/clientes') }}
      />
    )
  }

  const cargandoLibro = cargandoDeudas || cargandoCobros || cargandoAjustes

  const filas: FilaLibroCC[] = [
    ...(deudas ?? []).map((d) => ({
      id: `deuda-${d.id}`,
      fecha: d.fecha,
      createdAt: d.created_at,
      concepto: `${d.descripcion} (${ETIQUETAS_ORIGEN_DEUDA[d.origen]})`,
      debe: d.monto,
      haber: null,
      anulado: d.archived_at !== null
    })),
    ...(cobros ?? []).map((m) => ({
      id: `cobro-${m.id}`,
      fecha: m.fecha,
      createdAt: m.created_at,
      concepto: `Cobro (${formatearNumeroMovimiento(m.numero_interno, prefijos?.movimientos)})${m.nota ? ` — ${m.nota}` : ''}`,
      debe: null,
      haber: m.monto,
      anulado: m.archived_at !== null
    })),
    ...(ajustes ?? []).map((a) => ({
      id: `ajuste-${a.id}`,
      fecha: a.fecha,
      createdAt: a.created_at,
      concepto: `Ajuste — ${a.motivo} (${formatearNumeroAjuste(a.numero_interno, prefijos?.ajustes)})`,
      debe: a.monto > 0 ? a.monto : null,
      haber: a.monto < 0 ? Math.abs(a.monto) : null,
      anulado: a.archived_at !== null
    }))
  ]

  function manejarClickFila(fila: FilaLibroConSaldo) {
    if (fila.id.startsWith('deuda-')) {
      const encontrada = deudas?.find((d) => `deuda-${d.id}` === fila.id)
      if (encontrada) setDeudaSeleccionada(encontrada)
    } else if (fila.id.startsWith('cobro-')) {
      const encontrado = cobros?.find((m) => `cobro-${m.id}` === fila.id)
      if (encontrado) setCobroSeleccionado(encontrado)
    } else if (fila.id.startsWith('ajuste-')) {
      const encontrado = ajustes?.find((a) => `ajuste-${a.id}` === fila.id)
      if (encontrado) setAjusteSeleccionado(encontrado)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 space-y-4">
      <Card>
        <p className="text-sm text-muted-foreground">Saldo</p>
        <p className="text-2xl font-semibold text-foreground">
          {saldo !== undefined ? formatearMoneda(saldo) : '—'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {saldo !== undefined && saldo > 0 && 'El cliente tiene una deuda pendiente.'}
          {saldo !== undefined && saldo < 0 && 'El cliente tiene saldo a favor.'}
          {saldo === 0 && 'El cliente no tiene saldo pendiente.'}
        </p>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button accion="neutral" className="flex-1" onClick={() => setRegistrandoDeuda(true)}>
          Agregar deuda
        </Button>
        <Button accion="neutral" className="flex-1" onClick={() => setRegistrandoCobro(true)}>
          Registrar cobro
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <button onClick={() => setRegistrandoAjuste(true)} className="text-[13px] font-medium text-primary">
          + Registrar ajuste
        </button>
        <button onClick={() => navigate(`/facturacion/nueva?cliente=${cliente.id}`)} className="text-[13px] font-medium text-primary">
          + Nueva factura
        </button>
      </div>

      {facturas && facturas.length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Facturas</h2>
          <ul className="divide-y divide-border">
            {facturas.slice(0, 5).map((f) => (
              <li key={f.id}>
                <button
                  onClick={() => navigate(`/facturacion/${f.id}`)}
                  className="flex w-full items-center justify-between gap-3 py-2.5 text-left"
                >
                  <span className="flex items-center gap-2">
                    <span className={`text-sm ${f.archived_at ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {f.numero_externo ?? formatearNumeroFactura(f.numero_interno, prefijos?.facturas)}
                    </span>
                    {!f.archived_at && <EstadoFacturaBadge estado={f.estado} />}
                  </span>
                  <span className="text-sm font-medium tabular-nums text-foreground">{formatearMoneda(f.total)}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Estado de cuenta</h2>
        <LibroCuentaCorriente filas={filas} cargando={cargandoLibro} onFilaClick={manejarClickFila} />
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Actividad</h2>
        <HistorialAuditoria tabla="clientes" registroId={cliente.id} />
      </Card>

      <RegistrarDeudaDialog
        clienteId={cliente.id}
        abierto={registrandoDeuda}
        onOpenChange={setRegistrandoDeuda}
        onElegirAjuste={() => setRegistrandoAjuste(true)}
      />
      <RegistrarMovimientoDialog
        tipo="cobro"
        entidadId={cliente.id}
        abierto={registrandoCobro}
        onOpenChange={setRegistrandoCobro}
      />
      <RegistrarAjusteDialog
        tipo="cliente"
        entidadId={cliente.id}
        abierto={registrandoAjuste}
        onOpenChange={setRegistrandoAjuste}
        etiquetaAumenta="Aumenta lo que debe"
        etiquetaReduce="Reduce lo que debe"
      />

      <DetalleDeudaDialog
        deuda={deudaSeleccionada}
        clienteId={cliente.id}
        onOpenChange={(abierto) => !abierto && setDeudaSeleccionada(null)}
      />
      <DetalleMovimientoDialog
        movimiento={cobroSeleccionado}
        tipo="cobro"
        entidadId={cliente.id}
        onOpenChange={(abierto) => !abierto && setCobroSeleccionado(null)}
      />
      <DetalleAjusteDialog
        ajuste={ajusteSeleccionado}
        tipo="cliente"
        entidadId={cliente.id}
        onOpenChange={(abierto) => !abierto && setAjusteSeleccionado(null)}
      />
    </div>
  )
}
