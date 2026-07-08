import { useNavigate, useParams } from 'react-router-dom'
import { usePageTitle } from '@/core/hooks/usePageTitle'
import { useToast } from '@/core/hooks/useToast'
import { SpinnerPantallaCompleta } from '@/core/components/Spinner'
import { EmptyState } from '@/core/components/EmptyState'
import { ClienteForm } from './ClienteForm'
import { useCliente, useModificarCliente } from './api'
import { clienteAFormValues } from './types'
import type { ClienteFormValues } from './types'

/** Modificación de cliente — ver docs/sistemas/modulo-clientes-arquitectura.md sección 2.3. */
export function ModificarCliente() {
  const { id } = useParams<{ id: string }>()
  usePageTitle('Editar cliente')
  const navigate = useNavigate()
  const toast = useToast()
  const { data: cliente, isLoading, isError } = useCliente(id)
  const modificar = useModificarCliente(id as string)

  if (isLoading) return <SpinnerPantallaCompleta />
  if (isError || !cliente) {
    return (
      <EmptyState
        mensaje="No se encontró el cliente."
        accion={{ texto: 'Volver al listado', onClick: () => navigate('/clientes') }}
      />
    )
  }

  function handleGuardar(valores: ClienteFormValues) {
    modificar.mutate(valores, {
      onSuccess: () => {
        toast.exito('Cliente modificado')
        navigate(`/clientes/${id}`)
      },
      onError: () => toast.error('No se pudo modificar el cliente')
    })
  }

  return (
    <ClienteForm
      valoresIniciales={clienteAFormValues(cliente)}
      onGuardar={handleGuardar}
      onCancelar={() => navigate(`/clientes/${id}`)}
      enviando={modificar.isPending}
      accionBoton="modificar"
      textoBoton="Modificar"
    />
  )
}
