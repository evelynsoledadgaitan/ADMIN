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
import { formatearMoneda } from '@/core/lib/format'
import { useCategoriasProductos, useProducto } from './api'
import { HistorialPrecios } from './HistorialPrecios'

/**
 * Ficha del producto — el historial de precios se muestra acá mismo, sin
 * pantalla aparte (ver docs/sistemas/modulo-productos-arquitectura.md
 * sección 6.3). Etapa 3: agrega el estado archivado (insignia + Restaurar).
 */
export function FichaProducto() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const confirmar = useConfirm()
  const { data: producto, isLoading, isError } = useProducto(id)
  const { data: categorias } = useCategoriasProductos()
  const archivar = useArchivable('productos')
  const restaurar = useRestaurar('productos')

  usePageTitle(producto?.nombre ?? null)

  if (isLoading) return <SpinnerPantallaCompleta />
  if (isError || !producto) {
    return (
      <EmptyState
        mensaje="No se encontró el producto."
        accion={{ texto: 'Volver al listado', onClick: () => navigate('/productos') }}
      />
    )
  }

  const nombreCategoria = categorias?.find((c) => c.id === producto.categoria_id)?.nombre ?? 'Sin categorizar'
  const productoId = producto.id
  const archivado = producto.archived_at !== null

  async function handleArchivar() {
    const confirmado = await confirmar({
      titulo: 'Archivar producto',
      mensaje: 'El producto dejará de aparecer en el listado principal. Su historial se conservará y podrá restaurarse más adelante.',
      textoConfirmar: 'Archivar',
      accionConfirmar: 'archivar'
    })
    if (!confirmado) return

    archivar.mutate(productoId, {
      onSuccess: () => {
        toast.exito('Producto archivado')
        navigate('/productos')
      },
      onError: () => toast.error('No se pudo archivar el producto')
    })
  }

  function handleRestaurar() {
    restaurar.mutate(productoId, {
      onSuccess: () => toast.exito('Producto restaurado'),
      onError: () => toast.error('No se pudo restaurar el producto')
    })
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 space-y-4">
      {archivado && (
        <BadgeArchivado icono fecha={producto.archived_at} />
      )}

      <Card className={'space-y-4' + (archivado ? ' opacity-80' : '')}>
        <h1 className="text-lg font-semibold text-foreground">{producto.nombre}</h1>
        <div className="grid grid-cols-2 gap-4">
          <CampoSoloLectura label="Código de barras" valor={producto.codigo_barras} />
          <CampoSoloLectura label="Categoría" valor={nombreCategoria} />
          <CampoSoloLectura label="Precio actual" valor={formatearMoneda(producto.precio_actual)} />
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Historial de precios</h2>
        <HistorialPrecios productoId={producto.id} />
      </Card>

      {archivado ? (
        <Button accion="archivar" icono={RotateCcw} className="w-full" onClick={handleRestaurar} disabled={restaurar.isPending}>
          {restaurar.isPending ? 'Restaurando...' : 'Restaurar producto'}
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button accion="modificar" className="flex-1" onClick={() => navigate(`/productos/${producto.id}/editar`)}>
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
