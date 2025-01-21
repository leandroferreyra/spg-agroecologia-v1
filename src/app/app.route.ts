import { Routes } from '@angular/router';

// layouts
import { AppLayout } from './layouts/app-layout';

export const routes: Routes = [
    {
        path: '', redirectTo: 'auth/boxed-signin', pathMatch: 'full'
    },
    {
        path: 'auth',
        loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES)
    },
    {
        path: '',
        component: AppLayout,
        children: [

            // users
            { path: '', loadChildren: () => import('./users/user.module').then((d) => d.UsersModule) }

        ],
    },


];
