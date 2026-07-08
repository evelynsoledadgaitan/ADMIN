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
  useAjustes,
  LibroCuentaCorriente,
  DetalleAjusteDialog,
  formatearNumeroAjuste,
  type FilaLibroCC,
  type FilaLibroConSaldo,
  type AjusteConUsuario
} from '@/modules/cuentaCorriente'
import { useProveedor, useSaldoProveedor, useCompras } from './api'
import { RegistrarCompraDialog } from './RegistrarCompraDialog'
import { DetalleCompraDialog, type CompraConUsuario } from './ListaCompras'
import { ETIQUETAS_ORIGEN_COMPRA } from './types'
import { useNumeracion } from '@/modules/configuracion/api'

/**
 * Estado de cuenta del proveedor — libro contable unificado, mismo
 * componente que Clientes (LibroCuentaCorriente). Ver
 * docs/sistemas/reorganizacion-flujo-operativo.md, sección 6.
 */
export function EstadoCuentaProveedor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const proveedorId = id ?? ''
  const { data: proveedor, isLoading, isError } = useProveedor(id)
  const { data: saldo } = useSaldoProveedor(proveedorId)
  const { data: ingresos, isLoading: cargandoIngresos } = useCompras(proveedorId)
  const { data: pagos, isLoading: cargandoPagos } = useMovimientos('pago', proveedorId)
  const { data: ajustes, isLoading: cargandoAjustes } = useAjustes('proveedor', proveedorId)
  const { data: prefijos } = useNumeracion()

  const [registrandoIngreso, setRegistrandoIngreso] = React.useState(false)
  const [registrandoPago, setRegistrandoPago] = React.useState(false)
  const [registrandoAjuste, setRegistrandoAjuste] = React.useState(false)

  const [ingresoSeleccionado, setIngresoSeleccionado] = React.useState<CompraConUsuario | null>(null)
  const [pagoSeleccionado, setPagoSeleccionado] = React.useState<MovimientoConUsuario | null>(null)
  const [ajusteSeleccionado, setAjusteSeleccionado] = React.useState<AjusteConUsuario | null>(null)

  usePageTitle(proveedor ? `Estado de cuenta · ${proveedor.nombre}` : 'Estado de cuenta')

  if (isLoading) return <SpinnerPantallaCompleta />
  if (isError || !proveedor) {
    return (
      <EmptyState
        mensaje="No se encontró el proveedor."
        accion={{ texto: 'Volver al listado', onClick: () => navigate('/proveedores') }}
      />
    )
  }

  const cargandoLibro = cargandoIngresos || cargandoPagos || cargandoAjustes

  const filas: FilaLibroCC[] = [
    ...(ingresos ?? []).map((c) => ({
      id: `ingreso-${c.id}`,
      fecha: c.fecha,
      createdAt: c.created_at,
      concepto: `${c.descripcion} (${ETIQUETAS_ORIGEN_COMPRA[c.origen]})`,
      debe: c.monto,
      haber: null,
      anulado: c.archived_at !== null
    })),
    ...(pagos ?? []).map((m) => ({
      id: `pago-${m.id}`,
      fecha: m.fecha,
      createdAt: m.created_at,
      concepto: `Pago (${formatearNumeroMovimiento(m.numero_interno, prefijos?.movimientos)})${m.nota ? ` — ${m.nota}` : ''}`,
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
    if (fila.id.startsWith('ingreso-')) {
      const encontrado = ingresos?.find((c) => `ingreso-${c.id}` === fila.id)
      if (encontrado) setIngresoSeleccionado(encontrado)
    } else if (fila.id.startsWith('pago-')) {
      const encontrado = pagos?.find((m) => `pago-${m.id}` === fila.id)
      if (encontrado) setPagoSeleccionado(encontrado)
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
          {saldo !== undefined && saldo > 0 && 'Le debemos al proveedor.'}
          {saldo !== undefined && saldo < 0 && 'Tenemos saldo a favor.'}
          {saldo === 0 && 'No hay saldo pendiente.'}
        </p>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button accion="neutral" className="flex-1" onClick={() => setRegistrandoIngreso(true)}>
          Agregar ingreso de mercadería
        </Button>
        <Button accion="neutral" className="flex-1" onClick={() => setRegistrandoPago(true)}>
          Registrar pago
        </Button>
      </div>
      <button onClick={() => setRegistrandoAjuste(true)} className="self-start text-[13px] font-medium text-primary">
        + Registrar ajuste
      </button>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Estado de cuenta</h2>
        <LibroCuentaCorriente filas={filas} cargando={cargandoLibro} onFilaClick={manejarClickFila} />
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Actividad</h2>
        <HistorialAuditoria tabla="proveedores" registroId={proveedor.id} />
      </Card>

      <RegistrarCompraDialog
        proveedorId={proveedor.id}
        abierto={registrandoIngreso}
        onOpenChange={setRegistrandoIngreso}
        onElegirAjuste={() => setRegistrandoAjuste(true)}
      />
      <RegistrarMovimientoDialog
        tipo="pago"
        entidadId={proveedor.id}
        abierto={registrandoPago}
        onOpenChange={setRegistrandoPago}
      />
      <RegistrarAjusteDialog
        tipo="proveedor"
        entidadId={proveedor.id}
        abierto={registrandoAjuste}
        onOpenChange={setRegistrandoAjuste}
        etiquetaAumenta="Aumenta lo que le debemos"
        etiquetaReduce="Reduce lo que le debemos"
      />

      <DetalleCompraDialog
        compra={ingresoSeleccionado}
        proveedorId={proveedor.id}
        onOpenChange={(abierto) => !abierto && setIngresoSeleccionado(null)}
      />
      <DetalleMovimientoDialog
        movimiento={pagoSeleccionado}
        tipo="pago"
        entidadId={proveedor.id}
        onOpenChange={(abierto) => !abierto && setPagoSeleccionado(null)}
      />
      <DetalleAjusteDialog
        ajuste={ajusteSeleccionado}
        tipo="proveedor"
        entidadId={proveedor.id}
        onOpenChange={(abierto) => !abierto && setAjusteSeleccionado(null)}
      />
    </div>
  )
}
