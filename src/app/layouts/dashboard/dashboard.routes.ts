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
                path: 'generos',
                loadComponent: () => import('../dashboard/admin/listado-generos/listado-generos.component').then(m => m.ListadoGenerosComponent)
            }

        ]
    }
]