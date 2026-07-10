import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { TablaSimple, type ColumnaTablaSimple } from '@/core/components/TablaSimple'
import { formatearMoneda, formatearFecha } from '@/core/lib/format'
import { useDeudasPendientesFacturarSiempreFactura } from './api'
import type { Deuda } from '@/modules/clientes/types'

type DeudaConCliente = Deuda & { cliente: { id: string; nombre_apellido: string } }

/**
 * Pendientes de facturar — deudas sin factura de clientes "Siempre
 * factura" (ver docs/sistemas/siempre-factura-diseno.md). Vive en
 * Facturación, no en Informes, a propósito: es trabajo del día, no
 * análisis — decisión explícita del cliente. Reutiliza `TablaSimple`
 * (promovida desde Informes) en vez de armar una tabla nueva.
 */
export function PendientesFacturar() {
  const navigate = useNavigate()
  const { data: deudas, isLoading } = useDeudasPendientesFacturarSiempreFactura()

  const columnas: ColumnaTablaSimple<DeudaConCliente>[] = [
    { clave: 'cliente', encabezado: 'Cliente', render: (d) => d.cliente.nombre_apellido },
    { clave: 'fecha', encabezado: 'Fecha', render: (d) => formatearFecha(d.fecha) },
    { clave: 'descripcion', encabezado: 'Concepto', render: (d) => d.descripcion },
    { clave: 'monto', encabezado: 'Monto', alineacion: 'right', render: (d) => formatearMoneda(d.monto) }
  ]

  function irAFacturar(deuda: DeudaConCliente) {
    navigate(`/facturacion/nueva?cliente=${deuda.cliente.id}&deuda=${deuda.id}`)
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 lg:p-6">
      <div className="mb-5 flex items-center gap-2">
        <button onClick={() => navigate('/')} aria-label="Volver a Inicio" className="rounded-full p-1 active:bg-muted">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Pendientes de facturar</h1>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Deudas de clientes configurados como "Siempre factura" que todavía no tienen ninguna factura — tocá una fila para emitirla.
      </p>

      <TablaSimple
        items={(deudas as DeudaConCliente[]) ?? []}
        getKey={(d) => d.id}
        columnas={columnas}
        emptyMensaje="No hay nada pendiente de facturar."
        cargando={isLoading}
        onRowClick={irAFacturar}
      />
    </div>
  )
}
