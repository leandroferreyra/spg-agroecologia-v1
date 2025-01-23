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
                loadComponent: () => import('../../users/profile').then(m => m.ProfileComponent)
            },
            {
                path: 'bancos',
                loadComponent: () => import('../dashboard/admin/listado-bancos/listado-bancos.component').then(m => m.ListadoBancosComponent)
            },
            {
                path: 'paises',
                loadComponent: () => import('../dashboard/admin/listado-paises/listado-paises.component').then(m => m.ListadoPaisesComponent)
            }

        ]
    }
]