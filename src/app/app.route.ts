import { Routes } from '@angular/router';
import { LoginGuard } from './core/guards/loginGuard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'auth/boxed-signin',
        pathMatch: 'full'
    },
    {
        path: 'auth',
        loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES),
        canActivate: [LoginGuard]
    },
    {
        path: 'dashboard',
        loadChildren: () => import('./layouts/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
    }
];
