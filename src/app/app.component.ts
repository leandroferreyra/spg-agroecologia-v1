import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { StoreModule } from '@ngrx/store';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { indexReducer } from './store/index.reducer';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    standalone: true,
    imports: [
        RouterOutlet
    ]
})
export class AppComponent {
    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private titleService: Title,
    ) {
        console.log('[AppComponent] Constructor iniciado');
        console.log('[AppComponent] Ruta actual:', this.router.url);
        // this.router.events
        //     .pipe(
        //         filter((event) => event instanceof NavigationEnd),
        //         map(() => this.activatedRoute),
        //         map((route) => {
        //             while (route.firstChild) route = route.firstChild;
        //             return route;
        //         }),
        //         filter((route) => route.outlet === 'primary'),
        //         switchMap((route) => {
        //             return route.data.pipe(
        //                 map((routeData: any) => {
        //                     const title = routeData['title'];
        //                     return { title };
        //                 }),
        //             );
        //         }),
        //         tap((data: any) => {
        //             let title = data.title;
        //             title = (title ? title + ' | ' : '') + 'LADIE';
        //             this.titleService.setTitle(title);
        //         }),
        //     )
        //     .subscribe();
    }
}
