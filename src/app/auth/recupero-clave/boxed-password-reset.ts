import { Component, OnDestroy, OnInit } from '@angular/core';
import { toggleAnimation } from 'src/app/shared/animations';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppService } from 'src/app/core/services/app.service';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/shared.module';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from 'src/app/core/services/auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowAltCircleLeft, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';

@Component({
    standalone: true,
    imports: [CommonModule, SharedModule, RouterLink, FontAwesomeModule],
    templateUrl: './boxed-password-reset.html',
    animations: [toggleAnimation],
})
export class BoxedPasswordResetComponent implements OnInit, OnDestroy {
    store: any;


    private subscription: Subscription = new Subscription();

    resetPasswordForm!: FormGroup;

    showPassword: boolean = false;
    showConfirmPassword: boolean = false;


    //Icons
    iconLeftArrow = faArrowAltCircleLeft;
    iconEye = faEye;
    iconEyeSlash = faEyeSlash;

    hash: string = '';

    constructor(
        public storeData: Store<any>,
        public router: Router, private route: ActivatedRoute,
        private _authService: AuthService, private spinner: NgxSpinnerService) {
        this.initStore();
    }
    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }
    async initStore() {
        this.storeData
            .select((d) => d.index)
            .subscribe((d) => {
                this.store = d;
            });
    }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.hash = params['hash'];
        });
        this.inicializarResetForm();
    }


    inicializarResetForm() {
        this.resetPasswordForm = new FormGroup({
            password: new FormControl(null, [Validators.required]),
            confirmPassword: new FormControl(null, [Validators.required])
        });;
    }

    toggleClave() {
        this.showPassword = !this.showPassword;
      }
      toggleConfirmClave() {
        this.showConfirmPassword = !this.showConfirmPassword;
      }

}
