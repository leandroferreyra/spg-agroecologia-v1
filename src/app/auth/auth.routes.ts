import { Routes } from "@angular/router";

export const AUTH_ROUTES: Routes = [
    {
        path: 'boxed-signin',
        loadComponent: () => {
            return import('./login/boxed-signin').then(m => m.BoxedSigninComponent)
        }
    },
    {
        path: 'boxed-signup',
        loadComponent: () => import('./registro/boxed-signup').then((m) => m.BoxedSignupComponent)
    },
    {
        path: 'reset/:hash',
        loadComponent: () => import('./recupero-clave/boxed-password-reset').then((m) => m.BoxedPasswordResetComponent)
    },
    {
        path: 'verify/:uuid/:token',
        loadComponent: () => import('./habilitar-usuario/habilitar-usuario.component').then((m) => m.HabilitarUsuarioComponent)
    },
    {
        path: 'acceso-denegado',
        loadComponent: () => import('./acceso-denegado/acceso-denegado.component').then((m) => m.AccesoDenegadoComponent)
    },
]