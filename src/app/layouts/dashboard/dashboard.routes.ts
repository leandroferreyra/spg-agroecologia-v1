import { Routes } from "@angular/router";
import { DashboardComponent } from "./dashboard.component";
import { RoleGuard } from "src/app/core/guards/roleGuard";


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
                loadComponent: () => import('../dashboard/admin/listado-bancos/listado-bancos.component').then(m => m.ListadoBancosComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION'] }
            },
            {
                path: 'paises',
                loadComponent: () => import('../dashboard/admin/listado-paises/listado-paises.component').then(m => m.ListadoPaisesComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION'] }
            },
            {
                path: 'provincias',
                loadComponent: () => import('../dashboard/admin/listado-provincias/listado-provincias.component').then(m => m.ListadoProvinciasComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION'] }
            },
            {
                path: 'ciudades',
                loadComponent: () => import('../dashboard/admin/listado-ciudades/listado-ciudades.component').then(m => m.ListadoCiudadesComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION'] }
            },
            {
                path: 'generos',
                loadComponent: () => import('../dashboard/admin/listado-generos/listado-generos.component').then(m => m.ListadoGenerosComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION'] }
            },
            {
                path: 'monedas',
                loadComponent: () => import('../dashboard/admin/listado-monedas/listado-monedas.component').then(m => m.ListadoMonedasComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION'] }
            },
            {
                path: 'ubicaciones',
                loadComponent: () => import('../dashboard/admin/listado-ubicaciones/listado-ubicaciones.component').then(m => m.ListadoUbicacionesComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION'] }
            },
            {
                path: 'exchanges',
                loadComponent: () => import('../dashboard/admin/listado-tipos-de-cambio/listado-tipos-de-cambio.component').then(m => m.ListadoTiposDeCambioComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION'] }
            },
            {
                path: 'cuentas-bancarias',
                loadComponent: () => import('../dashboard/admin/listado-cuentas-bancarias/listado-cuentas-bancarias.component').then(m => m.ListadoCuentasBancariasComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION'] }
            },
            {
                path: 'categorias-productos',
                loadComponent: () => import('../dashboard/admin/listado-categorias-productos/listado-categorias-productos.component').then(m => m.ListadoCategoriasProductosComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION'] }
            },
            {
                path: 'usuarios',
                loadComponent: () => import('./admin/listado-usuarios/listado-usuarios.component').then(m => m.ListadoUsuariosComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['SUPER_ADMIN', 'ADMIN'] }
            },
            {
                path: 'produccion',
                loadComponent: () => import('../dashboard/produccion/produccion/produccion.component').then(m => m.ProduccionComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION', 'PRODUCCION'] }
            },
            {
                path: 'proveedores',
                loadComponent: () => import('../dashboard/proveedores/proveedores.component').then(m => m.ProveedoresComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION', 'PRODUCCION'] }
            },

        ]
    }
]