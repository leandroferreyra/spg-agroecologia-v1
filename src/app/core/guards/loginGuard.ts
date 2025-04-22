import { inject } from "@angular/core";
import { Router } from "@angular/router";

export const LoginGuard = () => {
    const router = inject(Router);

    if (localStorage.getItem('token')) {
        return true;
    } else {
        router.navigate(['auth/boxed-signin']);
        return false;
    }
}