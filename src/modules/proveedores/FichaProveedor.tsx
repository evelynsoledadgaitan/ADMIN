import { useNavigate, useParams } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import { usePageTitle } from '@/core/hooks/usePageTitle'
import { useToast } from '@/core/hooks/useToast'
import { useConfirm } from '@/core/hooks/useConfirm'
import { useArchivable } from '@/core/hooks/useArchivable'
import { useRestaurar } from '@/core/hooks/useRestaurar'
import { SpinnerPantallaCompleta } from '@/core/components/Spinner'
import { EmptyState } from '@/core/components/EmptyState'
import { Card } from '@/core/components/Card'
import { BadgeArchivado } from '@/core/components/BadgeArchivado'
import { Button } from '@/core/components/Button'
import { CampoSoloLectura } from '@/core/components/CampoSoloLectura'
import { formatearMoneda, formatearFecha } from '@/core/lib/format'
import { useCondicionesIva } from '@/modules/clientes/api'
import { useProveedor, useSaldoProveedor, useUltimaCompra, useUltimoPago } from './api'

/**
 * Ficha del proveedor — mismo patrón que Clientes. Etapa 3: agrega el
 * estado archivado (insignia + Restaurar en vez de Modificar/Archivar).
 */
export function FichaProveedor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const confirmar = useConfirm()
  const { data: proveedor, isLoading, isError } = useProveedor(id)
  const { data: condicionesIva } = useCondicionesIva()
  const { data: saldo } = useSaldoProveedor(id ?? '')
  const { data: ultimaCompra } = useUltimaCompra(id ?? '')
  const { data: ultimoPago } = useUltimoPago(id ?? '')
  const archivar = useArchivable('proveedores')
  const restaurar = useRestaurar('proveedores')

  usePageTitle(proveedor?.nombre ?? null)

  if (isLoading) return <SpinnerPantallaCompleta />
  if (isError || !proveedor) {
    return (
      <EmptyState
        mensaje="No se encontró el proveedor."
        accion={{ texto: 'Volver al listado', onClick: () => navigate('/proveedores') }}
      />
    )
  }

  const nombreCondicionIva = condicionesIva?.find((c) => c.id === proveedor.condicion_iva_id)?.nombre
  const proveedorId = proveedor.id
  const archivado = proveedor.archived_at !== null

  async function handleArchivar() {
    const confirmado = await confirmar({
      titulo: 'Archivar proveedor',
      mensaje: 'El proveedor dejará de aparecer en el listado principal. Su historial se conservará y podrá restaurarse más adelante.',
      textoConfirmar: 'Archivar',
      accionConfirmar: 'archivar'
    })
    if (!confirmado) return

    archivar.mutate(proveedorId, {
      onSuccess: () => {
        toast.exito('Proveedor archivado')
        navigate('/proveedores')
      },
      onError: () => toast.error('No se pudo archivar el proveedor')
    })
  }

  function handleRestaurar() {
    restaurar.mutate(proveedorId, {
      onSuccess: () => toast.exito('Proveedor restaurado'),
      onError: () => toast.error('No se pudo restaurar el proveedor')
    })
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 space-y-4">
      {archivado && (
        <BadgeArchivado icono fecha={proveedor.archived_at} />
      )}

      <Card className={'space-y-4' + (archivado ? ' opacity-80' : '')}>
        <div>
          <h1 className="text-lg font-semibold text-foreground">{proveedor.nombre}</h1>
          {proveedor.razon_social && <p className="text-sm text-muted-foreground">{proveedor.razon_social}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <CampoSoloLectura label="CUIT" valor={proveedor.cuit} />
          <CampoSoloLectura label="Condición frente al IVA" valor={nombreCondicionIva} />
        </div>
      </Card>

      {!archivado && (
        <Card className="space-y-3">
          <CampoSoloLectura label="Saldo pendiente" valor={saldo !== undefined ? formatearMoneda(saldo) : undefined} />
          <CampoSoloLectura
            label="Último ingreso"
            valor={ultimaCompra ? `${formatearFecha(ultimaCompra.fecha)} · ${ultimaCompra.descripcion} (${formatearMoneda(ultimaCompra.monto)})` : 'Sin ingresos registrados'}
          />
          <CampoSoloLectura
            label="Último pago"
            valor={ultimoPago ? `${formatearFecha(ultimoPago.fecha)} (${formatearMoneda(ultimoPago.monto)})` : 'Sin pagos registrados'}
          />
        </Card>
      )}

      {!archivado && (
        <Button accion="neutral" className="w-full" onClick={() => navigate(`/proveedores/${proveedor.id}/cuenta`)}>
          Estado de cuenta
        </Button>
      )}

      {archivado ? (
        <Button accion="archivar" icono={RotateCcw} className="w-full" onClick={handleRestaurar} disabled={restaurar.isPending}>
          {restaurar.isPending ? 'Restaurando...' : 'Restaurar proveedor'}
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button accion="modificar" className="flex-1" onClick={() => navigate(`/proveedores/${proveedor.id}/editar`)}>
            Modificar
          </Button>
          <Button accion="archivar" className="flex-1" onClick={handleArchivar} disabled={archivar.isPending}>
            Archivar
          </Button>
        </div>
      )}
    </div>
  )
}
