import { Routes } from '@angular/router';

export const routes: Routes = [

    {
        path: '',
        loadChildren: () => import('./dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
    },
    {
        path: 'auth',
        loadChildren: () => import('../app/auth/auth.routes').then(m => m.AUTH_ROUTES)
    },

];
