import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { toggleAnimation } from 'src/app/shared/animations';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LoginDTO } from '../../core/models/request/loginDTO';
import { AuthService } from '../../core/services/auth.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { TokenService } from 'src/app/core/services/token.service';
import { UserLoggedService } from 'src/app/core/services/user-logged.service';
import { ModalOptions, NgxCustomModalComponent } from 'ngx-custom-modal';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { SwalService } from 'src/app/core/services/swal.service';
import { UserService } from 'src/app/core/services/user.service';

@Component({
    standalone: true,
    imports: [CommonModule, RouterModule, FontAwesomeModule, NgxSpinnerModule, NgxCustomModalComponent, FormsModule, ReactiveFormsModule],
    templateUrl: './boxed-signin.html',
    styleUrl: './boxed-signin.component.css',
    animations: [toggleAnimation]
})
export class BoxedSigninComponent implements OnInit, OnDestroy {

    private subscription: Subscription = new Subscription();
    store: any;

    loginForm!: FormGroup;
    recoveryPasswordForm!: FormGroup;

    envioEmailForm!: FormGroup;
    isSubmitRecuperoClave = false;
    isSubmitLogin = false;
    showPassword: boolean = false;

    usuarioLogueado: any;

    // Iconos
    iconEye = faEye;
    iconEyeSlash = faEyeSlash;

    // Referencia al modal
    @ViewChild('modalRecuperarClave') modalRecuperarClave!: NgxCustomModalComponent;
    modalOptions: ModalOptions = {
        closeOnOutsideClick: false,
        hideCloseButton: true,
        closeOnEscape: false
    };


    constructor(
        public storeData: Store<any>,
        public router: Router,
        public _authService: AuthService,
        private _spinner: NgxSpinnerService,
        private _tokenService: TokenService,
        private _userService: UserService,
        private _userLogged: UserLoggedService, private swalService: SwalService
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
        if (this._tokenService.getToken()) {
            this.router.navigate(['/dashboard/user-profile']);
        }
        this.inicializarForm();
    }
    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    inicializarForm() {
        this.loginForm = new FormGroup({
            email: new FormControl(null, [Validators.email]),
            password: new FormControl(null, [Validators.required])
        });
    }

    iniciarSesion() {
        this.isSubmitLogin = true;
        if (this.loginForm.valid) {
            this._spinner.show();
            let login = new LoginDTO();
            login.email = this.loginForm.get('email')?.value;
            login.password = this.loginForm.get('password')?.value;
            this.subscription.add(
                this._authService.login(login).subscribe({
                    next: res => {
                        this.usuarioLogueado = res;
                        this._tokenService.setToken(this.usuarioLogueado.token);
                        this._userLogged.setUsuarioLogueado(this.usuarioLogueado);
                        localStorage.setItem('userRole', this.usuarioLogueado.authorities[0]?.authority);
                        this.storeData.dispatch({ type: 'setUserRole', payload: this.usuarioLogueado.authorities[0].authority });
                        this.router.navigate(['/dashboard/user-profile']);
                        this._spinner.hide();
                    },
                    error: error => {
                        if (error.error.detalleError === "El email se encuentra deshabilitado. Aguarde a ser activado.") {
                            // this.openSwalResendMailVerificacion(error.error.message);
                            this.swalService.toastError('top-right', error.error.detalleError);

                        } else {
                            console.error(error);
                            this.swalService.toastError('top-right', error.error.detalleError);
                        }
                        this._spinner.hide();
                    }
                })
            )
        }
    }

    isEmail(value: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    }

    tieneVariosRoles(): boolean {
        return (this.usuarioLogueado.roles.length > 1);
    }

    showSwalFire(text: string) {
        Swal.fire({
            title: '',
            text: `${text}`,
            icon: 'success',
            confirmButtonText: 'Continuar',
        }).then((result) => {
            if (result.isConfirmed) {

            }
        });
    }

    togglePassword() {
        this.showPassword = !this.showPassword;
    }

    openModalRecuperoClave() {
        this.recoveryPasswordForm = new FormGroup({
            email: new FormControl(null, [Validators.required, Validators.email])
        });
        this.modalRecuperarClave.options = this.modalOptions;
        this.modalRecuperarClave.open();
    }

    closeModalRecuperoClave() {
        this.isSubmitRecuperoClave = false;
        this.modalRecuperarClave.close();
    }

    confirmarRecuperoClave() {
        this.isSubmitRecuperoClave = true;
        if (this.recoveryPasswordForm.valid) {
            this._spinner.show();
            this.subscription.add(
                this._userService.recoverPassword(this.recoveryPasswordForm.get('email')?.value).subscribe({
                    next: res => {
                        this._spinner.hide();
                        this.swalService.toastInfo('top-right', 'Se envió un correo con su nueva clave.')
                        this.closeModalRecuperoClave();
                    },
                    error: error => {
                        this._spinner.hide();
                        console.error(error);
                    }
                })
            );
        }
    }


}
