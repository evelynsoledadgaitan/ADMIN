import { useNavigate, useParams } from 'react-router-dom'
import { usePageTitle } from '@/core/hooks/usePageTitle'
import { useToast } from '@/core/hooks/useToast'
import { SpinnerPantallaCompleta } from '@/core/components/Spinner'
import { EmptyState } from '@/core/components/EmptyState'
import { EmpleadoForm } from './EmpleadoForm'
import { useEmpleado, useModificarEmpleado } from './api'
import { empleadoAFormValues } from './types'
import type { EmpleadoFormValues } from './types'

export function ModificarEmpleado() {
  const { id } = useParams<{ id: string }>()
  usePageTitle('Editar empleado')
  const navigate = useNavigate()
  const toast = useToast()
  const { data: empleado, isLoading, isError } = useEmpleado(id)
  const modificar = useModificarEmpleado(id as string)

  if (isLoading) return <SpinnerPantallaCompleta />
  if (isError || !empleado) {
    return (
      <EmptyState
        mensaje="No se encontró el empleado."
        accion={{ texto: 'Volver al listado', onClick: () => navigate('/empleados') }}
      />
    )
  }

  function handleGuardar(valores: EmpleadoFormValues) {
    modificar.mutate(valores, {
      onSuccess: () => {
        toast.exito('Empleado modificado')
        navigate(`/empleados/${id}`)
      },
      onError: () => toast.error('No se pudo modificar el empleado')
    })
  }

  return (
    <EmpleadoForm
      valoresIniciales={empleadoAFormValues(empleado)}
      onGuardar={handleGuardar}
      onCancelar={() => navigate(`/empleados/${id}`)}
      enviando={modificar.isPending}
      accionBoton="modificar"
      textoBoton="Modificar"
    />
  )
}
