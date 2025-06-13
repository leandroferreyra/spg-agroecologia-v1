import { Routes } from "@angular/router";
import { DashboardComponent } from "./dashboard.component";
import { RoleGuard } from "src/app/core/guards/roleGuard";
import path from "path";


export const DASHBOARD_ROUTES: Routes = [
    {
        path: '',
        component: DashboardComponent,
        children: [
            // Shared
            {
                path: 'user-profile',
                loadComponent: () => import('../dashboard/user-profile/user-profile.component').then(m => m.UserProfileComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION', 'PRODUCCION', 'USUARIO'] }
            },
            {
                path: 'bancos',
                loadComponent: () => import('./config/listado-bancos/listado-bancos.component').then(m => m.ListadoBancosComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION'] }
            },
            {
                path: 'paises',
                loadComponent: () => import('./config/listado-paises/listado-paises.component').then(m => m.ListadoPaisesComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION'] }
            },
            {
                path: 'provincias',
                loadComponent: () => import('./config/listado-provincias/listado-provincias.component').then(m => m.ListadoProvinciasComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION'] }
            },
            {
                path: 'ciudades',
                loadComponent: () => import('./config/listado-ciudades/listado-ciudades.component').then(m => m.ListadoCiudadesComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION'] }
            },
            {
                path: 'generos',
                loadComponent: () => import('./config/listado-generos/listado-generos.component').then(m => m.ListadoGenerosComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION'] }
            },
            {
                path: 'monedas',
                loadComponent: () => import('./config/listado-monedas/listado-monedas.component').then(m => m.ListadoMonedasComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION'] }
            },
            {
                path: 'ubicaciones',
                loadComponent: () => import('./config/listado-ubicaciones/listado-ubicaciones.component').then(m => m.ListadoUbicacionesComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION'] }
            },
            {
                path: 'exchanges',
                loadComponent: () => import('./config/listado-tipos-de-cambio/listado-tipos-de-cambio.component').then(m => m.ListadoTiposDeCambioComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION'] }
            },
            {
                path: 'tipos-productos',
                loadComponent: () => import('./config/listado-tipos-de-productos/listado-tipos-de-productos.component').then(m => m.ListadoTiposDeProductosComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION'] }
            },
            {
                path: 'cuentas-bancarias',
                loadComponent: () => import('./config/listado-cuentas-bancarias/listado-cuentas-bancarias.component').then(m => m.ListadoCuentasBancariasComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION'] }
            },
            {
                path: 'categorias-productos',
                loadComponent: () => import('./config/listado-categorias-productos/listado-categorias-productos.component').then(m => m.ListadoCategoriasProductosComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION'] }
            },
            {
                path: 'usuarios',
                loadComponent: () => import('./config/listado-usuarios/listado-usuarios.component').then(m => m.ListadoUsuariosComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['SUPER_ADMIN', 'ADMIN'] }
            },
            {
                path: 'produccion',
                loadComponent: () => import('../dashboard/produccion/produccion/produccion.component').then(m => m.ProduccionComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION', 'PRODUCCION'] }
            },
            {
                path: 'proveedores',
                loadComponent: () => import('./personas/proveedores/proveedores.component').then(m => m.ProveedoresComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION', 'PRODUCCION'] }
            },
            {
                path: 'proveedores/:uuid',
                loadComponent: () => import('./personas/proveedores/proveedores.component').then(m => m.ProveedoresComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION', 'PRODUCCION'] }
            },
            {
                path: 'clientes',
                loadComponent: () => import('./personas/clientes/clientes.component').then(m => m.ClientesComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION', 'PRODUCCION'] }
            },
            {
                path: 'clientes/:uuid',
                loadComponent: () => import('./personas/clientes/clientes.component').then(m => m.ClientesComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION', 'PRODUCCION'] }
            },
            {
                path: 'productos',
                loadComponent: () => import('./productos/productos.component').then(m => m.ProductosComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION', 'PRODUCCION'] }
            },
            {
                path: 'productos/:uuid',
                loadComponent: () => import('./productos/productos.component').then(m => m.ProductosComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION', 'PRODUCCION'] }
            },
            {
                path: 'compras',
                loadComponent: () => import('./compras/compras.component').then(m => m.ComprasComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION', 'PRODUCCION'] }
            },
            {
                path: 'compras/:uuid',
                loadComponent: () => import('./compras/compras.component').then(m => m.ComprasComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION', 'PRODUCCION'] }
            },
            {
                path: 'ventas',
                loadComponent: () => import('./ventas/ventas.component').then(m => m.VentasComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION', 'PRODUCCION'] }
            },
            {
                path: 'ventas/:uuid',
                loadComponent: () => import('./ventas/ventas.component').then(m => m.VentasComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION', 'PRODUCCION'] }
            }

        ]
    }
]