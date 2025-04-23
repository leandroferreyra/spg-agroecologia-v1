import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription, forkJoin } from 'rxjs';
import { ComponenteDTO } from 'src/app/core/models/request/componenteDTO';
import { ReemplazoDTO } from 'src/app/core/models/request/reemplazoDTO';
import { ComponentesService } from 'src/app/core/services/componentes.service';
import { IndexService } from 'src/app/core/services/index.service';
import { ReemplazoService } from 'src/app/core/services/reemplazos.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconCircleCheckComponent } from 'src/app/shared/icon/icon-circle-check';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reemplazos',
  standalone: true,
  imports: [CommonModule, NgbPaginationModule, NgxSpinnerModule, NgxTippyModule, NgxCustomModalComponent, FormsModule, ReactiveFormsModule,
    NgSelectModule, IconTrashLinesComponent, IconPencilComponent, IconSearchComponent, IconPlusComponent, IconCircleCheckComponent],
  templateUrl: './reemplazos.component.html',
  styleUrl: './reemplazos.component.css'
})
export class ReemplazosComponent implements OnInit, OnDestroy {


  @Output() eventProducto = new EventEmitter<any>();

  @Input() producto: any;
  @Input() rol!: string;
  reemplazos: any[] = [];

  private subscription: Subscription = new Subscription();

  // Orden, filtro y paginación para compras de proveedor
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;

  filtros: any = {
    'product_uuid': { value: '', op: '=', contiene: false },
  };
  showFilterCompras: boolean = false;
  ordenamiento: any = {
  };

  reemplazoForm!: FormGroup;
  tituloModal: string = '';
  isSubmit = false;
  isEdicion = false;

  // Referencia al modal para crear y editar países.
  @ViewChild('modalReemplazos') modalReemplazos!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  // Catalogos
  proveedores: any[] = [];
  productos: any[] = [];
  procesos: any[] = [];

  placeholderCantidad: string = '';

  procesoActivo: any;
  isEdicionProceso: boolean = false;

  constructor(private _indexService: IndexService, private _swalService: SwalService, private spinner: NgxSpinnerService,
    private _tokenService: TokenService, private _reemplazoService: ReemplazoService) {
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['producto'] && changes['producto'].currentValue) {
      this.spinner.show();
      // Si el producto cambia, actualizamos los filtros y obtenemos los componentes
      this.filtros['product_uuid'].value = this.producto.uuid;
      this.obtenerReemplazos();
      // this.obtenerCatalogos();
    }
  }

  obtenerReemplazos() {
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = ["product", "replacement"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getReemplazosWithParam(params, this.rol).subscribe({
        next: res => {
          this.reemplazos = res.data;
          this.modificarPaginacion(res);
          this._tokenService.setToken(res.token);
          this.obtenerCatalogos();
          this.spinner.hide();
        },
        error: error => {
          this._swalService.toastError('top-right', error.error.message);
          console.error(error);
          this.spinner.hide();
        }
      })
    )
  }

  modificarPaginacion(res: any) {
    this.total_rows = res.meta.total;
    this.last_page = res.meta.last_page;
    if (this.reemplazos.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }


  obtenerCatalogos() {
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = ["productType", "measure"];
    params.paging = null;
    params.page = null;
    params.order_by = {};
    params.filters = {
      'uuid': { value: this.producto.uuid, op: '!=', contiene: false },
    };

    forkJoin({
      productos: this._indexService.getProductosPosiblesWithParam(params, this.rol, this.producto.uuid),
    }).subscribe({
      next: res => {
        this.productos = res.productos.data;
        this.productos = this.productos.map(p => ({
          ...p,
          disabled: this.disableProducto(p) // Solo deshabilita el que coincide
        }));

      },
      error: error => {
        console.error('Error cargando catalogos:', error);
      }
    });
  }

  disableProducto = (item: any): boolean => {
    return (item.uuid === this.producto.uuid) || this.esComponente(item);
  };

  esComponente(item: any) {
    if (this.reemplazos.length > 0) {
      const idsComponentes = new Set(this.reemplazos.map(c => c.replacement.uuid));
      return idsComponentes.has(item.uuid)
    }
    return false;
  }

  openModalReemplazos(type: string, dato?: any) {
    if (type === 'NEW') {
      this.isEdicion = false;
      this.tituloModal = 'Nuevo reemplazo';
      this.reemplazoForm = new FormGroup({
        replacement_uuid: new FormControl(null, Validators.required)
      });
    } else {
      this.isEdicion = true;
      this.tituloModal = 'Edición reemplazo';
      this.placeholderCantidad = 'Cantidad en ' + dato.child_product.measure?.name;
      this.reemplazoForm = new FormGroup({
        uuid: new FormControl(dato.uuid),
        parent_product_uuid: new FormControl(this.producto.uuid, Validators.required),
        replacement_uuid: new FormControl(dato.child_product?.uuid, [])
      });
    }
    this.onFormChange();
    this.modalReemplazos.options = this.modalOptions;
    this.modalReemplazos.open();
  }

  onFormChange() {

  }


  cerrarModal() {
    this.isSubmit = false;
    this.placeholderCantidad = '';
    this.modalReemplazos.close();
  }

  confirmarReemplazo() {
    this.isSubmit = true;
    if (this.reemplazoForm.valid) {
      this.spinner.show();
      let reemplazo = new ReemplazoDTO();
      this.armarDTOReemplazo(reemplazo);
      if (!this.isEdicion) {
        this.subscription.add(
          this._reemplazoService.saveReemplazo(reemplazo).subscribe({
            next: res => {
              this.spinner.hide();
              this.obtenerReemplazos();
              this.cerrarModal();
            },
            error: error => {
              this.spinner.hide();
              this._swalService.toastError('top-right', error.error.message)
              console.error(error);
            }
          })
        )
      } else {
        this.subscription.add(
          this._reemplazoService.editReemplazo(this.reemplazoForm.get('uuid')?.value, reemplazo).subscribe({
            next: res => {
              this.obtenerReemplazos();
              this.isEdicion = false;
              this.cerrarModal();
              this._swalService.toastSuccess('top-right', "Usuario actualizado.");
              this.spinner.hide();
            },
            error: error => {
              this.spinner.hide();
              this._swalService.toastError('top-right', error.error.message);
              console.error(error);
            }
          })
        )
      }
    }
  }
  armarDTOReemplazo(reemplazo: ReemplazoDTO) {
    reemplazo.actual_role = this.rol;
    reemplazo.with = [];
    reemplazo.product_uuid = this.producto.uuid;
    reemplazo['product->replacement_uuid'] = this.reemplazoForm.get('replacement_uuid')?.value;
    if (!this.isEdicion) {
      this.cleanObject(reemplazo);
    }
  }
  // Se eliminan los nulos.
  private cleanObject(obj: any): void {
    Object.keys(obj).forEach(key => {
      if (obj[key] && typeof obj[key] === 'object') {
        this.cleanObject(obj[key]); // Limpiar objetos anidados
      }
      if (obj[key] == null) {
        delete obj[key]; // Eliminar propiedades nulas o undefined
      }
    });
  }

  openSwalEliminar(reemplazo: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar el reemplazo ${reemplazo.replacement.name}?`,
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
        this.eliminarReemplazo(reemplazo);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarReemplazo(reemplazo: any) {
    this.spinner.show();
    this.subscription.add(
      this._reemplazoService.deleteReemplazo(reemplazo.uuid, this.rol.toUpperCase()).subscribe({
        next: res => {
          this.obtenerReemplazos();
          this._tokenService.setToken(res.token);
          this.spinner.hide();
        },
        error: error => {
          console.error(error);
          this._swalService.toastError('top-right', error.error.message);
          this.spinner.hide();
        }
      })
    )
  }

  goToProduct(data: any) {
    this.eventProducto.emit(data);
  }

}
