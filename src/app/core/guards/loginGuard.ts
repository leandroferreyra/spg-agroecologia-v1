import { inject } from "@angular/core";
import { Router } from "@angular/router";

export const LoginGuard = () => {
    const router = inject(Router);

    if (localStorage.getItem('usuarioLogueado')) {
        return true;
    } else {
        router.navigate(['auth/boxed-signin']);
        return false;
    }
}