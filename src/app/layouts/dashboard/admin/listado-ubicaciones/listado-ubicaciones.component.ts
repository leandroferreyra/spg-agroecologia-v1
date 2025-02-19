import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DataTableModule } from '@bhplugin/ng-datatable';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowUp, faArrowDown, faGrinTongueSquint } from '@fortawesome/free-solid-svg-icons';
import { NgbAccordionModule, NgbModule, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { defaultStateFn, Store } from '@ngrx/store';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { UbicacionDTO } from 'src/app/core/models/request/ubicacionDTO';
import { IndexService } from 'src/app/core/services/index.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { UbicacionesService } from 'src/app/core/services/ubicaciones.service';
import { IconFolderComponent } from 'src/app/shared/icon/icon-folder';
import { IconInfoCircleComponent } from 'src/app/shared/icon/icon-info-circle';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-listado-ubicaciones',
  standalone: true,
  imports: [CommonModule, NgxCustomModalComponent, NgxTippyModule, DataTableModule, NgxSpinnerModule, FormsModule, ReactiveFormsModule,
    IconPlusComponent, IconPencilComponent, IconTrashLinesComponent, NgbPagination, IconSearchComponent, FontAwesomeModule,
    IconInfoCircleComponent, IconFolderComponent],
  templateUrl: './listado-ubicaciones.component.html',
  styleUrl: './listado-ubicaciones.component.css'
})
export class ListadoUbicacionesComponent implements OnInit, OnDestroy {

  store: any;
  private subscription: Subscription = new Subscription();

  actual_role: string = '';

  ubicaciones: any[] = [];
  subUbicaciones: any[] = [];
  ubicacionForm!: FormGroup;
  tituloModal: string = '';
  isSubmit = false;
  isEdicion = false;
  busqueda_global: boolean = false;
  locationToGo: any = null;


  //Paginación
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;

  // Orden y filtro
  filtros: any = {
    name: '',
    // location_uuid: null,
  };
  showFilter: boolean = false;
  ordenamiento: any = {
    name: 'asc'
  };
  // isFiltrando: boolean = false;

  breadcrumbs: any[] = [];

  iconArrowUp = faArrowUp;
  iconArrowDown = faArrowDown;

  // Referencia al modal para crear y editar países.
  @ViewChild('modalUbicacion') modalUbicacion!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  constructor(public storeData: Store<any>, private swalService: SwalService, private _indexService: IndexService,
    private _ubicacionService: UbicacionesService, private spinner: NgxSpinnerService, private tokenService: TokenService) {
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
    this.obtenerUbicaciones();
  }

  obtenerUbicaciones(ubicacion?: any) {
    // Si tiene ubicación es porque ingreso por ícono de sub ubicaciones.
    if (ubicacion) {
      this.locationToGo = ubicacion;
      this.busqueda_global = false;
      if (this.filtros.name) {
        // Si ingresa acá es porque entró desde "Mostrar sububicaciones" por lo que se borra el filtro nombre para traer todos los datos.
        this.filtros.name = '';
      }
    }
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = ["location.location.location.location"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;

    if (this.locationToGo) {
      this.filtros.location_uuid = this.locationToGo.uuid;
    } else {
      this.filtros.location_uuid = null;
    }
    // Si filtra y es global eliminamos el uuid
    if (this.filtros.name && this.busqueda_global) {
      delete this.filtros.location_uuid;
    }
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getUbicacionesWithParam(params, this.actual_role).subscribe({
        next: res => {
          this.ubicaciones = res.data;
          this.modificarPaginacion(res);
          if (this.locationToGo) {
            this.getParentsFromLocation(this.locationToGo);
          }
          this.spinner.hide();
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
    if (this.ubicaciones.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }

  openModalNuevaUbicacion(type: string, ubicacion?: any) {
    if (this.breadcrumbs.length < 4) {
      if (type === 'NEW') {
        this.isEdicion = false;
        this.tituloModal = 'Nueva ubicación';
        this.ubicacionForm = new FormGroup({
          nombre: new FormControl(null, [Validators.required]),
        });
      } else {
        this.isEdicion = true;
        this.tituloModal = 'Edición ubicación';
        this.ubicacionForm = new FormGroup({
          uuid: new FormControl(ubicacion?.uuid, []),
          nombre: new FormControl(ubicacion?.name, [Validators.required])
        });
      }
      this.modalUbicacion.options = this.modalOptions;
      this.modalUbicacion.open();
    } else {
      this.swalService.toastError('top-right', 'No es posible agregar ubicación en este nivel.');
    }
  }

  confirmarUbicacion() {
    this.isSubmit = true;
    if (this.ubicacionForm.valid) {
      this.spinner.show();
      let ubicacion = new UbicacionDTO();
      ubicacion.name = this.ubicacionForm.get('nombre')?.value;
      ubicacion.actual_role = this.actual_role;
      if (!this.isEdicion) {
        // Chequear si está en raíz o en sububicación para saber donde guardar.
        if (this.breadcrumbs.length > 0) {
          ubicacion.location_uuid = this.breadcrumbs[this.breadcrumbs.length - 1].uuid;
        }
        this.subscription.add(
          this._ubicacionService.saveUbicacion(ubicacion).subscribe({
            next: res => {
              if (this.breadcrumbs.length > 0) {
                this.locationToGo = this.breadcrumbs[this.breadcrumbs.length - 1];
                this.obtenerUbicaciones();
              } else {
                this.locationToGo = null;
                this.obtenerUbicaciones();
              }
              this.cerrarModal();
              this.swalService.toastSuccess('top-right', res.message);
              this.tokenService.setToken(res.token);
              this.spinner.hide();
            },
            error: error => {
              this.swalService.toastError('top-right', error.error.message);
              console.error(error);
              this.spinner.hide();
            }
          })
        )
      } else {
        this.subscription.add(
          this._ubicacionService.editUbicacion(this.ubicacionForm.get('uuid')?.value, ubicacion).subscribe({
            next: res => {
              const index = this.ubicaciones.findIndex(p => p.uuid === (this.ubicacionForm.get('uuid')?.value));
              if (index !== -1) {
                this.ubicaciones[index] = { ...this.ubicaciones[index], name: this.ubicacionForm.get('nombre')?.value };
                this.ubicaciones = [...this.ubicaciones];
              }
              this.cerrarModal();
              this.swalService.toastSuccess('top-right', res.message)
              this.tokenService.setToken(res.token);
              this.spinner.hide();
            },
            error: error => {
              console.error(error);
              this.spinner.hide();
              this.swalService.toastError('top-right', error.error.message);
            }
          })
        )
      }
    }
  }

  cerrarModal() {
    this.isSubmit = false;
    this.modalUbicacion.close();
  }

  openSwalEliminar(ubicacion: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar la ubicacion ${ubicacion.name}?`,
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
        this.eliminarUbicacion(ubicacion);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarUbicacion(ubicacion: any) {
    this.spinner.show();
    this.subscription.add(
      this._ubicacionService.eliminarUbicacion(ubicacion.uuid, this.actual_role.toUpperCase()).subscribe({
        next: res => {
          if (this.breadcrumbs.length > 0) {
            this.locationToGo = this.breadcrumbs[this.breadcrumbs.length - 1];
            this.obtenerUbicaciones();
          } else {
            this.locationToGo = null;
            this.obtenerUbicaciones();
          }
          this.tokenService.setToken(res.token);
          this.spinner.hide();
        },
        error: error => {
          console.error(error);
          this.swalService.toastError('top-right', error.error.message);
          this.spinner.hide();
        }
      })
    )
  }

  toggleFilter() {
    this.showFilter = !this.showFilter;
    if (!this.showFilter) {
      this.filtros = {
        name: '',
      };
      this.busqueda_global = false;
      if (this.breadcrumbs.length > 0) {
        // Quiere decir que estamos en alguna sububicación
        this.locationToGo = this.breadcrumbs[this.breadcrumbs.length - 1];
        this.obtenerUbicaciones();
      } else {
        this.locationToGo = null;
        this.obtenerUbicaciones();
      }
    }
  }

  cambiarOrdenamiento(column: string) {
    // si el ordenamiento es asc, lo cambiamos a desc y si es desc, lo cambiamos a sin ordenamiento
    if (this.ordenamiento[column] === 'asc') {
      this.ordenamiento[column] = 'desc';
    } else if (this.ordenamiento[column] === 'desc') {
      this.ordenamiento[column] = 'asc';
    }
    if (this.breadcrumbs.length > 0) {
      // Quiere decir que estamos en alguna sububicación
      this.locationToGo = this.breadcrumbs[this.breadcrumbs.length - 1];
      this.obtenerUbicaciones();
    } else {
      this.locationToGo = null;
      this.obtenerUbicaciones();
    }
  }


  getParentsFromLocation(ubicacion: any) {
    this.subscription.add(
      this._ubicacionService.showUbicacionWithParent(ubicacion.uuid, this.actual_role).subscribe({
        next: res => {
          this.breadcrumbs = [...this.construirBreadcrumb(res.data)];
        },
        error: error => {
          console.error(error);
        }
      })
    )
  }
  construirBreadcrumb(ubicacion: any): any[] {
    const breadcrumb = [];
    let actual = ubicacion;
    while (actual) {
      breadcrumb.unshift({ name: actual.name, uuid: actual.uuid }); // Agregamos al inicio
      actual = actual.location; // Pasamos a su padre
    }
    return breadcrumb;
  }

  goToLocation(index: number): void {
    if (index === -1 && this.breadcrumbs.length > 0) {
      this.breadcrumbs = [];
      this.locationToGo = null;
      this.obtenerUbicaciones();
    } else {
      if ((index + 1) === this.breadcrumbs.length) {
        //Está parado en el último elemento por lo que no hace nada.
      } else {
        // Mantiene los breadcrumbs hasta el índice seleccionado (incluido)
        this.breadcrumbs = this.breadcrumbs.slice(0, index + 1);
        // Llama al servicio para cargar las ubicaciones correspondientes al breadcrumb seleccionado
        const selectedBreadcrumb = this.breadcrumbs[index];
        if (selectedBreadcrumb) {
          this.obtenerUbicaciones(selectedBreadcrumb);
        }
      }
    }
  }

  cambiarTipoBusqueda() {
    if (this.filtros.name) {
      // this.isFiltrando = true;
      this.obtenerUbicaciones(null);
    }
  }

  getName(data: any) {
    if (this.filtros.name && this.busqueda_global) {
      let breadcrumb = this.construirBreadcrumb(data);
      let name = breadcrumb.map(element => element.name).join(' -> ');
      return name;
    }
    return data.name;
  }

}