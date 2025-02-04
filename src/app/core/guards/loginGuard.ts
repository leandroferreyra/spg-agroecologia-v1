import { inject } from "@angular/core";
import { Router } from "@angular/router";

export const LoginGuard = () => {
    console.log('[LoginGuard] Verificando acceso');
    const router = inject(Router);

    if (localStorage.getItem('token')) {
        console.log('[LoginGuard] Token encontrado, redirigiendo a dashboard');
        router.navigate(['/dashboard']);
        return false;
    } else {
        console.log('[LoginGuard] Token no encontrado, permitiendo acceso a login');
        return true;
    }
}