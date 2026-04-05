import { Routes } from "@angular/router";
import { DashboardComponent } from "./dashboard.component";
import { RoleGuard } from "src/app/core/guards/roleGuard";
import path from "path";
import { title } from "process";


export const DASHBOARD_ROUTES: Routes = [
    {
        path: '',
        component: DashboardComponent,
        children: [
            // Shared
            {
                path: 'user-profile',
                loadComponent: () => import('../dashboard/user-profile/user-profile.component').then(m => m.UserProfileComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ROLE_ADMIN', 'ROLE_USER'], title: 'Perfil' }
            },
            {
                path: 'config',
                loadComponent: () => import('./config/config.component').then(m => m.ConfigComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ROLE_ADMIN',], title: 'Configuración' }
            },
            {
                path: 'usuarios',
                loadComponent: () => import('./config/listado-usuarios/listado-usuarios.component').then(m => m.ListadoUsuariosComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ROLE_ADMIN'], title: 'Usuarios' }
            },
            {
                path: 'posiciones',
                loadComponent: () => import('./config/listado-posiciones/listado-posiciones.component').then(m => m.ListadoPosicionesComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ROLE_ADMIN'], title: 'Posiciones' }
            },
            {
                path: 'principios',
                loadComponent: () => import('./config/listado-principios/listado-principios.component').then(m => m.ListadoPrincipiosComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ROLE_ADMIN'], title: 'Principios' }
            },
            {
                path: 'estrategias',
                loadComponent: () => import('./config/listado-estrategias/listado-estrategias.component').then(m => m.ListadoEstrategiasComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ROLE_ADMIN'], title: 'Estrategias' }
            },
            {
                path: 'quintas',
                loadComponent: () => import('./config/listado-quintas/listado-quintas.component').then(m => m.ListadoQuintasComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ROLE_ADMIN'], title: 'Quintas' }
            },
            {
                path: 'quintas/:id/visitas',
                loadComponent: () => import('./config/listado-visitas/listado-visitas.component').then(m => m.ListadoVisitasComponent),
                canActivate: [RoleGuard], data: { expectedRoles: ['ROLE_ADMIN'], title: 'Visitas' }
            },

        ]
    }
]