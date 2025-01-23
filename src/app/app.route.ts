import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '', redirectTo: 'auth/boxed-signin', pathMatch: 'full'
    },
    {
        path: 'auth',
        loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES)
    },
    {
        path: 'dashboard',
        loadChildren: () => import('./layouts/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
    }
];
