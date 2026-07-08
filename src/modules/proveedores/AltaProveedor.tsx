import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '@/core/hooks/usePageTitle'
import { useToast } from '@/core/hooks/useToast'
import { ProveedorForm } from './ProveedorForm'
import { useCrearProveedor } from './api'
import { PROVEEDOR_FORM_VACIO } from './types'
import type { ProveedorFormValues } from './types'

export function AltaProveedor() {
  usePageTitle('Nuevo proveedor')
  const navigate = useNavigate()
  const toast = useToast()
  const crear = useCrearProveedor()

  function handleGuardar(valores: ProveedorFormValues) {
    crear.mutate(valores, {
      onSuccess: () => {
        toast.exito('Proveedor guardado')
        navigate('/proveedores')
      },
      onError: () => toast.error('No se pudo guardar el proveedor')
    })
  }

  return (
    <ProveedorForm
      valoresIniciales={PROVEEDOR_FORM_VACIO}
      onGuardar={handleGuardar}
      onCancelar={() => navigate('/proveedores')}
      enviando={crear.isPending}
      accionBoton="guardar"
      textoBoton="Guardar"
      autoFocusNombre
    />
  )
}
