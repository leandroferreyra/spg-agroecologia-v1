import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { UserLoggedService } from 'src/app/core/services/user-logged.service';
import { UserService } from 'src/app/core/services/user.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { NgSelectModule } from '@ng-select/ng-select';
import { IconRefreshComponent } from 'src/app/shared/icon/icon-refresh';
import { IconLockComponent } from 'src/app/shared/icon/icon-lock';
import { IconEditComponent } from 'src/app/shared/icon/icon-edit';
import { PosicionService } from 'src/app/core/services/posicion.service';
import { UsuarioDTO } from 'src/app/core/models/request/usuarioDTO';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { ChangePasswordDTO } from 'src/app/core/models/request/changePasswordDTO';


@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, NgxTippyModule, NgxCustomModalComponent, RouterModule, FontAwesomeModule, FormsModule, ReactiveFormsModule, NgxSpinnerModule,
    NgSelectModule, IconRefreshComponent, IconLockComponent, IconEditComponent
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent implements OnInit, OnDestroy {

  private subscription: Subscription = new Subscription();
  usuarioLogueado: any;
  actual_role: string = '';

  isEdicion: boolean = false;
  mostrarOrganizacion: boolean = true;
  userForm!: FormGroup;

  // Catalogos
  posiciones: any[] = [];
  dataLoaded = false;

  // Referencia al modal
  @ViewChild('modalCambioClave') modalCambioClave!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  changePasswordForm!: FormGroup;
  isSubmit = false;
  isSubmitChangePassword = false;
  showPassword: boolean = false;
  showNewPassword: boolean = false;
  showNewConfirmPassword: boolean = false;

  // Iconos
  iconEye = faEye;
  iconEyeSlash = faEyeSlash;


  constructor(public storeData: Store<any>, private _userLogged: UserLoggedService, private userService: UserService,
    private _tokenService: TokenService, private spinner: NgxSpinnerService, private _authService: AuthService,
    private _posicionService: PosicionService, private router: Router, private swalService: SwalService
  ) {
    this.initStore();
  }
  async initStore() {
    this.storeData
      .select((d) => d.index)
      .subscribe((d) => {
        this.actual_role = d.userRole;
      });
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.usuarioLogueado = this._userLogged.getUsuarioLogueado;
    this.spinner.show();
    this.obtenerCatalogos();
    this.obtenerUsuario();
  }

  obtenerUsuario() {
    this.subscription.add(
      this.userService.getUsuario(this.usuarioLogueado.id).subscribe({
        next: res => {
          // console.log(res);
          this.spinner.hide();
          this.usuarioLogueado = res;
          this.inicializarForm(this.usuarioLogueado);
          this.dataLoaded = true;
        },
        error: error => {
          this.spinner.hide();
          console.error(error);
        }
      })
    );
  }

  obtenerCatalogos() {
    this.subscription.add(
      this._posicionService.getPosiciones().subscribe({
        next: res => {
          // console.log(res);
          this.posiciones = res;
        },
        error: error => {
          console.error(error);
        }
      })
    );
  }

  inicializarForm(res: any) {
    this.userForm = new FormGroup({
      email: new FormControl({ value: res.email, disabled: true }, [Validators.required, Validators.email]),
      nombre: new FormControl({ value: res.nombre, disabled: true }, [Validators.required]),
      celular: new FormControl({ value: res.celular, disabled: true }, [Validators.required]),
      organizacion: new FormControl({ value: res.organizacion, disabled: true }, [Validators.required]),
      posicion: new FormControl({ value: res.posicionResponse, disabled: true }, [Validators.required])
    });
    if (this.userForm.get('posicion')?.value.nombre === 'Consumidor/a') {
      this.mostrarOrganizacion = false;
    } else {
      this.mostrarOrganizacion = true;
    }
    this.onFormChange();
  }
  onFormChange() {
    this.userForm.get('posicion')!.valueChanges.subscribe(
      (value: any) => {
        if (value.nombre === 'Consumidor/a') {
          this.mostrarOrganizacion = false;
          this.userForm.get('organizacion')?.setValidators(null);
          this.userForm.get('organizacion')?.updateValueAndValidity();
        } else {
          this.mostrarOrganizacion = true;
          this.userForm.get('organizacion')?.setValidators(Validators.required);
          this.userForm.get('organizacion')?.updateValueAndValidity();
        }
      });
  }

  toggleEdicion() {
    this.isEdicion = !this.isEdicion;
    if (this.isEdicion) {
      this.modificarValidacionesForm();
    } else {
      this.cancelarEdicion();
    }
  }

  cancelarEdicion() {
    this.isEdicion = false;
    this.inicializarForm(this.usuarioLogueado);
  }

  modificarValidacionesForm() {
    this.userForm.get('celular')?.enable();
    this.userForm.get('nombre')?.enable();
    this.userForm.get('organizacion')?.enable();
    this.userForm.get('posicion')?.enable();
  }

  confirmarEdicion() {
    this.isSubmit = true;
    if (this.userForm.valid && !this.userForm.pristine) {
      this.spinner.show();
      const usuario: UsuarioDTO = {
        nombre: this.userForm.get('nombre')?.value,
        celular: this.userForm.get('celular')?.value,
        posicion: this.userForm.get('posicion')?.value?.id,
        organizacion: this.userForm.get('organizacion')?.value
      };

      this.subscription.add(
        this.userService.update(this.usuarioLogueado.id, usuario).subscribe({
          next: res => {
            this.obtenerUsuario();
            this.isEdicion = false;
            this.isSubmit = false;
          },
          error: error => {
            this.spinner.hide();
            console.error(error);
          }
        })
      );
    } else {
      this.swalService.toastError('top-right', "Formulario inválido o sin cambios.");
    }
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
        changePasswordDTO.claveAnterior = this.changePasswordForm.get('password')?.value;
        changePasswordDTO.claveNueva = this.changePasswordForm.get('newPassword')?.value;
        this.subscription.add(
          this.userService.changePassword(this.usuarioLogueado.id, changePasswordDTO).subscribe({
            next: res => {
              this.spinner.hide();
              this.closeModalCambioClave();
              this.swalService.toastSuccess("top-right", "Contraseña actualizada.");
            },
            error: error => {
              this.spinner.hide();
              console.error(error);
              this.swalService.toastError("top-right", error.error.detalleError);
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
