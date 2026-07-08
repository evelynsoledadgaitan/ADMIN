import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'

/** Bloquea el acceso a cualquier ruta hija si no hay sesión activa. */
export function ProtectedRoute() {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">Cargando...</div>
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
