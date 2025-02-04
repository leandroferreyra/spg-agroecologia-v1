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
import { EmailDTO } from '../../core/models/request/emailDTO';
import Swal from 'sweetalert2';
import { TokenService } from 'src/app/core/services/token.service';
import { UserLoggedService } from 'src/app/core/services/user-logged.service';
import { ModalOptions, NgxCustomModalComponent } from 'ngx-custom-modal';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { SwalService } from 'src/app/core/services/swal.service';
import { Constantes } from 'src/Constantes';

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

    envioEmailForm!: FormGroup;
    isSubmitRecuperoClave = false;
    isSubmitLogin = false;
    showPassword: boolean = false;

    usuarioLogueado: any;

    // Iconos
    iconEye = faEye;
    iconEyeSlash = faEyeSlash;

    // // Obtén la referencia al modal
    @ViewChild('modalSeleccionRol') modalSeleccionRol!: NgxCustomModalComponent;
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
        private _userLogged: UserLoggedService, private swalService: SwalService
    ) {
        console.log('[BoxedSignin] Constructor iniciado');
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
        console.log('[BoxedSignin] ngOnInit iniciado');
        if (this._tokenService.getToken()) {
            console.log('[BoxedSignin] Token encontrado, redirigiendo a dashboard');
            this.router.navigate(['/dashboard']);
        }
        this.inicializarForm();
    }
    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    inicializarForm() {
        this.loginForm = new FormGroup({
            usuario: new FormControl(null, [Validators.required]),
            email: new FormControl(null, [Validators.email]),
            password: new FormControl(null, [Validators.required])
        });
    }

    iniciarSesion() {
        console.log('[BoxedSignin] Iniciando submit del formulario');
        this.isSubmitLogin = true;
        if (this.loginForm.valid) {
            this._spinner.show();
            let login = new LoginDTO();
            let usuario = this.loginForm.get('usuario')?.value;
            if (this.isEmail(usuario)) {
                login.email = usuario;
            } else {
                login.user_name = usuario;
            }
            login.password = this.loginForm.get('password')?.value;
            login.with.push('roles');
            login.with.push('permissions');
            this.subscription.add(
                this._authService.login(login).subscribe({
                    next: res => {
                        console.log(res);
                        this.usuarioLogueado = res.data;
                        this._tokenService.setToken(this.usuarioLogueado.token);
                        this._userLogged.setUsuarioLogueado(this.usuarioLogueado);
                        if (this.tieneVariosRoles()) {
                            this.modalSeleccionRol.options = this.modalOptions;
                            this.modalSeleccionRol.open();
                        } else {
                            localStorage.setItem('userRole', this.usuarioLogueado.roles[0].name);
                            this.storeData.dispatch({ type: 'setUserRole', payload: this.usuarioLogueado.roles[0].name });
                            this.router.navigate(['/dashboard/user-profile']);
                        }
                        this._spinner.hide();
                    },
                    error: error => {
                        console.log(error);
                        this.swalService.toastError('top-right', error.error.message);
                        this._spinner.hide();
                    }
                })
            )
        }
    }

    ingresarAlDashboard(rol: any) {
        console.log(rol);
        this._authService.cambioRol(rol.name);
        // localStorage.setItem('userRole', rol.name);
        // this.storeData.dispatch({ type: 'setUserRole', payload: rol.name });
        // if (rol.name === Constantes.ADMIN || rol.name === Constantes.ADMINISTRACION) {
        //     this.router.navigate(['/dashboard/bancos']);
        // }
        // if (rol.name === Constantes.PRODUCCION) {
        //     this.router.navigate(['/dashboard/produccion']);
        // }
    }

    cancelarSeleccionDashboard() {
        this.closeModalSeleccionRol();
    }


    isEmail(value: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    }


    tieneVariosRoles(): boolean {
        return (this.usuarioLogueado.roles.length > 1);
    }

    enviarEmail() {
        this.isSubmitRecuperoClave = true;
        if (this.envioEmailForm.valid) {
            this._spinner.show();
            let email = new EmailDTO();
            email.email = this.envioEmailForm.get('email')?.value;

            this.subscription.add(
                this._authService.sendMail(email).subscribe({
                    next: res => {
                        this._spinner.hide();
                        this.showSwalFire("Se le envió un correo con el link para cambiar la clave. Recuerde revisar los spam.");
                        // this.closeModalRecuperoClave();
                    },
                    error: error => {
                        console.error(error);
                        this._spinner.hide();
                    }
                }
                ));

        }
    }

    closeModalSeleccionRol() {
        this.modalSeleccionRol.close();
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


    async openModalRecuperoClave() {
        const { value: email } = await Swal.fire({
            title: 'Recupera tu clave',
            input: 'email',
            inputLabel: 'Email',
            inputPlaceholder: 'tuemail@ejemplo.com',
            confirmButtonText: 'Recuperar',
            showCancelButton: true,
            allowOutsideClick: false,
            inputValidator: (value) => {
                if (!value) {
                    return '¡Email es requerido!';
                }
                return null;
            },
        });

        if (email) {
            this._spinner.show();
            let emailDto = new EmailDTO();
            emailDto.email = email;

            this.subscription.add(
                this._authService.sendMail(emailDto).subscribe({
                    next: res => {
                        this._spinner.hide();
                        this.showSwalFire("Se le envió un correo con el link para cambiar la clave. Recuerde revisar los spam.");
                    },
                    error: error => {
                        console.error(error);
                        this._spinner.hide();
                        this.swalService.toastError('top-right', error.error.message);
                    }
                }
                ));
        }
    }




}
