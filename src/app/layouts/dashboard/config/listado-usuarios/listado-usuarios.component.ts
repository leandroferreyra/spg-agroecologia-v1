import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgbModule, NgbPagination, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { Store } from '@ngrx/store';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { Rol } from 'src/app/core/models/response/rol';
import { UsuarioResponse } from 'src/app/core/models/response/usuarioResponse';
import { ArrayToStringPipe } from 'src/app/core/pipes/array-to-string.pipe';
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
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;

  // Filtro
  filtros: any = {};
  MIN_FILTER_SIZE = 3;

  showFilter: boolean = false;

  constructor(public storeData: Store<any>, private userService: UserService, private spinner: NgxSpinnerService,
    private tokenService: TokenService, private swalService: SwalService,
    private _userLogged: UserLoggedService, private titleService: Title
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
    this.titleService.setTitle('SPG Agroecología - Usuarios');
  }

  public onPageChange(pageNum: number): void {
    this.pageSize = this.itemsPerPage * (pageNum - 1);
    this.itemsInPage = pageNum * this.itemsPerPage;
    if (this.itemsInPage > this.usuarios.length) {
      this.itemsInPage = this.usuarios.length;
    }
  }

  public changePagesize(num: number): void {
    this.itemsPerPage = this.pageSize + num;
  }

  obtenerUsuarios() {
    this.subscription.add(
      this.userService.getUsuarios().subscribe({
        next: res => {
          this.usuarios = res;
          this.spinner.hide();
        },
        error: error => {
          this.spinner.hide();
          console.error(error);
        }
      })
    )
  }

  isVerified(user: any): boolean {
    return (user.estado);
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
    this.spinner.show();
    this.subscription.add(
      this.userService.setearEstado(user.id, checkbox ? 'DESACTIVAR' : 'ACTIVAR').subscribe({
        next: res => {
          console.log(res);
          this.swalService.toastSuccess('top-right', 'Estado modificado con éxito.');
          this.spinner.hide();
        },
        error: error => {
          this.spinner.hide();
          this.swalService.toastError('top-right', error.error.detalleError);
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
        'nombre': '',
        'email': '',
        'posicion': '',
        'organizacion': ''
      };
      // this.obtenerUsuarios();
    }
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
      this.userService.deleteUsuario(user.id).subscribe({
        next: res => {
          this.obtenerUsuarios();
          // this.swalService.toastSuccess('top-right', res.message)
          this.spinner.hide();
          // this.tokenService.setToken(res.token);
        },
        error: error => {
          this.swalService.toastError('top-right', error.error.message)
          this.spinner.hide();
          console.error(error);
        }
      })
    )
  }

  filtrarDatos(): UsuarioResponse[] {
    let resultados = this.usuarios;
    if (this.filtros.nombre && this.filtros.nombre.length >= this.MIN_FILTER_SIZE) {
      resultados = resultados.filter(dato =>
        dato.nombre.toLocaleLowerCase().includes(this.filtros.nombre.toLowerCase()))
    }
    if (this.filtros.posicion && this.filtros.posicion.length >= this.MIN_FILTER_SIZE) {
      resultados = resultados.filter(dato =>
        dato.posicionResponse.nombre.toLocaleLowerCase().includes(this.filtros.posicion.toLowerCase()))
    }
    if (this.filtros.email && this.filtros.email.length >= this.MIN_FILTER_SIZE) {
      resultados = resultados.filter(dato =>
        dato.email.toLocaleLowerCase().includes(this.filtros.email.toLowerCase()))
    }
    if (this.filtros.organizacion && this.filtros.organizacion.length >= this.MIN_FILTER_SIZE) {
      resultados = resultados.filter(dato =>
        dato.organizacion?.toLocaleLowerCase().includes(this.filtros.organizacion.toLowerCase()))
    }
    return resultados;
  }

  openSwalCambiarRol(user: any, checkboxId: string) {
    this.originalCheckedState = user.isAdmin;
    Swal.fire({
      title: '',
      text: '¿Desea cambiar el rol del usuario?',
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
        this.cambiarRol(user, checkbox);
      } else if (result.isDenied) {
        checkbox.checked = this.originalCheckedState;
      }
    })
  }

  cambiarRol(usuario: any, checkbox: any) {
    // console.log(usuario);
    this.spinner.show();
    this.subscription.add(
      this.userService.cambiarRolAdmin(usuario.id, !usuario.isAdmin).subscribe(
        res => {
          console.log(res);
          // this._toastr.success('Rol modificado!', '');
          this.spinner.hide();
        },
        error => {
          this.spinner.hide();
          console.error(error);
          // this._toastr.error('No se ha podido modificar el rol.', '');

        }
      )
    );
  }

}
