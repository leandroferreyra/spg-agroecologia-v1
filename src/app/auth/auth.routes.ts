import { Routes } from "@angular/router";

export const AUTH_ROUTES: Routes = [
    {
        path: 'boxed-signin',
        loadComponent: () => import('../auth/boxed-signin').then((m) => m.BoxedSigninComponent)
    },
    {
        path: 'boxed-signup',
        loadComponent: () => import('../auth/boxed-signup').then((m) => m.BoxedSignupComponent)
    },
    // {
    //     path: 'register/:uuid/:hash',
    //     loadComponent: () => import('./register/register.component').then((m) => m.RegisterComponent)
    // },
    {
        path: 'boxed-password-reset',
        loadComponent: () => import('../auth/boxed-password-reset').then((m) => m.BoxedPasswordResetComponent)
    },
    // {
    //     path: 'verify/:uuid/:token',
    //     loadComponent: () => import('./habilitar-usuario/habilitar-usuario.component').then((m) => m.HabilitarUsuarioComponent)
    // },
    // {
    //     path: 'acceso-denegado',
    //     loadComponent: () => import('./acceso-denegado/acceso-denegado.component').then((m) => m.AccesoDenegadoComponent)
    // },
]