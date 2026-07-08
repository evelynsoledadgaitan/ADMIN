import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Faltan las variables de entorno VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Ver .env.example.'
  )
}

/**
 * Cliente único de Supabase para todo ADMIN. Ningún módulo debe crear su
 * propio cliente — así, si el día de mañana se agrega tenant_id o cambia
 * la config de auth, se cambia en un solo lugar.
 */
export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
