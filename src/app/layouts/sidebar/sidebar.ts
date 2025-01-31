import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { slideDownUp } from '../../shared/animations';
import { CommonModule } from '@angular/common';
import { IconModule } from 'src/app/shared/icon/icon.module';
import { NgScrollbarModule } from 'ngx-scrollbar';

@Component({
    selector: 'sidebar',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, IconModule, NgScrollbarModule],
    templateUrl: './sidebar.html',
    animations: [slideDownUp],
})
export class SidebarComponent {
    active = false;
    store: any;
    activeDropdown: string[] = [];
    parentDropdown: string = '';
    menuItems: any[] = [];


    constructor(public storeData: Store<any>, public router: Router) {
        this.initStore();
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

    isIncludedInActive(label: string) {
       return this.activeDropdown.includes(label)
    }


    navigateTo(route: string) {
        this.toggleMobileMenu();
        this.router.navigate([`dashboard/${route}`])
    }


}
