import { Component, signal, WritableSignal } from '@angular/core';
import { toggleAnimation } from 'src/app/shared/animations';
import { Store } from '@ngrx/store';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/shared.module';
import { AuthService } from 'src/app/core/services/auth.service';
import { TokenService } from 'src/app/core/services/token.service';
import { UserLoggedService } from 'src/app/core/services/user-logged.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'header',
    standalone: true,
    imports: [CommonModule, SharedModule, RouterLink, RouterLinkActive, FontAwesomeModule],
    templateUrl: './header.html',
    animations: [toggleAnimation],
})
export class HeaderComponent {
    store: any;
    menuItems: any[] = [];
    usuarioLogueado: any;

    iconUser = faUser;

    constructor(
        public storeData: Store<any>,
        public router: Router,
        public _authService: AuthService, public _tokenService: TokenService, public _userLogged: UserLoggedService
    ) {
        this.initStore();
        this.usuarioLogueado = this._userLogged.getUsuarioLogueado;
        // console.log(this.usuarioLogueado);
        if (this.usuarioLogueado) {
            //TODO: Reemplazar ADMIN por el rol del usuario
            this.storeData.dispatch({ type: 'setUserRole', payload: 'ADMIN' });
        }
    }
    async initStore() {
        this.storeData
            .select((d) => d.index)
            .subscribe((d) => {
                this.store = d;
                this.menuItems = this.store.menuItems;
            });
    }

    ngOnInit() {
        this.setActiveDropdown();
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                this.setActiveDropdown();
            }
        });
    }

    setActiveDropdown() {
        const selector = document.querySelector('ul.horizontal-menu a[routerLink="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const all: any = document.querySelectorAll('ul.horizontal-menu .nav-link.active');
            for (let i = 0; i < all.length; i++) {
                all[0]?.classList.remove('active');
            }
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link');
                if (ele) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele?.classList.add('active');
                    });
                }
            }
        }
    }

    cerrarSesion() {
        this._authService.logout().subscribe({
            next: res => {
                this._tokenService.logout();
                this._userLogged.clearUsuarioLogueado();
                this.router.navigate(['/auth/boxed-signin']);
            },
            error: error => {
                console.error(error);
            }
        });
    }

    navigateTo(route: string) {
        this.router.navigate([`dashboard/${route}`])
    }

}
