import { Suspense, lazy } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { AppShell } from '@/core/components/AppShell'
import { PantallaPrincipal } from '@/pages/inicio/PantallaPrincipal'
import { Menu } from '@/pages/menu/Menu'
import { Login } from '@/modules/usuarios/Login'
import { SpinnerPantallaCompleta } from '@/core/components/Spinner'

/**
 * Árbol de rutas de ADMIN — navegación definitiva (docs/decisiones/0007).
 * Todas las rutas de negocio viven dentro de <AppShell/> (TopBar + BottomNav
 * comunes). Login es la única pantalla fuera del shell.
 *
 * Clientes (Sprint 2) es el primer módulo con pantallas reales — 5 rutas
 * anidadas bajo /clientes, ver docs/sistemas/modulo-clientes-arquitectura.md
 * sección 2. El resto de los módulos siguen con su pantalla vacía del
 * esqueleto (Sprint 1) hasta que se programen de verdad.
 *
 * Todo módulo se carga con React.lazy — el código de Cheques, Informes,
 * etc. no se descarga hasta que el usuario entra ahí (ver docs/decisiones/0010).
 */
const ListadoClientes = lazy(() => import('@/modules/clientes').then((m) => ({ default: m.ListadoClientes })))
const AltaCliente = lazy(() => import('@/modules/clientes').then((m) => ({ default: m.AltaCliente })))
const ModificarCliente = lazy(() => import('@/modules/clientes').then((m) => ({ default: m.ModificarCliente })))
const FichaCliente = lazy(() => import('@/modules/clientes').then((m) => ({ default: m.FichaCliente })))
const EstadoCuentaCliente = lazy(() => import('@/modules/clientes').then((m) => ({ default: m.EstadoCuentaCliente })))

const ListadoProveedores = lazy(() => import('@/modules/proveedores').then((m) => ({ default: m.ListadoProveedores })))
const AltaProveedor = lazy(() => import('@/modules/proveedores').then((m) => ({ default: m.AltaProveedor })))
const ModificarProveedor = lazy(() => import('@/modules/proveedores').then((m) => ({ default: m.ModificarProveedor })))
const FichaProveedor = lazy(() => import('@/modules/proveedores').then((m) => ({ default: m.FichaProveedor })))
const EstadoCuentaProveedor = lazy(() => import('@/modules/proveedores').then((m) => ({ default: m.EstadoCuentaProveedor })))

const ListadoProductos = lazy(() => import('@/modules/productos').then((m) => ({ default: m.ListadoProductos })))
const AltaProducto = lazy(() => import('@/modules/productos').then((m) => ({ default: m.AltaProducto })))
const ModificarProducto = lazy(() => import('@/modules/productos').then((m) => ({ default: m.ModificarProducto })))
const FichaProducto = lazy(() => import('@/modules/productos').then((m) => ({ default: m.FichaProducto })))
const ImportarProductos = lazy(() => import('@/modules/productos').then((m) => ({ default: m.ImportarProductos })))
const ListadoCategorias = lazy(() => import('@/modules/productos').then((m) => ({ default: m.ListadoCategorias })))

const ListadoFacturacion = lazy(() => import('@/modules/facturacion').then((m) => ({ default: m.ListadoFacturacion })))
const NuevaFactura = lazy(() => import('@/modules/facturacion').then((m) => ({ default: m.NuevaFactura })))
const FichaFactura = lazy(() => import('@/modules/facturacion').then((m) => ({ default: m.FichaFactura })))

const ChequesScreen = lazy(() => import('@/modules/cheques').then((m) => ({ default: m.ChequesScreen })))
const ListadoEmpleados = lazy(() => import('@/modules/empleados').then((m) => ({ default: m.ListadoEmpleados })))
const AltaEmpleado = lazy(() => import('@/modules/empleados').then((m) => ({ default: m.AltaEmpleado })))
const ModificarEmpleado = lazy(() => import('@/modules/empleados').then((m) => ({ default: m.ModificarEmpleado })))
const FichaEmpleado = lazy(() => import('@/modules/empleados').then((m) => ({ default: m.FichaEmpleado })))
const Contador = lazy(() => import('@/modules/contador').then((m) => ({ default: m.Contador })))
const FichaVencimiento = lazy(() => import('@/modules/contador').then((m) => ({ default: m.FichaVencimiento })))
const ListadoNotas = lazy(() => import('@/modules/notas').then((m) => ({ default: m.ListadoNotas })))
const Informes = lazy(() => import('@/modules/informes').then((m) => ({ default: m.Informes })))
const PaginaCategoriaInformes = lazy(() => import('@/modules/informes').then((m) => ({ default: m.PaginaCategoriaInformes })))
const InformesClientes = lazy(() => import('@/modules/informes').then((m) => ({ default: m.InformesClientes })))
const InformesProveedores = lazy(() => import('@/modules/informes').then((m) => ({ default: m.InformesProveedores })))
const InformesFacturacion = lazy(() => import('@/modules/informes').then((m) => ({ default: m.InformesFacturacion })))
const InformesEmpleados = lazy(() => import('@/modules/informes').then((m) => ({ default: m.InformesEmpleados })))
const InformesContador = lazy(() => import('@/modules/informes').then((m) => ({ default: m.InformesContador })))
const Configuracion = lazy(() => import('@/modules/configuracion').then((m) => ({ default: m.Configuracion })))

function conSuspenso(elemento: React.ReactNode) {
  return <Suspense fallback={<SpinnerPantallaCompleta />}>{elemento}</Suspense>
}

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <PantallaPrincipal /> },
          { path: '/menu', element: <Menu /> },

          { path: '/clientes', element: conSuspenso(<ListadoClientes />) },
          { path: '/clientes/nuevo', element: conSuspenso(<AltaCliente />) },
          { path: '/clientes/:id', element: conSuspenso(<FichaCliente />) },
          { path: '/clientes/:id/editar', element: conSuspenso(<ModificarCliente />) },
          { path: '/clientes/:id/cuenta', element: conSuspenso(<EstadoCuentaCliente />) },

          { path: '/proveedores', element: conSuspenso(<ListadoProveedores />) },
          { path: '/proveedores/nuevo', element: conSuspenso(<AltaProveedor />) },
          { path: '/proveedores/:id', element: conSuspenso(<FichaProveedor />) },
          { path: '/proveedores/:id/editar', element: conSuspenso(<ModificarProveedor />) },
          { path: '/proveedores/:id/cuenta', element: conSuspenso(<EstadoCuentaProveedor />) },

          { path: '/productos', element: conSuspenso(<ListadoProductos />) },
          { path: '/productos/nuevo', element: conSuspenso(<AltaProducto />) },
          { path: '/productos/importar', element: conSuspenso(<ImportarProductos />) },
          { path: '/productos/categorias', element: conSuspenso(<ListadoCategorias />) },
          { path: '/productos/:id', element: conSuspenso(<FichaProducto />) },
          { path: '/productos/:id/editar', element: conSuspenso(<ModificarProducto />) },

          { path: '/facturacion', element: conSuspenso(<ListadoFacturacion />) },
          { path: '/facturacion/nueva', element: conSuspenso(<NuevaFactura />) },
          { path: '/facturacion/:id', element: conSuspenso(<FichaFactura />) },

          { path: '/cheques', element: conSuspenso(<ChequesScreen />) },
          { path: '/empleados', element: conSuspenso(<ListadoEmpleados />) },
          { path: '/empleados/nuevo', element: conSuspenso(<AltaEmpleado />) },
          { path: '/empleados/:id', element: conSuspenso(<FichaEmpleado />) },
          { path: '/empleados/:id/editar', element: conSuspenso(<ModificarEmpleado />) },
          { path: '/contador', element: conSuspenso(<Contador />) },
          { path: '/contador/:id', element: conSuspenso(<FichaVencimiento />) },
          { path: '/notas', element: conSuspenso(<ListadoNotas />) },
          { path: '/informes', element: conSuspenso(<Informes />) },
          {
            path: '/informes/clientes',
            element: conSuspenso(
              <PaginaCategoriaInformes modulo="clientes">
                <InformesClientes />
              </PaginaCategoriaInformes>
            )
          },
          {
            path: '/informes/proveedores',
            element: conSuspenso(
              <PaginaCategoriaInformes modulo="proveedores">
                <InformesProveedores />
              </PaginaCategoriaInformes>
            )
          },
          {
            path: '/informes/facturacion',
            element: conSuspenso(
              <PaginaCategoriaInformes modulo="facturacion">
                <InformesFacturacion />
              </PaginaCategoriaInformes>
            )
          },
          {
            path: '/informes/empleados',
            element: conSuspenso(
              <PaginaCategoriaInformes modulo="empleados">
                <InformesEmpleados />
              </PaginaCategoriaInformes>
            )
          },
          {
            path: '/informes/contador',
            element: conSuspenso(
              <PaginaCategoriaInformes modulo="contador">
                <InformesContador />
              </PaginaCategoriaInformes>
            )
          },
          { path: '/configuracion', element: conSuspenso(<Configuracion />) }
        ]
      }
    ]
  }
])

export function AppRoutes() {
  return <RouterProvider router={router} />
}
