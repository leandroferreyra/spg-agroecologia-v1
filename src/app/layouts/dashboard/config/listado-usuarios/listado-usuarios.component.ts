import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { RegistroDTO } from 'src/app/core/models/request/registroDTO';
import { Rol } from 'src/app/core/models/response/rol';
import { ArrayToStringPipe } from 'src/app/core/pipes/array-to-string.pipe';
import { RolesService } from 'src/app/core/services/roles.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { UserLoggedService } from 'src/app/core/services/user-logged.service';
import { UserService } from 'src/app/core/services/user.service';
import { IconInfoCircleComponent } from 'src/app/shared/icon/icon-info-circle';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import { Constantes } from 'src/Constantes';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-listado-usuarios',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule, NgbModule, NgbPaginationModule, FormsModule, ReactiveFormsModule,
    IconPencilComponent, IconTrashLinesComponent, IconInfoCircleComponent, IconSearchComponent, ArrayToStringPipe, NgxTippyModule,
    NgxCustomModalComponent],
  templateUrl: './listado-usuarios.component.html',
  styleUrl: './listado-usuarios.component.css'
})
export class ListadoUsuariosComponent implements OnInit, OnDestroy {

  store: any;
  private subscription: Subscription = new Subscription();
  actual_role: string = '';

  usuarios: any[] = [];
  usuariosFiltrados: any[] = [];
  originalCheckedState: boolean = false;
  usuarioLogueado: any;

  //Paginación
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;

  // Orden y filtro
  filtros: any = {};
  MIN_FILTER_SIZE = 1;
  showFilter: boolean = false;
  selectedRol: string = 'ALL_ROLES';

  // Referencia al modal para crear y editar países.
  @ViewChild('modalUsuarioView') modalUsuarioView!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: true
  };
  usuarioView: any;

  @ViewChild('modalRoles') modalRoles!: NgxCustomModalComponent;
  modalOptionsRoles: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: true
  };
  rolesForm!: FormGroup;
  usuarioInEdicion: any;
  roles: any[] = [];

  constructor(public storeData: Store<any>, private userService: UserService, private spinner: NgxSpinnerService,
    private tokenService: TokenService, private swalService: SwalService, private rolService: RolesService,
    private _userLogged: UserLoggedService
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
    this.spinner.show();
    this.usuarioLogueado = this._userLogged.getUsuarioLogueado;
    this.obtenerUsuarios();
    this.obtenerRoles();
  }

  obtenerUsuarios() {
    this.subscription.add(
      this.userService.getUsers(this.actual_role).subscribe({
        next: res => {
          console.log(res);
          this.spinner.hide();
          this.tokenService.setToken(res.token);
          this.usuarios = res.data;
          this.usuariosFiltrados = this.usuarios;
          if (this.usuarios.length <= this.itemsPerPage) {
            this.itemsInPage = this.usuarios.length;
          }
        },
        error: error => {
          this.spinner.hide();
          console.error(error);
        }
      })
    )
  }

  obtenerRoles() {
    this.subscription.add(
      this.rolService.getRolesWithoutPermissions(this.actual_role).subscribe({
        next: res => {
          console.log(res);
          this.tokenService.setToken(res.token);
          this.roles = res.data;
        },
        error: error => {
          console.error(error);
        }
      })
    )
  }

  isVerified(user: any): boolean {
    return (user.email_verified_at !== null) ? true : false;
  }

  openSwalCambiarEstadoUsuario(user: any, checkboxId: string) {
    this.originalCheckedState = this.isVerified(user);
    Swal.fire({
      title: '',
      text: '¿Desea habilitar/deshabilitar al usuario?',
      icon: 'info',
      confirmButtonText: 'Confirmar',
      showDenyButton: true,
      denyButtonText: 'Cancelar',
      didRender: () => {
        const cancelButton = Swal.getDenyButton();
        if (cancelButton) {
          cancelButton.setAttribute('id', 'back-button-with-border');
        }
      }
    }).then((result) => {
      const checkbox = document.getElementById(checkboxId) as HTMLInputElement;
      if (result.isConfirmed) {
        this.cambiarEstadoUsuario(user, checkbox);
      } else if (result.isDenied) {
        checkbox.checked = this.originalCheckedState;
      }
    })
  }

  cambiarEstadoUsuario(user: any, checkbox: any) {
    let userUpdateDTO = new RegistroDTO();
    userUpdateDTO.actual_role = this.actual_role;
    userUpdateDTO.email = user.email;
    if (user.email_verified_at === null) {
      userUpdateDTO.email_verified = true;
    } else {
      userUpdateDTO.email_verified = false;
    }
    this.spinner.show();
    this.subscription.add(
      this.userService.cambiarEstadoUsuario(user.uuid, userUpdateDTO).subscribe({
        next: res => {
          (res);
          this.swalService.toastSuccess('top-right', res.message);
          this.tokenService.setToken(res.token);
          this.spinner.hide();
        },
        error: error => {
          this.spinner.hide();
          this.swalService.toastError('top-right', error.error.message);
          checkbox.checked = this.originalCheckedState;
          console.error(error);
        }
      })
    )
  }

  public onPageChange(pageNum: number): void {
    this.currentPage = pageNum;
    this.pageSize = this.itemsPerPage * (pageNum - 1);
  }
  cambiarPaginacion() {
    this.onPageChange(1);
  }

  toggleFilter() {
    this.showFilter = !this.showFilter;
    if (!this.showFilter) {
      this.filtros = {};
    }
  }

  filtrarDatos() {
    let resultados = this.usuariosFiltrados;
    if (this.filtros.email) {
      resultados = resultados.filter(dato =>
        dato.email.toLocaleLowerCase().includes(this.filtros.email.toLowerCase()))
    }
    if (this.filtros.name) {
      resultados = resultados.filter(dato => {
        let nombreCompleto = (dato.human.firstname + ' ' + dato.human.lastname).toLocaleLowerCase();
        return nombreCompleto.includes(this.filtros.name.toLowerCase());
      })
    }

    if (this.filtros.name || this.filtros.email) {
      if (resultados.length <= this.itemsPerPage) {
        this.itemsInPage = resultados.length;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
        if (this.itemsInPage > resultados.length) {
          this.itemsInPage = resultados.length;
        }
      }
    } else {
      if (resultados.length <= this.itemsPerPage) {
        this.itemsInPage = resultados.length;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
        if (this.itemsInPage > resultados.length) {
          this.itemsInPage = resultados.length;
        }
      }
    }

    return resultados;
  }

  openModalUsuarioView(usuario: any) {
    this.usuarioView = usuario;
    this.modalUsuarioView.options = this.modalOptions;
    this.modalUsuarioView.open();
  }

  cerrarModal() {
    this.modalUsuarioView.close();
  }

  openSwalEliminar(user: any) {
    Swal.fire({
      title: '',
      text: '¿Desea eliminar el usuario?',
      icon: 'info',
      confirmButtonText: 'Confirmar',
      showDenyButton: true,
      denyButtonText: 'Cancelar',
      didRender: () => {
        const cancelButton = Swal.getDenyButton();
        if (cancelButton) {
          cancelButton.setAttribute('id', 'back-button-with-border');
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.eliminarUser(user);
      } else if (result.isDenied) {

      }
    })
  }


  eliminarUser(user: any) {
    this.spinner.show();
    this.subscription.add(
      this.userService.eliminarUsuario(user.uuid, this.actual_role).subscribe({
        next: res => {
          this.usuarios = this.usuarios.filter(u => u.uuid !== user.uuid);
          this.usuariosFiltrados = this.usuarios;
          this.itemsInPage -= 1;
          if (this.itemsInPage > this.itemsPerPage * this.currentPage) {
            this.itemsInPage = this.itemsPerPage * this.currentPage;
          }
          this.swalService.toastSuccess('top-right', res.message)
          this.spinner.hide();
          this.tokenService.setToken(res.token);
        },
        error: error => {
          this.swalService.toastError('top-right', error.error.message)
          this.spinner.hide();
          console.error(error);
        }
      })
    )
  }

  filteredItems() {
    if (this.selectedRol === 'ALL_ROLES') {
      this.usuariosFiltrados = this.usuarios;
    } else if (this.selectedRol === 'NO_ROLE') {
      this.usuariosFiltrados = this.usuarios.filter(user => user.roles.length === 0);
    } else {
      this.usuariosFiltrados = this.usuarios.filter(user =>
        user.roles.some((role: Rol) => role.name === this.selectedRol)
      );
    }
    this.itemsInPage = Math.min(this.itemsPerPage, this.usuariosFiltrados.length);
    if (this.currentPage > Math.ceil(this.usuariosFiltrados.length / this.itemsPerPage)) {
      this.currentPage = 1;
    }

    this.onPageChange(this.currentPage);
  }

  openModalRoles(usuario: any) {
    this.usuarioInEdicion = usuario;
    this.rolesForm = new FormGroup({});;
    this.roles.forEach(rol => {
      const tieneRol = this.usuarioTieneRol(rol.name, usuario);
      this.rolesForm.addControl(rol.name, new FormControl(tieneRol));

    });
    this.modalRoles.options = this.modalOptionsRoles;
    this.modalRoles.open();
  }
  usuarioTieneRol(rolName: string, usuario: any): boolean {
    return usuario.roles.some((rol: Rol) => rol.name === rolName);
  }
  cerrarModalRoles() {
    this.modalRoles.close();
  }

  confirmarRoles() {
    let agregaEstosRoles: string[] = [];
    this.roles.forEach(element => {
      let value = this.rolesForm.get(element.name)?.value;
      if (value) {
        agregaEstosRoles.push(element.name);
      }
    });
    if (agregaEstosRoles.length === 0) {
      this.swalService.toastError('top-right', "Tenes que elegir al menos un rol.")
    } else {
      this.spinner.show();
      this.subscription.add(
        this.userService.syncRolesUsuario(this.usuarioInEdicion.uuid, this.actual_role, agregaEstosRoles).subscribe({
          next: res => {
            let roles = this.convertirRolesEnObject(agregaEstosRoles);
            let usuario = this.usuarios.find(user => user.uuid === this.usuarioInEdicion.uuid);
            usuario.roles = roles; // Le asigno los nuevos roles para que se vea en pantalla.
            this.spinner.hide();
            this.swalService.toastSuccess('top-right', res.message);
            this.tokenService.setToken(res.token);
            this.usuarioInEdicion = null;
            this.cerrarModalRoles();
          },
          error: error => {
            console.error(error);
            this.spinner.hide();
          }
        })
      )
    }
  }
  convertirRolesEnObject(roles: string[]) {
    let rolesObject: Rol[] = [];
    roles.forEach(element => {
      let rol = new Rol();
      rol.name = element;
      rolesObject.push(rol);
    });
    return rolesObject;
  }


}
