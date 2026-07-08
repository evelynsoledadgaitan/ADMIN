import * as React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { Button } from '@/core/components/Button'
import { TextField } from '@/core/components/TextField'

/**
 * Pantalla mínima de login. Es parte de la Fase 0 (configuración de
 * autenticación), no del módulo funcional "Usuarios" (gestión de usuarios y
 * permisos), que se desarrolla en una etapa posterior.
 */
export function Login() {
  const { usuario, login } = useAuth()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [enviando, setEnviando] = React.useState(false)

  if (usuario) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await login(email, password)
    } catch {
      setError('Email o contraseña incorrectos.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background px-4 animar-entrada-pantalla">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-border bg-surface p-6">
        <h1 className="mb-1 text-lg font-semibold">ADMIN</h1>
        <p className="mb-6 text-sm text-muted-foreground">Ahorrar tiempo y no olvidar nada.</p>

        <div className="mb-3">
          <TextField
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <TextField
            label="Contraseña"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error ?? undefined}
          />
        </div>

        <Button accion="guardar" type="submit" disabled={enviando} className="w-full">
          {enviando ? 'Ingresando...' : 'Ingresar'}
        </Button>
      </form>
    </div>
  )
}
