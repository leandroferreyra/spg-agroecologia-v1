import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { FrozenComponentDTO } from 'src/app/core/models/request/frozenComponentDTO';
import { FrozenComponentService } from 'src/app/core/services/frozenComponents.service';
import { IndexService } from 'src/app/core/services/index.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconRefreshComponent } from 'src/app/shared/icon/icon-refresh';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-componentes-produccion',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule, IconPlusComponent, NgSelectModule, FormsModule, ReactiveFormsModule, NgbPaginationModule,
    IconTrashLinesComponent, IconRefreshComponent, IconPencilComponent, NgxTippyModule, NgxCustomModalComponent],
  templateUrl: './componentes-produccion.component.html',
  styleUrl: './componentes-produccion.component.css'
})
export class ComponentesProduccionComponent implements OnInit, OnDestroy {

  @Input() produccion: any;
  @Input() rol!: string;
  private subscription: Subscription = new Subscription();

  @ViewChild('modalComponente') modalComponente!: NgxCustomModalComponent;
  @ViewChild('modalReemplazo') modalReemplazo!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };
  tituloModal: string = '';

  componentes: any[] = [];
  selectedComponent: any;
  componenteForm!: FormGroup;

  reemplazos: any[] = []
  reemplazoForm!: FormGroup;

  filtros: any = {
    'production_uuid': { value: '', op: '=', contiene: false },
  };
  ordenamiento: any = {
    'order': 'asc'
  };

  // Orden, filtro y paginación para compras de proveedor
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;

  isSubmit = false;

  origenes: any[] = [
    { key: 'lote', label: 'Lote', tieneSelect: true },
    { key: 'terceros', label: 'Provisto por terceros', tieneSelect: true },
    { key: 'ss', label: 'Sin selección', tieneSelect: false }
  ];
  stocks: any[] = [];
  proveedores: any[] = [];


  constructor(private spinner: NgxSpinnerService, private _indexService: IndexService, private _tokenService: TokenService,
    private _swalService: SwalService, private _frozenComponentService: FrozenComponentService) {

  }

  ngOnInit(): void {

  }
  ngOnDestroy(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['produccion'] && changes['produccion'].currentValue) {
      this.spinner.show();
      // Si la produccion cambia, actualizamos los filtros y obtenemos los componentes
      this.filtros['production_uuid'].value = this.produccion.uuid;
      this.obtenerComponentesProduccion();
    }
  }

  obtenerComponentesProduccion() {
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = ["productType", "measure", "stock", "supplier", "possibleStocks.batch"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getFrozenComponentsWithParam(params, this.rol).subscribe({
        next: res => {
          this.componentes = res.data;
          // console.log("🚀 ~ ComponentesProduccionComponent ~ obtenerComponentesProduccion ~ this.componentes:", this.componentes)
          this.modificarPaginacion(res);
          this._tokenService.setToken(res.token);
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
    if (this.componentes.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }

  getCantidadStockByComponent(stock: any) {
    if (this.selectedComponent.measure?.is_integer === 1) {
      return +(+stock.total_amount)?.toFixed(0);
    } else {
      return +(+stock.total_amount)?.toFixed(2);
    }
  }

  getProduccionMaxima(stock: any) {
    return Math.floor(+stock.total_amount / +this.produccion.quantity);
  }

  showName(stock: any) {
    return stock.batch ? stock.batch.batch_identification : 'Lote único';
  }

  getCantidad(data: any) {
    if (data.measure?.is_integer === 1) {
      return (+data.quantity)?.toFixed(0);
    } else {
      return (+data.quantity)?.toFixed(2);
    }
  }

  getCantidadTotal(data: any) {
    let total = +this.produccion.quantity * +data.quantity;
    if (data.measure?.is_integer === 1) {
      return +(total)?.toFixed(0);
    } else {
      return +(total)?.toFixed(2);
    }
  }

  getOrigen(data: any) {
    if (data.product_type?.stock_controlled === 0) {
      return 'Sin control de stock';
    }
    if (data.product_type?.stock_controlled === 1 && data.traceable === 0) {
      // console.log('STOCK ÚNICO');
      // return 'Stock unico';
    }
    if (data.product_type?.stock_controlled === 1 && data.traceable === 1) {
      // console.log('N LOTES');
      // return 'N Stocks';
      // (aclaración: los stocks que se muestran son los que tienen cantidad disponible suficiente, es decir total_amount >= Cantidad total necesaria, 
      // pero los que se permiten seleccionar son que tienen cantidad disponible > 0)
    }
    return data.origin;
  }

  isAllowEdit(data: any) {
    if (data.product_type?.stock_controlled === 0) {
      return false;
    }
    return true;
  }

  openSwalEliminar(componente: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar el componente de producción ${componente.name}?`,
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
        this.eliminarComponente(componente);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarComponente(producto: any) {
    this.spinner.show();
    this.subscription.add(
      this._frozenComponentService.deleteComponent(producto.uuid, this.rol.toUpperCase()).subscribe({
        next: res => {
          this.obtenerComponentesProduccion();
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

  openModalComponente(data: any) {
    this.selectedComponent = data;
    this.obtenerProveedoresByComponente(data.uuid);
    this.stocks = (data.possible_stocks || []).map((stock: any) => ({
      ...stock,
      // nombreCompleto: this.armarStock(data, stock),
      disabled: +stock.total_amount < +this.getCantidadTotal(data)
    }));
    this.tituloModal = `Selección de origen de "${data.name}"`;
    this.inicializarFormComponente(data);
    this.modalComponente.options = this.modalOptions;
    this.modalComponente.open();
  }

  cerrarModal() {
    this.isSubmit = false;
    this.modalComponente.close();
  }


  // armarStock(componente: any, stock: any) {
  //   let amount;
  //   if (componente.measure?.is_integer === 1) {
  //     amount = (+stock.total_amount).toFixed(0);
  //   } else {
  //     amount = (+stock.total_amount).toFixed(2);
  //   }
  //   return `${stock.batch != null ? stock.batch.batch_identification : "Lote único"} | ${amount}`;
  // }

  inicializarFormComponente(data: any) {
    this.componenteForm = new FormGroup({
      uuid: new FormControl({ value: data ? data.uuid : null, disabled: false }, []),
      origin: new FormControl({ value: data ? data.origin : null, disabled: false }, []),
      stock_uuid: new FormControl({ value: data ? data.stock?.uuid : null, disabled: false }, []),
      supplier_uuid: new FormControl({ value: data ? data.supplier?.uuid : null, disabled: false }, []),
      note: new FormControl({ value: data ? data.note : null, disabled: false }, []),
    })
  }

  obtenerProveedoresByComponente(uuid: string) {
    const params: any = {};
    params.with = [];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = {};
    params.filters = {
      'products.uuid': { value: uuid, op: '=', contiene: false },
    };
    this.subscription.add(
      this._indexService.getProveedoresWithParam(params, this.rol).subscribe({
        next: res => {
          this.proveedores = res.data;
          this._tokenService.setToken(res.token);
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

  confirmarComponente() {
    this.isSubmit = true;
    if (this.componenteForm.valid) {
      this.spinner.show();
      let componente = new FrozenComponentDTO();
      this.armarDTOComponente(componente);
      this.subscription.add(
        this._frozenComponentService.editComponente(this.componenteForm.get('uuid')?.value, componente).subscribe({
          next: res => {
            // console.log(res);
            this.obtenerComponentesProduccion();
            this.cerrarModal();
            this.spinner.hide();
          },
          error: error => {
            this.spinner.hide();
            console.error(error);
            this._swalService.toastError('top-right', error.error.message);
          }
        })
      );
    }
  }

  armarDTOComponente(componente: FrozenComponentDTO) {
    componente.actual_role = this.rol;
    componente.origin = this.componenteForm.get('origin')?.value;
    componente.stock_uuid = this.componenteForm.get('stock_uuid')?.value;
    componente.supplier_uuid = this.componenteForm.get('supplier_uuid')?.value;
    componente.note = this.componenteForm.get('note')?.value;
  }

  switchOrigen(origen: any, event: Event, stock?: any) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.componenteForm.get('origin')?.setValue(origen);
      if (origen === 'Provisto por terceros') {
        this.componenteForm.get('supplier_uuid')?.setValidators(Validators.required);
        this.componenteForm.get('stock_uuid')?.clearValidators();
        this.componenteForm.get('stock_uuid')?.setValue(null);
      } else if (origen === 'Lote') {
        this.componenteForm.get('stock_uuid')?.setValidators(Validators.required);
        this.componenteForm.get('supplier_uuid')?.clearValidators();
        this.componenteForm.get('stock_uuid')?.setValue(stock.uuid);
      } else if (origen === 'Sin selección') {
        this.componenteForm.get('supplier_uuid')?.clearValidators();
        this.componenteForm.get('stock_uuid')?.clearValidators();
        this.componenteForm.get('stock_uuid')?.setValue(null);
      }
    } else {
      this.componenteForm.get('origin')?.setValue(null);
      this.componenteForm.get('supplier_uuid')?.clearValidators();
      this.componenteForm.get('stock_uuid')?.clearValidators();
      this.componenteForm.get('stock_uuid')?.setValue(null);

    }
    ['supplier_uuid', 'stock_uuid'].forEach((field) => {
      this.componenteForm.get(field)?.updateValueAndValidity({ emitEvent: false });
    });
  }

  openModalReemplazos(data: any) {
    this.obtenerReemplazos(data);
    this.inicializarFormReemplazo();
    this.tituloModal = 'Seleccionar reemplazo';
    this.modalReemplazo.options = this.modalOptions;
    this.modalReemplazo.open();
  }
  cerrarModalReemplazo() {
    this.isSubmit = false;
    this.modalReemplazo.close();
  }

  inicializarFormReemplazo() {
    this.reemplazoForm = new FormGroup({
      uuid: new FormControl({ value: null, disabled: false }, [Validators.required])
    })
  }

  obtenerReemplazos(data: any) {
    const params: any = {};
    params.with = ["product", "replacement"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = {
      'product_uuid': { value: data.uuid, op: '=', contiene: false },
    }
    this.subscription.add(
      this._indexService.getReemplazosWithParam(params, this.rol).subscribe({
        next: res => {
          this.reemplazos = res.data;
          this._tokenService.setToken(res.token);
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

  confirmarReemplazo() {
    this.isSubmit = true;
    if (this.reemplazoForm.valid) {

    }
    // console.log(this.reemplazoForm);
  }

}
