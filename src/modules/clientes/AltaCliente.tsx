import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '@/core/hooks/usePageTitle'
import { useToast } from '@/core/hooks/useToast'
import { ClienteForm } from './ClienteForm'
import { useCrearCliente } from './api'
import { CLIENTE_FORM_VACIO } from './types'
import type { ClienteFormValues } from './types'

/** Alta de cliente — ver docs/sistemas/modulo-clientes-arquitectura.md sección 2.2. */
export function AltaCliente() {
  usePageTitle('Nuevo cliente')
  const navigate = useNavigate()
  const toast = useToast()
  const crear = useCrearCliente()

  function handleGuardar(valores: ClienteFormValues) {
    crear.mutate(valores, {
      onSuccess: () => {
        toast.exito('Cliente guardado')
        navigate('/clientes')
      },
      onError: () => toast.error('No se pudo guardar el cliente')
    })
  }

  return (
    <ClienteForm
      valoresIniciales={CLIENTE_FORM_VACIO}
      onGuardar={handleGuardar}
      onCancelar={() => navigate('/clientes')}
      enviando={crear.isPending}
      accionBoton="guardar"
      textoBoton="Guardar"
      autoFocusNombre
    />
  )
}
