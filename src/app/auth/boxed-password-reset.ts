import { Component } from '@angular/core';
import { toggleAnimation } from 'src/app/shared/animations';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppService } from 'src/app/service/app.service';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/shared.module';

@Component({
    standalone: true,
    imports: [CommonModule, SharedModule, RouterLink],
    templateUrl: './boxed-password-reset.html',
    animations: [toggleAnimation],
})
export class BoxedPasswordResetComponent {
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
