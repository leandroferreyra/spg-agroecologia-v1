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
import { TipoProductoDTO } from 'src/app/core/models/request/tipoProductoDTO';
import { IndexService } from 'src/app/core/services/index.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TipoProductoService } from 'src/app/core/services/tipoProducto.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';
import { ColorSketchModule } from 'ngx-color/sketch';
import { NgSelectModule } from '@ng-select/ng-select';
import { GastosDTO } from 'src/app/core/models/request/gastosDTO';

@Component({
  selector: 'app-listado-tipos-de-productos',
  standalone: true,
  imports: [CommonModule, NgxCustomModalComponent, NgxTippyModule, DataTableModule, NgxSpinnerModule, FormsModule, ReactiveFormsModule,
    IconPlusComponent, IconPencilComponent, IconTrashLinesComponent, NgbPagination, IconSearchComponent, FontAwesomeModule, ColorSketchModule,
    NgSelectModule],
  templateUrl: './listado-tipos-de-productos.component.html',
  styleUrl: './listado-tipos-de-productos.component.css'
})
export class ListadoTiposDeProductosComponent implements OnInit, OnDestroy {

  store: any;
  private subscription: Subscription = new Subscription();
  actual_role: string = '';

  color: string = '';
  showPicker: boolean = false; tiposProductos: any[] = [];

  tiposProductosForm!: FormGroup;
  gastosForm!: FormGroup;
  tituloModal: string = '';
  isSubmit = false;
  isEdicion = false;

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
    'name': { value: '', op: 'LIKE', contiene: true },
    'code': { value: '', op: 'LIKE', contiene: true },
    'is_process': { value: '', op: '=', contiene: false },
    'product_compound': { value: '', op: '=', contiene: false },
    'product_must_be_traceable': { value: '', op: '=', contiene: false },
    'stock_controlled': { value: '', op: '=', contiene: false },
    'can_be_provided': { value: '', op: '=', contiene: false },
    'can_be_purchased': { value: '', op: '=', contiene: false },
    'can_be_produced': { value: '', op: '=', contiene: false }
  };
  showFilter: boolean = false;
  ordenamiento: any = {
    'name': 'asc',
    'code': 'asc'
  };

  opcionesSiNo = [
    { label: '', value: '' },
    { label: 'Sí', value: "1" },
    { label: 'No', value: "0" },
  ];

  iconArrowUp = faArrowUp;
  iconArrowDown = faArrowDown;

  // Referencia al modal para crear y editar países.
  @ViewChild('modalTipoProductos') modalTipoProductos!: NgxCustomModalComponent;
  @ViewChild('modalCostos') modalCostos!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  constructor(public storeData: Store<any>, private swalService: SwalService, private _indexService: IndexService,
    private _tipoProductoService: TipoProductoService, private spinner: NgxSpinnerService, private tokenService: TokenService) {
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
    this.obtenerTiposProductos();
  }

  obtenerTiposProductos() {
    this.spinner.show();
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = ["costParam"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getTiposProductosWithParams(params, this.actual_role).subscribe({
        next: res => {
          this.spinner.hide();
          this.tiposProductos = res.data;
          // console.log("🚀 ~ ListadoTiposDeProductosComponent ~ obtenerTiposProductos ~ this.tiposProductos:", this.tiposProductos)
          this.modificarPaginacion(res);
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
    if (this.tiposProductos.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }

  openModalNuevoTipo(type: string, tipoProducto?: any) {
    if (type === 'NEW') {
      this.isEdicion = false;
      this.tituloModal = 'Nuevo tipo de producto';
      this.inicializarForm();
    } else {
      this.isEdicion = true;
      this.tituloModal = 'Edición tipo de producto';
      this.inicializarForm(tipoProducto);
    }
    this.modalTipoProductos.options = this.modalOptions;
    this.modalTipoProductos.open();
  }
  inicializarForm(tipoProducto?: any) {
    this.tiposProductosForm = new FormGroup({
      uuid: new FormControl(tipoProducto ? tipoProducto.uuid : null, []),
      name: new FormControl(tipoProducto ? tipoProducto.name : null, [Validators.required]),
      code: new FormControl(tipoProducto ? tipoProducto.code : null, [Validators.required]),
      is_process: new FormControl(tipoProducto ? tipoProducto.is_process : false, []),
      description: new FormControl(tipoProducto ? tipoProducto.description : null, []),
      color: new FormControl(tipoProducto ? tipoProducto.color : null, [Validators.required]),
      product_compound: new FormControl(tipoProducto ? tipoProducto.product_compound : false, [Validators.required]),
      product_must_be_traceable: new FormControl(tipoProducto ? tipoProducto.product_must_be_traceable : false, [Validators.required]),
      stock_controlled: new FormControl(tipoProducto ? tipoProducto.stock_controlled : false, [Validators.required]),
      can_be_provided: new FormControl(tipoProducto ? tipoProducto.can_be_provided : false, [Validators.required]),
      can_be_purchased: new FormControl(tipoProducto ? tipoProducto.can_be_purchased : false, [Validators.required]),
      can_be_produced: new FormControl(tipoProducto ? tipoProducto.can_be_produced : false, [Validators.required]),
    });
    this.onFormChange();
  }

  onFormChange() {
    const fieldsToWatch = [
      'product_compound',
      'product_must_be_traceable',
      'stock_controlled',
      'can_be_provided',
      'can_be_purchased',
      'can_be_produced'
    ];

    fieldsToWatch.forEach(field => {
      this.tiposProductosForm.get(field)!.valueChanges.subscribe(value => {
        if (value) {
          this.tiposProductosForm.get('is_process')?.setValue(false, { emitEvent: false });
        }
        if (value && field === 'product_must_be_traceable') {
          this.tiposProductosForm.get('stock_controlled')?.setValue(true, { emitEvent: false });
        }
        if (value && field === 'can_be_produced') {
          this.tiposProductosForm.get('product_compound')?.setValue(true, { emitEvent: false });
        }
        if (!value && field === 'stock_controlled') {
          this.tiposProductosForm.get('product_must_be_traceable')?.setValue(false, { emitEvent: false });
        }
        if (!value && field === 'product_compound') {
          this.tiposProductosForm.get('can_be_produced')?.setValue(false, { emitEvent: false });
        }
      });
    });

    this.tiposProductosForm.get('is_process')!.valueChanges.subscribe(value => {
      if (value) {
        fieldsToWatch.forEach(field => {
          this.tiposProductosForm.get(field)?.setValue(false, { emitEvent: false });
        });
      }
    });
  }

  confirmarTipoProducto() {
    this.isSubmit = true;
    if (this.tiposProductosForm.valid) {
      this.spinner.show();
      let tipo = new TipoProductoDTO();
      this.armarDTOTipoProducto(tipo);
      if (!this.isEdicion) {
        this.subscription.add(
          this._tipoProductoService.saveTipoProducto(tipo).subscribe({
            next: res => {
              this.obtenerTiposProductos();
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
          this._tipoProductoService.editTipoProducto(this.tiposProductosForm.get('uuid')?.value, tipo).subscribe({
            next: res => {
              this.obtenerTiposProductos();
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

  armarDTOTipoProducto(tipo: TipoProductoDTO) {
    tipo.actual_role = this.actual_role;
    tipo.with = [];
    tipo.name = this.tiposProductosForm.get('name')?.value;
    tipo.code = this.tiposProductosForm.get('code')?.value;
    tipo.is_process = this.tiposProductosForm.get('is_process')?.value;
    tipo.description = this.tiposProductosForm.get('description')?.value;
    tipo.color = this.tiposProductosForm.get('color')?.value;
    tipo.product_compound = this.tiposProductosForm.get('product_compound')?.value;
    tipo.product_must_be_traceable = this.tiposProductosForm.get('product_must_be_traceable')?.value;
    tipo.stock_controlled = this.tiposProductosForm.get('stock_controlled')?.value;
    tipo.can_be_provided = this.tiposProductosForm.get('can_be_provided')?.value;
    tipo.can_be_purchased = this.tiposProductosForm.get('can_be_purchased')?.value;
    tipo.can_be_produced = this.tiposProductosForm.get('can_be_produced')?.value;
  }

  cerrarModal() {
    this.isSubmit = false;
    this.modalTipoProductos.close();
  }

  openSwalEliminar(tipo: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar el tipo de producto ${tipo.name}?`,
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
        this.eliminarTipo(tipo);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarTipo(tipo: any) {
    this.spinner.show();
    this.subscription.add(
      this._tipoProductoService.deleteTipoProducto(tipo.uuid, this.actual_role.toUpperCase()).subscribe({
        next: res => {
          this.obtenerTiposProductos();
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
        'name': { value: '', op: 'LIKE', contiene: true },
        'code': { value: '', op: 'LIKE', contiene: true },
        'is_process': { value: '', op: '=', contiene: false },
        'product_compound': { value: '', op: '=', contiene: false },
        'product_must_be_traceable': { value: '', op: '=', contiene: false },
        'stock_controlled': { value: '', op: '=', contiene: false },
        'can_be_provided': { value: '', op: '=', contiene: false },
        'can_be_purchased': { value: '', op: '=', contiene: false },
        'can_be_produced': { value: '', op: '=', contiene: false },
      };
      this.obtenerTiposProductos();
    }
  }

  cambiarOrdenamiento(column: string) {
    // si el ordenamiento es asc, lo cambiamos a desc y si es desc, lo cambiamos a sin ordenamiento
    if (this.ordenamiento[column] === 'asc') {
      this.ordenamiento[column] = 'desc';
    } else if (this.ordenamiento[column] === 'desc') {
      this.ordenamiento[column] = 'asc';
    }
    this.obtenerTiposProductos();
  }


  togglePicker() {
    this.showPicker = !this.showPicker;
  }

  onColorChange(event: any) {
    this.color = event.color.hex;
    this.showPicker = false;
  }

  isProcesoIPLadie(data: any) {
    return data.name === 'Procesos IP LADIE';
  }

  openModalCostos(data: any) {
    this.modalCostos.options = this.modalOptions;
    this.modalCostos.open();
    this.tituloModal = 'Edición de parámetros de costos'
    this.inicializarFormGastos(data);
  }

  inicializarFormGastos(data: any) {
    this.gastosForm = new FormGroup({
      uuidTipoProducto: new FormControl(data.uuid, [Validators.required]),
      cantidadCompras: new FormControl(data.cost_param ? data.cost_param.purchases_quantity : null, [Validators.required, Validators.min(1)]),
      funcionCalculo: new FormControl(data.cost_param ? data.cost_param.calculation_function : null, [Validators.required]),
    });
    this.onChangeGastosForm();
  }
  onChangeGastosForm() {

  }

  cerrarModalCostos() {
    this.isSubmit = false;
    this.modalCostos.close();
  }

  confirmarCostos() {
    this.isSubmit = true;
    if (this.gastosForm.valid) {
      this.spinner.show();
      let gastos = new GastosDTO();
      gastos.actual_role = this.actual_role;
      gastos.purchases_quantity = this.gastosForm.get('cantidadCompras')?.value;
      gastos.calculation_function = this.gastosForm.get('funcionCalculo')?.value;
      this.subscription.add(
        this._tipoProductoService.editarParametrosCalculo(this.gastosForm.get('uuidTipoProducto')?.value, gastos).subscribe({
          next: res => {
            this.spinner.hide();
            this.cerrarModalCostos();
            this.obtenerTiposProductos();
          },
          error: error => {
            console.error(error);
            this.spinner.hide();
            this.swalService.toastError('top-right', error.error.message);
          }
        })
      );
    }
  }

}
