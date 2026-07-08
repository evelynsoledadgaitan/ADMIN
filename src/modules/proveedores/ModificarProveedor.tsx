import { useNavigate, useParams } from 'react-router-dom'
import { usePageTitle } from '@/core/hooks/usePageTitle'
import { useToast } from '@/core/hooks/useToast'
import { SpinnerPantallaCompleta } from '@/core/components/Spinner'
import { EmptyState } from '@/core/components/EmptyState'
import { ProveedorForm } from './ProveedorForm'
import { useProveedor, useModificarProveedor } from './api'
import { proveedorAFormValues } from './types'
import type { ProveedorFormValues } from './types'

export function ModificarProveedor() {
  const { id } = useParams<{ id: string }>()
  usePageTitle('Editar proveedor')
  const navigate = useNavigate()
  const toast = useToast()
  const { data: proveedor, isLoading, isError } = useProveedor(id)
  const modificar = useModificarProveedor(id as string)

  if (isLoading) return <SpinnerPantallaCompleta />
  if (isError || !proveedor) {
    return (
      <EmptyState
        mensaje="No se encontró el proveedor."
        accion={{ texto: 'Volver al listado', onClick: () => navigate('/proveedores') }}
      />
    )
  }

  function handleGuardar(valores: ProveedorFormValues) {
    modificar.mutate(valores, {
      onSuccess: () => {
        toast.exito('Proveedor modificado')
        navigate(`/proveedores/${id}`)
      },
      onError: () => toast.error('No se pudo modificar el proveedor')
    })
  }

  return (
    <ProveedorForm
      valoresIniciales={proveedorAFormValues(proveedor)}
      onGuardar={handleGuardar}
      onCancelar={() => navigate(`/proveedores/${id}`)}
      enviando={modificar.isPending}
      accionBoton="modificar"
      textoBoton="Modificar"
    />
  )
}
