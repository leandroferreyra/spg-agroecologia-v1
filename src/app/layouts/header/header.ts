import { Component, OnDestroy, OnInit, signal, ViewChild, WritableSignal } from '@angular/core';
import { toggleAnimation } from 'src/app/shared/animations';
import { Store } from '@ngrx/store';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/core/services/auth.service';
import { TokenService } from 'src/app/core/services/token.service';
import { UserLoggedService } from 'src/app/core/services/user-logged.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { ChangePasswordDTO } from 'src/app/core/models/request/changePasswordDTO';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { SwalService } from 'src/app/core/services/swal.service';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { MenuModule } from 'headlessui-angular';
import { IconUserComponent } from 'src/app/shared/icon/icon-user';
import { IconMenuComponent } from 'src/app/shared/icon/icon-menu';
import { IconCaretDownComponent } from 'src/app/shared/icon/icon-caret-down';

@Component({
    selector: 'header',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, FontAwesomeModule, NgxSpinnerModule, FormsModule, ReactiveFormsModule,
             NgxCustomModalComponent, NgScrollbarModule, MenuModule, IconUserComponent, IconMenuComponent, IconCaretDownComponent],
    templateUrl: './header.html',
    animations: [toggleAnimation],
})
export class HeaderComponent implements OnInit, OnDestroy {

    private subscription: Subscription = new Subscription();
    store: any;
    menuItems: any[] = [];
    usuarioLogueado: any;
    actual_role: string = '';
    iconUser = faUser;


    @ViewChild('modalCambioRol') modalCambioRol!: NgxCustomModalComponent;
    @ViewChild('modalCambioClave') modalCambioClave!: NgxCustomModalComponent;
    modalOptions: ModalOptions = {
        closeOnOutsideClick: false,
        hideCloseButton: true,
        closeOnEscape: false
    };

    changePasswordForm!: FormGroup;
    isSubmitChangePassword = false;
    showPassword: boolean = false;
    showNewPassword: boolean = false;
    showNewConfirmPassword: boolean = false;

    // Iconos
    iconEye = faEye;
    iconEyeSlash = faEyeSlash;

    constructor(
        public storeData: Store<any>,
        public router: Router, private spinner: NgxSpinnerService, private swalService: SwalService,
        public _authService: AuthService, public _tokenService: TokenService, public _userLogged: UserLoggedService
    ) {
        console.log('[HeaderComponent] Constructor iniciado');
        this.initStore();
        this.usuarioLogueado = this._userLogged.getUsuarioLogueado;
        console.log('[HeaderComponent] Usuario logueado:', this.usuarioLogueado);
        
        if (this.usuarioLogueado) {
            const userRole = localStorage.getItem('userRole');
            console.log('[HeaderComponent] Dispatching setUserRole with:', userRole);
            this.storeData.dispatch({ type: 'setUserRole', payload: userRole });
        }
    }
    async initStore() {
        console.log('[HeaderComponent] initStore iniciado');
        this.storeData
            .select((d) => d.index)
            .subscribe((d) => {
                console.log('[HeaderComponent] Store actualizado:', d);
                this.store = d;
                this.menuItems = this.store.menuItems;
                this.actual_role = this.store.userRole;
            });
    }
    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }
    ngOnInit() {
        this.setActiveDropdown();
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                this.setActiveDropdown();
            }
        });
    }

    setActiveDropdown() {
        const selector = document.querySelector('ul.horizontal-menu a[routerLink="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const all: any = document.querySelectorAll('ul.horizontal-menu .nav-link.active');
            for (let i = 0; i < all.length; i++) {
                all[0]?.classList.remove('active');
            }
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link');
                if (ele) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele?.classList.add('active');
                    });
                }
            }
        }
    }

    cerrarSesion() {
        this._authService.logout().subscribe({
            next: res => {
                this._tokenService.logout();
                this._userLogged.clearUsuarioLogueado();
                this.router.navigate(['/auth/boxed-signin']);
            },
            error: error => {
                console.error(error);
            }
        });
    }

    navigateTo(route: string) {
        if (route) {
            this.router.navigate([`dashboard/${route}`])
        }
    }

    openModalCambiarRol() {
        this.modalCambioRol.options = this.modalOptions;
        this.modalCambioRol.open();
    }
    ingresarAlDashboard(rol: any) {
        this.closeModalCambioRol();
        this.actual_role = rol;
        this._authService.cambioRol(rol.name);
    }
    closeModalCambioRol() {
        this.modalCambioRol.close();
    }




    // Modal cambio clave 
    openModalCambiarClave() {
        this.changePasswordForm = new FormGroup({
            password: new FormControl(null, [Validators.required]),
            newPassword: new FormControl(null, [Validators.required]),
            confirmPassword: new FormControl(null, [Validators.required])
        });;
        this.modalCambioClave.options = this.modalOptions;
        this.modalCambioClave.open();
    }
    confirmarCambioClave() {
        this.isSubmitChangePassword = true;
        if (this.changePasswordForm.valid) {
            if (this.changePasswordForm.get('newPassword')?.value === this.changePasswordForm.get('confirmPassword')?.value) {
                this.spinner.show();
                let changePasswordDTO = new ChangePasswordDTO();
                changePasswordDTO.password = this.changePasswordForm.get('password')?.value;
                changePasswordDTO.new_password = this.changePasswordForm.get('newPassword')?.value;
                changePasswordDTO.new_password_confirmation = this.changePasswordForm.get('confirmPassword')?.value;
                this.subscription.add(
                    this._authService.changePassword(this.actual_role, changePasswordDTO).subscribe({
                        next: res => {
                            this.spinner.hide();
                            this.closeModalCambioClave();
                            this._tokenService.setToken(res.token);
                            this.swalService.toastSuccess("top-right", "Contraseña actualizada.");
                        },
                        error: error => {
                            this.spinner.hide();
                            console.error(error);
                            this.swalService.toastError("top-right", "Error en la actualización de contraseña.");
                        }
                    })
                );
            } else {
                this.swalService.toastError('top-right', "Las contraseñas no coinciden.");
            }
        }
    }
    togglePassword() {
        this.showPassword = !this.showPassword;
    }
    toggleNewPassword() {
        this.showNewPassword = !this.showNewPassword;
    }
    toggleConfirmNewPassword() {
        this.showNewConfirmPassword = !this.showNewConfirmPassword;
    }

    closeModalCambioClave() {
        this.isSubmitChangePassword = false;
        this.modalCambioClave.close();
    }

}
