import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { DataTableModule } from '@bhplugin/ng-datatable';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { CategoriaDTO } from 'src/app/core/models/request/categoriaDTO';
import { CategoriasService } from 'src/app/core/services/categorias.service';
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
  selector: 'app-listado-categorias-productos',
  standalone: true,
  imports: [CommonModule, NgxCustomModalComponent, NgxTippyModule, DataTableModule, NgxSpinnerModule, FormsModule, ReactiveFormsModule,
    IconPlusComponent, IconPencilComponent, IconTrashLinesComponent, NgbPagination, IconSearchComponent, FontAwesomeModule,
    IconInfoCircleComponent, IconFolderComponent],
  templateUrl: './listado-categorias-productos.component.html',
  styleUrl: './listado-categorias-productos.component.css'
})
export class ListadoCategoriasProductosComponent implements OnInit, OnDestroy {

  store: any;
  private subscription: Subscription = new Subscription();

  actual_role: string = '';

  categorias: any[] = [];
  categoriaForm!: FormGroup;
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
  };
  showFilter: boolean = false;
  ordenamiento: any = {
    name: 'asc'
  };

  breadcrumbs: any[] = [];

  iconArrowUp = faArrowUp;
  iconArrowDown = faArrowDown;

  // Referencia al modal para crear y editar países.
  @ViewChild('modalCategoria') modalCategoria!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  constructor(public storeData: Store<any>, private swalService: SwalService, private _indexService: IndexService,
    private _categoriaService: CategoriasService, private spinner: NgxSpinnerService, private tokenService: TokenService) {
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
    this.obtenerCategorias();
  }

  obtenerCategorias(categoria?: any) {
    // Si tiene ubicación es porque ingreso por ícono de sub ubicaciones.
    if (categoria) {
      this.locationToGo = categoria;
      this.busqueda_global = false;
      if (this.filtros.name) {
        // Si ingresa acá es porque entró desde "Mostrar sububicaciones" por lo que se borra el filtro nombre para traer todos los datos.
        this.filtros.name = '';
      }
    }
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = ["product_category", "product_categories"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;

    if (this.locationToGo) {
      this.filtros.product_category_uuid = this.locationToGo.uuid;
    } else {
      this.filtros.product_category_uuid = null;
    }
    // Si filtra y es global eliminamos el uuid
    if (this.filtros.name && this.busqueda_global) {
      delete this.filtros.product_category_uuid;
    }
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getCategoriasProductoWithParam(params, this.actual_role).subscribe({
        next: res => {
          this.categorias = res.data;
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
    if (this.categorias.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }

  openModalNuevaCategoria(type: string, categoria?: any) {
    if (this.breadcrumbs.length < 4) {
      if (type === 'NEW') {
        this.isEdicion = false;
        this.tituloModal = 'Nueva categoria';
        this.categoriaForm = new FormGroup({
          nombre: new FormControl(null, [Validators.required]),
          abreviatura: new FormControl(null, [Validators.required]),
        });
      } else {
        this.isEdicion = true;
        this.tituloModal = 'Edición categoria';
        this.categoriaForm = new FormGroup({
          uuid: new FormControl(categoria?.uuid, []),
          nombre: new FormControl(categoria?.name, [Validators.required]),
          abreviatura: new FormControl(categoria?.abbreviation, [Validators.required]),
        });
      }
      this.modalCategoria.options = this.modalOptions;
      this.modalCategoria.open();
    } else {
      this.swalService.toastError('top-right', 'No es posible agregar categoria en este nivel.');
    }
  }

  confirmarCategoria() {
    this.isSubmit = true;
    if (this.categoriaForm.valid) {
      this.spinner.show();
      let categoria = new CategoriaDTO();
      categoria.name = this.categoriaForm.get('nombre')?.value;
      categoria.abbreviation = this.categoriaForm.get('abreviatura')?.value;
      categoria.actual_role = this.actual_role;
      if (!this.isEdicion) {
        // Chequear si está en raíz o en sububicación para saber donde guardar.
        if (this.breadcrumbs.length > 0) {
          categoria.product_category_uuid = this.breadcrumbs[this.breadcrumbs.length - 1].uuid;
        }
        this.subscription.add(
          this._categoriaService.saveCategoria(categoria).subscribe({
            next: res => {
              if (this.breadcrumbs.length > 0) {
                this.locationToGo = this.breadcrumbs[this.breadcrumbs.length - 1];
                this.obtenerCategorias();
              } else {
                this.locationToGo = null;
                this.obtenerCategorias();
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
          this._categoriaService.editCategoria(this.categoriaForm.get('uuid')?.value, categoria).subscribe({
            next: res => {
              const index = this.categorias.findIndex(p => p.uuid === (this.categoriaForm.get('uuid')?.value));
              if (index !== -1) {
                this.categorias[index] = { 
                  ...this.categorias[index], 
                  name: this.categoriaForm.get('nombre')?.value,
                  abbreviation: this.categoriaForm.get('abreviatura')?.value };
                this.categorias = [...this.categorias];
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
    this.modalCategoria.close();
  }

  openSwalEliminar(categoria: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar la categoria ${categoria.name}?`,
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
        this.eliminarCategoria(categoria);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarCategoria(categoria: any) {
    this.spinner.show();
    this.subscription.add(
      this._categoriaService.eliminarCategoria(categoria.uuid, this.actual_role.toUpperCase()).subscribe({
        next: res => {
          if (this.breadcrumbs.length > 0) {
            this.locationToGo = this.breadcrumbs[this.breadcrumbs.length - 1];
            this.obtenerCategorias();
          } else {
            this.locationToGo = null;
            this.obtenerCategorias();
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
        this.obtenerCategorias();
      } else {
        this.locationToGo = null;
        this.obtenerCategorias();
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
      this.obtenerCategorias();
    } else {
      this.locationToGo = null;
      this.obtenerCategorias();
    }
  }


  getParentsFromLocation(ubicacion: any) {
    this.subscription.add(
      this._categoriaService.showCategoriaWithParent(ubicacion.uuid, this.actual_role).subscribe({
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
      actual = actual.product_category; // Pasamos a su padre
    }
    return breadcrumb;
  }

  goToLocation(index: number): void {
    if (index === -1 && this.breadcrumbs.length > 0) {
      this.breadcrumbs = [];
      this.locationToGo = null;
      this.obtenerCategorias();
    } else {
      if ((index + 1) === this.breadcrumbs.length) {
        //Está parado en el último elemento por lo que no hace nada.
      } else {
        // Mantiene los breadcrumbs hasta el índice seleccionado (incluido)
        this.breadcrumbs = this.breadcrumbs.slice(0, index + 1);
        // Llama al servicio para cargar las ubicaciones correspondientes al breadcrumb seleccionado
        const selectedBreadcrumb = this.breadcrumbs[index];
        if (selectedBreadcrumb) {
          this.obtenerCategorias(selectedBreadcrumb);
        }
      }
    }
  }

  cambiarTipoBusqueda() {
    if (this.filtros.name) {
      // this.isFiltrando = true;
      this.obtenerCategorias(null);
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