import { useNavigate, useParams } from 'react-router-dom'
import { usePageTitle } from '@/core/hooks/usePageTitle'
import { useToast } from '@/core/hooks/useToast'
import { SpinnerPantallaCompleta } from '@/core/components/Spinner'
import { EmptyState } from '@/core/components/EmptyState'
import { ProductoForm } from './ProductoForm'
import { useProducto, useModificarProducto } from './api'
import { productoAFormValues } from './types'
import type { ProductoFormValues } from './types'

export function ModificarProducto() {
  const { id } = useParams<{ id: string }>()
  usePageTitle('Editar producto')
  const navigate = useNavigate()
  const toast = useToast()
  const { data: producto, isLoading, isError } = useProducto(id)
  const modificar = useModificarProducto(id as string)

  if (isLoading) return <SpinnerPantallaCompleta />
  if (isError || !producto) {
    return (
      <EmptyState
        mensaje="No se encontró el producto."
        accion={{ texto: 'Volver al listado', onClick: () => navigate('/productos') }}
      />
    )
  }

  function handleGuardar(valores: ProductoFormValues) {
    modificar.mutate(valores, {
      onSuccess: () => {
        toast.exito('Producto modificado')
        navigate(`/productos/${id}`)
      },
      onError: () => toast.error('No se pudo modificar el producto')
    })
  }

  return (
    <ProductoForm
      valoresIniciales={productoAFormValues(producto)}
      onGuardar={handleGuardar}
      onCancelar={() => navigate(`/productos/${id}`)}
      enviando={modificar.isPending}
      accionBoton="modificar"
      textoBoton="Modificar"
    />
  )
}
