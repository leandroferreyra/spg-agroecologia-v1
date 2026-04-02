import { Component, OnDestroy, OnInit } from '@angular/core';
import { toggleAnimation } from 'src/app/shared/animations';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from 'src/app/core/services/auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowAltCircleLeft, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
// import { ResetPasswordDTO } from 'src/app/core/models/request/resetPasswordDTO';
import Swal from 'sweetalert2';

@Component({
    standalone: true,
    imports: [CommonModule, RouterLink, FontAwesomeModule, NgxSpinnerModule, FormsModule, ReactiveFormsModule],
    templateUrl: './boxed-password-reset.html',
    animations: [toggleAnimation],
})
export class BoxedPasswordResetComponent implements OnInit, OnDestroy {
    store: any;


    private subscription: Subscription = new Subscription();

    resetPasswordForm!: FormGroup;
    isSubmitResetForm = false;
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


    volverAlPanel() {
        this.router.navigate(['auth/boxed-signin']);
    }


    confirmarReset() {
        // this.isSubmitResetForm = true;
        // if (this.resetPasswordForm.valid) {
        //     if (this.resetPasswordForm.get('password')?.value === this.resetPasswordForm.get('confirmPassword')?.value) {
        //         this.spinner.show();
        //         let resetPass = new ResetPasswordDTO();
        //         resetPass.new_password = this.resetPasswordForm.get('password')?.value;
        //         resetPass.new_password_confirmation = this.resetPasswordForm.get('confirmPassword')?.value;
        //         resetPass.hash = this.hash;
        //         this.subscription.add(
        //             this._authService.resetPassword(resetPass).subscribe({
        //                 next: res => {
        //                     this.spinner.hide();
        //                     Swal.fire({
        //                         title: '',
        //                         text: `Password modificado correctamente.`,
        //                         icon: 'success',
        //                         confirmButtonText: 'Continuar',
        //                     }).then((result) => {
        //                         if (result.isConfirmed) {
        //                             this.router.navigate(['auth/boxed-signin']);
        //                         }
        //                     });
        //                 },
        //                 error: error => {
        //                     console.error(error);
        //                     this.spinner.hide();
        //                     Swal.fire({
        //                         position: "top-right",
        //                         toast: true,
        //                         width: '30em',
        //                         icon: "error",
        //                         title: error.error.message,
        //                         showConfirmButton: false,
        //                         timer: 1500
        //                     });
        //                 }
        //             })
        //         );
        //     } else {
        //         this.spinner.hide();
        //         Swal.fire({
        //             position: "top-right",
        //             toast: true,
        //             width: '30em',
        //             icon: "error",
        //             title: 'Las contraseñas no coinciden.',
        //             showConfirmButton: false,
        //             timer: 1500
        //         });
        //     }
        // }
    }

}
