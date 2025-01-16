import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { EmailValidator, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterLinkWithHref } from '@angular/router';
import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Subscription, filter, retry } from 'rxjs';
import { Constantes } from '../../components/Constantes';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowAltCircleLeft, faEye, faEyeSlash, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { TokenService } from '../../core/services/token.service';
import { AuthService } from '../../core/services/auth.service';
import { LoginDTO } from '../../core/models/request/loginDTO';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { HttpErrorResponse } from '@angular/common/http';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, NgbModule, FontAwesomeModule, CommonModule, NgxSpinnerModule, RouterLink, RouterLinkActive],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, OnDestroy {

  private subscription: Subscription = new Subscription();

  @ViewChild('seleccionDashboard') myModal: any;

  tituloModalMail: string = '';
  // isReenvio: boolean = false;
  isRecupero: boolean = false;

  usuarioLogueado: any;
  tipoUsuario: string = '';
  loginForm!: FormGroup;
  envioEmailForm!: FormGroup;

  iconLeftArrow = faArrowAltCircleLeft;
  iconEye = faEye;
  iconEyeSlash = faEyeSlash;
  iconArrowLeft = faArrowLeft;

  showPassword: boolean = false;

  roles: string[] = [];

  currentRoute!: string;


  constructor(private _router: Router, private _modalService: NgbModal, private toastr: ToastrMessageService,
    private _tokenService: TokenService, private _authService: AuthService, private spinner: NgxSpinnerService,
    private _userLogged: UserLoggedService) {
    this._router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.currentRoute = this._router.url;
    });
  }
  isActive(route: string): boolean {
    return this.currentRoute === route;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit() {
    this.inicializarForm();
  }

  inicializarForm() {
    this.loginForm = new FormGroup({
      email: new FormControl(null, [Validators.required]),
      password: new FormControl(null, [Validators.required])
    });;
    // this.onChange();  
  }

  // onChange() {
  //   this.loginForm.get('nombre')!.valueChanges.subscribe(
  //     (valor: string) => {

  //     });
  // }

  openModalEnvioEmail(content: any, tipoEmail: string) {
    if (tipoEmail === 'reenvio') {
      // this.tituloModalMail = 'Reenvío de enlace';
      // this.isReenvio = true;
    } else {
      this.tituloModalMail = 'Recupero de clave';
      this.isRecupero = true;
    }
    this.envioEmailForm = new FormGroup({
      email: new FormControl(null, [Validators.required, Validators.email])
    });;
    this._modalService.open(content, { backdrop: 'static', centered: true, animation: true });
  }
  cerrarModal() {
    this._modalService.dismissAll();
  }
  enviarEmail() {
    if (this.envioEmailForm.valid) {
      this.spinner.show();
      let email = new EmailDTO();
      email.email = this.envioEmailForm.get('email')?.value;
      if (this.isRecupero) {
        this.subscription.add(
          this._authService.sendMail(email).subscribe({
            next: res => {
              this.spinner.hide();
              this.showSwalFire("Se le envió un correo con el link para cambiar la clave. Recuerde revisar los spam.");
              this.cerrarModal();
            },
            error: error => {
              console.error(error);
              this.spinner.hide();
              this.getResponseErrors(error);
            }
          }
          ));
      }
    } else {
      this.loginForm.markAllAsTouched();
      this.getFormValidationErrorsRecuperoClave();
    }
  }

  ingresar() {
    if (this.loginForm.valid) {
      this.spinner.show();
      // Va al servicio y chequea los roles
      let login = new LoginDTO();
      login.email = this.loginForm.get('email')?.value;
      login.password = this.loginForm.get('password')?.value;
      login.with.push('roles');
      login.with.push('permissions');
      login.with.push('sex');
      login.with.push('city.country');
      this.subscription.add(
        this._authService.login(login).subscribe({
          next: res => {
            this.usuarioLogueado = res.data;
            if (this.tieneVariosRoles()) {
              this._modalService.open(this.myModal, { backdrop: 'static', centered: true, keyboard: false, size: 'lg', animation: true, backdropClass: 'modal-backdrop-class' });
              this.spinner.hide();
            } else {
              this.loguearUsuario();
              this.spinner.hide();
            }
            this.spinner.hide();
          },
          error: error => {
            this.spinner.hide();
            this.getResponseErrors(error);
          }
        })
      );
    } else {
      this.getFormValidationErrorsLogin();
    }
  }

  loguearUsuario() {
    let rol = this.seleccionRolFromUsuarioLogueado();
    // if (rol === Constantes.NO_ROLE) {
    //   this.usuarioLogueado.roles = [Constantes.NO_ROLE];
    // }
    let id = this.usuarioLogueado.uuid;
    this._tokenService.setToken(this.usuarioLogueado.token);
    this._userLogged.setUsuarioLogueado(this.usuarioLogueado);
    if (rol === Constantes.COACH.toLowerCase()) {
      this._router.navigate([`/dashboard/${rol}/informes`]);
    } else if (rol === Constantes.COACHEE.toLowerCase()) {
      this._router.navigate([`/dashboard/${rol}/listado-informes`]);
    } else if (rol === Constantes.ADMIN.toLowerCase()) {
      this._router.navigate([`/dashboard/${rol}/listado-clientes`]);
    } else if (rol === Constantes.SUPER_ADMIN.toLowerCase()) {
      this._router.navigate([`/dashboard/${rol}/user-profile`]);
    } else { //sin-rol
      this._router.navigate([`/dashboard/${rol}/user-profile`]);
    }
  }
  ingresarAlDashboard(rol: Rol) {
    let dashRol: string = this.seleccionRolFromDashboard(rol);
    this._tokenService.setToken(this.usuarioLogueado.token);
    let id = this.usuarioLogueado.uuid;
    this.cerrarModal();
    this._userLogged.setUsuarioLogueado(this.usuarioLogueado);
    if (dashRol === Constantes.COACH.toLowerCase()) {
      this._router.navigate([`/dashboard/${dashRol}/informes`]);
    } else if (dashRol === Constantes.COACHEE.toLowerCase()) {
      this._router.navigate([`/dashboard/${dashRol}/listado-informes`]);
    } else if (dashRol === Constantes.ADMIN.toLowerCase()) {
      this._router.navigate([`/dashboard/${dashRol}/listado-clientes`]);
    } else {
      this._router.navigate([`/dashboard/${dashRol}/user-profile`]);
    }
  }


  tieneVariosRoles(): boolean {
    return (this.usuarioLogueado.roles.length > 1);
  }


  toggleClave() {
    this.showPassword = !this.showPassword;
  }

  // volverAlPanel() {
  //   this._router.navigate(['home']);
  // }

  getFormValidationErrorsRecuperoClave() {
    Object.keys(this.envioEmailForm.controls).forEach(key => {
      const controlErrors: ValidationErrors | null = this.envioEmailForm.get(key)!.errors;
      if (controlErrors != null) {
        Object.keys(controlErrors).forEach(keyError => {
          if (keyError === 'required') {
            this.toastr.toastrError("El email es requerido");
          } else if (keyError === 'email') {
            this.toastr.toastrError("El email tiene formato inválido");
          }
        });
      }
    });
  }
  getFormValidationErrorsLogin() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const controlErrors: ValidationErrors | null = this.loginForm.get(key)!.errors;
      if (controlErrors != null) {
        Object.keys(controlErrors).forEach(keyError => {
          if (key === 'email' && keyError === 'required') {
            this.toastr.toastrError("El email es requerido");
          } else if (key === 'password' && keyError === 'required') {
            this.toastr.toastrError("El password es requerido");
          } else if (key === 'email' && keyError === 'email') {
            this.toastr.toastrError("El email tiene formato inválido");
          }
        });
      }
    });
  }
  getResponseErrors(error: HttpErrorResponse): void {
    let errors;
    if (error.error && error.error.errors) {
      errors = error.error.errors;
    } else if (error.error && error.error.data) {
      errors = error.error.data;
    }
    for (const key in errors) {
      if (errors.hasOwnProperty(key)) {
        const error = errors[key];
        this.toastr.toastrError(`${key}: ${error}`);
        if (error === 'Usuario no habilitado.') {
          Swal.fire({
            title: error,
            text: '¿Desea que le reenviemos el email de habilitación de usuario?',
            icon: 'info',
            confirmButtonText: 'Enviar',
            showDenyButton: true,
            denyButtonText: 'Cancelar',
          }).then((result) => {
            if (result.isConfirmed) {
              this.spinner.show();
              let email = new EmailDTO();
              email.email = this.loginForm.get('email')?.value;
              this.subscription.add(
                this._authService.reSendMail(email).subscribe({
                  next: res => {
                    this.spinner.hide();
                    this.showSwalFire("¡Genial!. Se te ha enviado un e-mail a tu casilla de correo electrónico para confirmar tu cuenta. Recordá revisar SPAM.");
                  },
                  error: error => {
                    this.spinner.hide();
                    console.error(error);
                    this.getResponseErrors(error);
                  }
                }
                ));
            }
          })
        }
      }
    }

  }
  // toastrError(mensaje: string) {
  //   return this.toastr.error(`<span class="now-ui-icons ui-1_simple-remove"></span> ${mensaje}`, '', {
  //     timeOut: 3000,
  //     enableHtml: true,
  //     toastClass: "alert alert-danger",
  //     positionClass: 'toast-bottom-center'
  //   });
  // }

  cancelarSeleccionDashboard() {
    this.roles = [];
    this.cerrarModal();
  }

  esCoach(): boolean {
    return this.usuarioLogueado.roles.some((role: Rol) => role.name === Constantes.COACH);
  }
  esCoachee(): boolean {
    return this.usuarioLogueado.roles.some((role: Rol) => role.name === Constantes.COACHEE);
  }
  esAdmin(): boolean {
    return this.usuarioLogueado.roles.some((role: Rol) => role.name === Constantes.ADMIN);
  }
  esSuper(): boolean {
    return this.usuarioLogueado.roles.some((role: Rol) => role.name === Constantes.SUPER_ADMIN);
  }

  seleccionRolFromDashboard(rol: Rol): string {
    let dashRol: string;
    if (rol.name === Constantes.COACH) {
      dashRol = Constantes.COACH.toLowerCase();
    } else if (rol.name === Constantes.COACHEE) {
      dashRol = Constantes.COACHEE.toLowerCase();
    } else if (rol.name === Constantes.ADMIN) {
      dashRol = Constantes.ADMIN.toLowerCase();
    } else {
      dashRol = Constantes.SUPER_ADMIN.toLowerCase();
    }
    return dashRol;
  }
  seleccionRolFromUsuarioLogueado(): string {
    if (this.esCoach()) {
      return Constantes.COACH.toLowerCase();
    } else if (this.esCoachee()) {
      return Constantes.COACHEE.toLowerCase();
    } else if (this.esAdmin()) {
      return Constantes.ADMIN.toLowerCase();
    } else if (this.esSuper()) {
      return Constantes.SUPER_ADMIN.toLowerCase();
    } else {
      return Constantes.NO_ROLE.toLowerCase();
    }
  }

  showSwalFire(text: string) {
    Swal.fire({
      title: '',
      text: `${text}`,
      icon: 'success',
      confirmButtonText: 'Continuar',
    }).then((result) => {
      if (result.isConfirmed) {
        this._router.navigate(['auth/reset']);
      }
    });
  }


}
