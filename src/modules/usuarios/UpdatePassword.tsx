import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/core/components/Button'
import { TextField } from '@/core/components/TextField'
import { Spinner } from '@/core/components/Spinner'

const LONGITUD_MINIMA = 6 // mismo mínimo por defecto que exige Supabase Auth hoy

type Estado = 'verificando' | 'listo' | 'invalido' | 'exito'

/**
 * Pantalla de destino del enlace de "recuperar contraseña" — ruta pública,
 * fuera de <ProtectedRoute> (mismo nivel que /login), porque a esta
 * pantalla se llega sin haber iniciado sesión de la forma normal.
 *
 * Cómo se detecta el enlace: el cliente de Supabase ya tiene
 * `detectSessionInUrl: true` (src/lib/supabase/client.ts, sin cambios) —
 * al abrir el enlace del mail, el cliente procesa la URL solo y dispara el
 * evento `PASSWORD_RECOVERY` por `onAuthStateChange`. Como ese
 * procesamiento puede terminar antes de que este componente llegue a
 * montarse, se verifica de las dos formas: una sesión ya activa al montar
 * (`getSession`) cuenta como válida, y además se sigue escuchando por si
 * el evento llega después.
 */
export function UpdatePassword() {
  const navigate = useNavigate()
  const [estado, setEstado] = React.useState<Estado>('verificando')

  const [password, setPassword] = React.useState('')
  const [repetir, setRepetir] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [enviando, setEnviando] = React.useState(false)

  React.useEffect(() => {
    let activo = true

    supabase.auth.getSession().then(({ data }) => {
      if (activo && data.session) setEstado((actual) => (actual === 'verificando' ? 'listo' : actual))
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (!activo) return
      if (event === 'PASSWORD_RECOVERY') {
        setEstado('listo')
      }
    })

    // Si a los pocos segundos no pasó nada, el enlace es inválido o ya expiró.
    const timeoutId = setTimeout(() => {
      setEstado((actual) => (actual === 'verificando' ? 'invalido' : actual))
    }, 4000)

    return () => {
      activo = false
      listener.subscription.unsubscribe()
      clearTimeout(timeoutId)
    }
  }, [])

  function validar(): string | null {
    if (password.length < LONGITUD_MINIMA) return `Tiene que tener al menos ${LONGITUD_MINIMA} caracteres.`
    if (password !== repetir) return 'Las dos contraseñas no coinciden.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errorValidacion = validar()
    setError(errorValidacion)
    if (errorValidacion) return

    setEnviando(true)
    try {
      const { error: errorSupabase } = await supabase.auth.updateUser({ password })
      if (errorSupabase) throw errorSupabase
      setEstado('exito')
      // Cierra la sesión temporal de recuperación a propósito — fuerza un
      // login limpio con la contraseña nueva, en vez de dejarla "adentro"
      // por la sesión que abrió el enlace del mail.
      await supabase.auth.signOut()
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    } catch {
      setError('No se pudo actualizar la contraseña. Pedí un enlace nuevo e intentá de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  if (estado === 'verificando') {
    return (
      <div className="flex h-screen items-center justify-center bg-background px-4">
        <Spinner />
      </div>
    )
  }

  if (estado === 'invalido') {
    return (
      <div className="flex h-screen items-center justify-center bg-background px-4 animar-entrada-pantalla">
        <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 text-center">
          <h1 className="mb-2 text-lg font-semibold">Enlace inválido o vencido</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Este enlace de recuperación ya no es válido — puede que haya expirado, o que ya se haya usado antes.
          </p>
          <Button accion="guardar" className="w-full" onClick={() => navigate('/login', { replace: true })}>
            Volver a Ingresar
          </Button>
        </div>
      </div>
    )
  }

  if (estado === 'exito') {
    return (
      <div className="flex h-screen items-center justify-center bg-background px-4 animar-entrada-pantalla">
        <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 text-center">
          <h1 className="mb-2 text-lg font-semibold">Contraseña actualizada</h1>
          <p className="text-sm text-muted-foreground">Ya podés ingresar con tu contraseña nueva. Te llevamos al login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background px-4 animar-entrada-pantalla">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-border bg-surface p-6">
        <h1 className="mb-1 text-lg font-semibold">Elegí tu nueva contraseña</h1>
        <p className="mb-6 text-sm text-muted-foreground">Mínimo {LONGITUD_MINIMA} caracteres.</p>

        <div className="mb-3">
          <TextField
            label="Nueva contraseña"
            type="password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={enviando}
          />
        </div>

        <div className="mb-4">
          <TextField
            label="Repetir contraseña"
            type="password"
            required
            value={repetir}
            onChange={(e) => setRepetir(e.target.value)}
            error={error ?? undefined}
            disabled={enviando}
          />
        </div>

        <Button accion="guardar" type="submit" disabled={enviando} className="w-full">
          {enviando ? 'Guardando...' : 'Guardar contraseña'}
        </Button>
      </form>
    </div>
  )
}
