import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { slideDownUp } from '../../shared/animations';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/shared.module';


declare interface RouteInfo {
    path: string;
    title: string;
    icon: string;
    class: string;
}

export const ROUTES_SUPER_ADMIN: RouteInfo[] = [
    { path: '/dashboard/:tipo/listado-permisos', title: 'Permisos', icon: 'design_bullet-list-67', class: '' },
    { path: '/dashboard/:tipo/listado-roles', title: 'Roles', icon: 'design_bullet-list-67', class: '' },
    { path: '/dashboard/:tipo/listado-clientes', title: 'Clientes', icon: 'design_bullet-list-67', class: '' },
    { path: '/dashboard/:tipo/listado-carreras', title: 'Carreras', icon: 'design_bullet-list-67', class: '' },
    { path: '/dashboard/:tipo/listado-clasificaciones', title: 'Clasificaciones', icon: 'design_bullet-list-67', class: '' },
    { path: '/dashboard/:tipo/listado-subclasificaciones', title: 'Subclasificaciones', icon: 'design_bullet-list-67', class: '' },
    { path: '/dashboard/:tipo/listado-precios', title: 'Precios', icon: 'design_bullet-list-67', class: '' },
    { path: '/dashboard/:tipo/listado-generos', title: 'Generos', icon: 'design_bullet-list-67', class: '' },
    { path: '/dashboard/:tipo/listado-paises', title: 'Países', icon: 'design_bullet-list-67', class: '' },
    { path: '/dashboard/:tipo/listado-ciudades', title: 'Provincias', icon: 'design_bullet-list-67', class: '' },
    { path: '/dashboard/:tipo/user-profile', title: 'Mi perfil', icon: 'users_single-02', class: '' }
];


@Component({
    selector: 'sidebar',
    standalone: true,
    imports: [CommonModule, SharedModule, RouterLink, RouterLinkActive],
    templateUrl: './sidebar.html',
    animations: [slideDownUp],
})
export class SidebarComponent {
    active = false;
    store: any;
    activeDropdown: string[] = [];
    parentDropdown: string = '';
    constructor(
        public storeData: Store<any>,
        public router: Router,
    ) {
        this.initStore();
    }
    async initStore() {
        this.storeData
            .select((d) => d.index)
            .subscribe((d) => {
                this.store = d;
            });
    }

    ngOnInit() {
        this.setActiveDropdown();
    }

    setActiveDropdown() {
        const selector = document.querySelector('.sidebar ul a[routerLink="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link') || [];
                if (ele.length) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele.click();
                    });
                }
            }
        }
    }

    toggleMobileMenu() {
        if (window.innerWidth < 1024) {
            this.storeData.dispatch({ type: 'toggleSidebar' });
        }
    }

    toggleAccordion(name: string, parent?: string) {
        if (this.activeDropdown.includes(name)) {
            this.activeDropdown = this.activeDropdown.filter((d) => d !== name);
        } else {
            this.activeDropdown.push(name);
        }
    }
}
