import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NavigationForRolGuardService } from '../services/navigation-for-rol-guard.service';

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router, private navigationService: NavigationForRolGuardService) { }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): boolean | UrlTree {
        this.navigationService.setPreviousUrl(this.router.url);
        const expectedRoles: string[] = route.data['expectedRoles'];
        if (this.authService.isLoggedIn() && this.authService.hasAnyRole(expectedRoles)) {
            return true;
        } else {
            this.navigationService.setPreviousUrl(this.router.url);
            return this.router.createUrlTree(['auth/acceso-denegado']);
        }
    }
}