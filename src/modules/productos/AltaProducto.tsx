import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '@/core/hooks/usePageTitle'
import { useToast } from '@/core/hooks/useToast'
import { ProductoForm } from './ProductoForm'
import { useCrearProducto } from './api'
import { PRODUCTO_FORM_VACIO } from './types'
import type { ProductoFormValues } from './types'

export function AltaProducto() {
  usePageTitle('Nuevo producto')
  const navigate = useNavigate()
  const toast = useToast()
  const crear = useCrearProducto()

  function handleGuardar(valores: ProductoFormValues) {
    crear.mutate(valores, {
      onSuccess: () => {
        toast.exito('Producto guardado')
        navigate('/productos')
      },
      onError: () => toast.error('No se pudo guardar el producto')
    })
  }

  return (
    <ProductoForm
      valoresIniciales={PRODUCTO_FORM_VACIO}
      onGuardar={handleGuardar}
      onCancelar={() => navigate('/productos')}
      enviando={crear.isPending}
      accionBoton="guardar"
      textoBoton="Guardar"
      autoFocusCodigo
    />
  )
}
