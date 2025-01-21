import { Component, NgModule } from '@angular/core';
import { toggleAnimation } from 'src/app/shared/animations';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppService } from 'src/app/service/app.service';
import { SharedModule } from 'src/shared.module';
import { CommonModule } from '@angular/common';

@Component({
    standalone: true,
    imports: [CommonModule,SharedModule, RouterLink],
    templateUrl: './boxed-signin.html',
    animations: [toggleAnimation],
})
export class BoxedSigninComponent {
    store: any;
    constructor(
        public storeData: Store<any>,
        public router: Router,
        private appSetting: AppService,
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


}
