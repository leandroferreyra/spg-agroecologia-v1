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
                path: 'produccion',
                loadComponent: () => import('../dashboard/produccion/produccion/produccion.component').then(m => m.ProduccionComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ADMIN', 'ADMINISTRACION', 'PRODUCCION'] }
            },

        ]
    }
]