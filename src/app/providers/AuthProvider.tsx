import * as React from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Modulo } from '@/core/hooks/usePermissions'

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: 'admin' | 'usuario'
  activo: boolean
}

export interface PermisoModulo {
  modulo: Modulo
  puede_ver: boolean
  puede_crear: boolean
  puede_modificar: boolean
  puede_archivar: boolean
}

interface AuthContextValue {
  usuario: Usuario | null
  permisos: PermisoModulo[]
  cargando: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

/**
 * Único lugar de la app que sabe quién está logueado y qué puede hacer.
 * Todo lo demás (usePermissions, rutas protegidas, UI) consume este
 * contexto — no se vuelve a pedir la sesión en cada componente.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = React.useState<Usuario | null>(null)
  const [permisos, setPermisos] = React.useState<PermisoModulo[]>([])
  const [cargando, setCargando] = React.useState(true)

  const cargarUsuarioYPermisos = React.useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    const session = sessionData.session
    if (!session) {
      setUsuario(null)
      setPermisos([])
      setCargando(false)
      return
    }

    const { data: perfil, error: errorPerfil } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol, activo')
      .eq('id', session.user.id)
      .single()

    if (errorPerfil) {
      // No lo dejamos pasar en silencio: sin esto, un problema acá se ve
      // desde afuera como "no pasa nada al tocar Ingresar" — costó
      // diagnosticar exactamente eso una vez por no tener este log.
      console.error('No se pudo cargar el perfil del usuario logueado:', errorPerfil)
    }

    const perfilTipado = perfil as Usuario | null

    if (perfilTipado) {
      setUsuario(perfilTipado)
      if (perfilTipado.rol !== 'admin') {
        const { data: permisosData, error: errorPermisos } = await supabase
          .from('permisos')
          .select('modulo, puede_ver, puede_crear, puede_modificar, puede_archivar')
          .eq('usuario_id', perfilTipado.id)
        if (errorPermisos) {
          console.error('No se pudieron cargar los permisos del usuario:', errorPermisos)
        }
        setPermisos((permisosData as PermisoModulo[]) ?? [])
      } else {
        setPermisos([])
      }
    }
    setCargando(false)
  }, [])

  React.useEffect(() => {
    cargarUsuarioYPermisos()
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      cargarUsuarioYPermisos()
    })
    return () => listener.subscription.unsubscribe()
  }, [cargarUsuarioYPermisos])

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ usuario, permisos, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
