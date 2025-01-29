import { Routes } from "@angular/router";
import { DashboardComponent } from "./dashboard.component";


export const DASHBOARD_ROUTES: Routes = [
    {
        path: '',
        component: DashboardComponent,
        children: [
            // Shared
            {
                path: 'user-profile',
                loadComponent: () => import('../dashboard/user-profile/user-profile.component').then(m => m.UserProfileComponent)
            },
            {
                path: 'bancos',
                loadComponent: () => import('../dashboard/admin/listado-bancos/listado-bancos.component').then(m => m.ListadoBancosComponent)
            },
            {
                path: 'paises',
                loadComponent: () => import('../dashboard/admin/listado-paises/listado-paises.component').then(m => m.ListadoPaisesComponent)
            },
            {
                path: 'provincias',
                loadComponent: () => import('../dashboard/admin/listado-provincias/listado-provincias.component').then(m => m.ListadoProvinciasComponent)
            },
            {
                path: 'ciudades',
                loadComponent: () => import('../dashboard/admin/listado-ciudades/listado-ciudades.component').then(m => m.ListadoCiudadesComponent)
            },
            {
                path: 'generos',
                loadComponent: () => import('../dashboard/admin/listado-generos/listado-generos.component').then(m => m.ListadoGenerosComponent)
            },
            {
                path: 'monedas',
                loadComponent: () => import('../dashboard/admin/listado-monedas/listado-monedas.component').then(m => m.ListadoMonedasComponent)
            }

        ]
    }
]