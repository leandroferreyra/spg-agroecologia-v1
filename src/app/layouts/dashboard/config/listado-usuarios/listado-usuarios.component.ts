import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule, NgbPagination, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { Store } from '@ngrx/store';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { RegistroDTO } from 'src/app/core/models/request/registroDTO';
import { Rol } from 'src/app/core/models/response/rol';
import { ArrayToStringPipe } from 'src/app/core/pipes/array-to-string.pipe';
import { IndexService } from 'src/app/core/services/index.service';
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
  imports: [CommonModule, NgxSpinnerModule, NgbModule, NgbPaginationModule, FormsModule, ReactiveFormsModule, NgSelectModule,
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
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;

  // Orden y filtro
  MIN_FILTER_SIZE = 1;

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


  showFilter: boolean = false;
  filtroTipoPersona: string = 'todos';
  // Orden y filtro
  filtros: any = {
    'operator': { value: '' },
    'human.firstname': { value: '', op: 'LIKE', contiene: true },
    'human.lastname': { value: '', op: 'LIKE', contiene: true },
    'email': { value: '', op: 'LIKE', contiene: true },
    'roles.name': { value: '', op: '=', contiene: false }
  };
  ordenamiento: any = {

  };

  constructor(public storeData: Store<any>, private userService: UserService, private spinner: NgxSpinnerService,
    private tokenService: TokenService, private swalService: SwalService, private rolService: RolesService,
    private _userLogged: UserLoggedService, private _indexService: IndexService
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
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = ["roles", "permissions", "human.person.city.district.country"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getUsuariosWithParam(params, this.actual_role).subscribe({
        next: res => {
          this.usuarios = res.data;
          this.modificarPaginacion(res);
          this.spinner.hide();
          this.tokenService.setToken(res.token);
        },
        error: error => {
          this.spinner.hide();
          console.error(error);
        }
      })
    )
  }

  modificarPaginacion(res: any) {
    this.total_rows = res.meta.total;
    this.last_page = res.meta.last_page;
    if (this.usuarios.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }

  obtenerRoles() {
    this.subscription.add(
      this.rolService.getRolesWithoutPermissions(this.actual_role).subscribe({
        next: res => {
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

  toggleFilter() {
    this.showFilter = !this.showFilter;
    if (!this.showFilter) {
      this.filtros = {
        'operator': { value: '' },
        'human.firstname': { value: '', op: 'LIKE', contiene: true },
        'human.lastname': { value: '', op: 'LIKE', contiene: true },
        'email': { value: '', op: 'LIKE', contiene: true },
        'roles.name': { value: '', op: '=', contiene: false }
      };
      this.obtenerUsuarios();
    }
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
          this.obtenerUsuarios();
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

  obtenerUsuariosPorNombre(value: string) {
    this.filtros.operator.value = 'OR';
    this.filtros['human.firstname'].value = value;
    this.filtros['human.lastname'].value = value;
    this.obtenerUsuarios();
  }

}
