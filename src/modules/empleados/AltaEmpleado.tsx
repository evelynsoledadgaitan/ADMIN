import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '@/core/hooks/usePageTitle'
import { useToast } from '@/core/hooks/useToast'
import { EmpleadoForm } from './EmpleadoForm'
import { useRegistrarEmpleado } from './api'
import { EMPLEADO_FORM_VACIO } from './types'
import type { EmpleadoFormValues } from './types'

export function AltaEmpleado() {
  usePageTitle('Nuevo empleado')
  const navigate = useNavigate()
  const toast = useToast()
  const crear = useRegistrarEmpleado()

  function handleGuardar(valores: EmpleadoFormValues) {
    crear.mutate(valores, {
      onSuccess: () => {
        toast.exito('Empleado guardado')
        navigate('/empleados')
      },
      onError: () => toast.error('No se pudo guardar el empleado')
    })
  }

  return (
    <EmpleadoForm
      valoresIniciales={EMPLEADO_FORM_VACIO}
      onGuardar={handleGuardar}
      onCancelar={() => navigate('/empleados')}
      enviando={crear.isPending}
      accionBoton="guardar"
      textoBoton="Guardar"
      autoFocusNombre
    />
  )
}
