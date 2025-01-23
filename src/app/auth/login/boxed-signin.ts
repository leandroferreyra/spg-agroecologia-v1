import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { toggleAnimation } from 'src/app/shared/animations';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { SharedModule } from 'src/shared.module';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LoginDTO } from '../../core/models/request/loginDTO';
import { AuthService } from '../../core/services/auth.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { EmailDTO } from '../../core/models/request/emailDTO';
import Swal from 'sweetalert2';
import { TokenService } from 'src/app/core/services/token.service';
import { UserLoggedService } from 'src/app/core/services/user-logged.service';
import { ModalOptions, NgxCustomModalComponent } from 'ngx-custom-modal';

@Component({
    standalone: true,
    imports: [CommonModule, SharedModule, RouterModule],
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

    usuarioLogueado: any;

    // Obtén la referencia al modal
    @ViewChild('modalRecuperoClave') modalRecuperoClave!: NgxCustomModalComponent;
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
        private _userLogged: UserLoggedService
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
                        this.usuarioLogueado = res.data;
                        this._tokenService.setToken(this.usuarioLogueado.token);
                        this._userLogged.setUsuarioLogueado(this.usuarioLogueado);
                        this.storeData.dispatch({ type: 'setUserRole', payload: 'ADMIN' });
                        //TODO: navegar según el rol.
                        this.router.navigate(['/dashboard/user-profile']);
                        this._spinner.hide();
                    },
                    error: error => {
                        console.log(error);
                        this._spinner.hide();
                    }
                })
            )
        }
    }

    tieneVariosRoles(): boolean {
        return (this.usuarioLogueado.roles.length > 1);
    }

    openModalRecuperoClave() {
        this.modalRecuperoClave.options = this.modalOptions;
        this.modalRecuperoClave.open();
        // this._modalService.open(content, { backdrop: 'static', centered: true, animation: true });

        this.envioEmailForm = new FormGroup({
            email: new FormControl(null, [Validators.required, Validators.email])
        });;
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
                        this.closeModalRecuperoClave();
                    },
                    error: error => {
                        console.error(error);
                        this._spinner.hide();
                    }
                }
                ));

        }
    }

    closeModalRecuperoClave() {
        this.modalRecuperoClave.close();
        this.isSubmitRecuperoClave = false;
    }

    showSwalFire(text: string) {
        Swal.fire({
            title: '',
            text: `${text}`,
            icon: 'success',
            confirmButtonText: 'Continuar',
        }).then((result) => {
            if (result.isConfirmed) {
                this.router.navigate(['auth/reset']);
            }
        });
    }


}
