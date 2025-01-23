import { Component, OnDestroy, OnInit } from '@angular/core';
import { toggleAnimation } from 'src/app/shared/animations';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { SharedModule } from 'src/shared.module';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LoginDTO } from '../core/models/request/loginDTO';
import { AuthService } from '../services/auth.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
    standalone: true,
    imports: [CommonModule, SharedModule, RouterModule, FormsModule, ReactiveFormsModule, NgxSpinnerModule],
    templateUrl: './boxed-signin.html',
    animations: [toggleAnimation],
})
export class BoxedSigninComponent implements OnInit, OnDestroy {

    private subscription: Subscription = new Subscription();
    store: any;

    loginForm!: FormGroup;

    constructor(
        public storeData: Store<any>,
        public router: Router,
        public _authService: AuthService,
        private _spinner: NgxSpinnerService
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

    ngOnInit(): void {
        this.inicializarForm();
    }
    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    inicializarForm() {
        this.loginForm = new FormGroup({
            usuario: new FormControl(null, [Validators.required]),
            password: new FormControl(null, [Validators.required])
        });
    }

    iniciarSesion() {
        if (this.loginForm.valid) {
            this._spinner.show();
            let login = new LoginDTO();
            login.user_name = this.loginForm.get('usuario')?.value;
            login.password = this.loginForm.get('password')?.value;
            login.with.push('roles');
            login.with.push('permissions');
            this.subscription.add(
                this._authService.login(login).subscribe({
                    next: res => {
                        console.log(res);
                        this._spinner.hide();
                    },
                    error: error => {
                        console.log(error);
                        this._spinner.hide();
                    }
                })
            )
        }
        // Servicio para iniciar sesión y obtener datos. 
        // this.storeData.dispatch({ type: 'setUserRole', payload: 'admin' });
        // this.router.navigate(['/dashboard/user-profile']);
    }

}
