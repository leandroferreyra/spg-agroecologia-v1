import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowUp, faArrowDown, faArrowLeft, faC } from '@fortawesome/free-solid-svg-icons';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { Store } from '@ngrx/store';
import { MenuModule } from 'headlessui-angular';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription, forkJoin } from 'rxjs';
import { ProductoDTO, ProductState } from 'src/app/core/models/request/productoDTO';
import { CatalogoService } from 'src/app/core/services/catalogo.service';
import { IndexService } from 'src/app/core/services/index.service';
import { SwalService } from 'src/app/core/services/swal.service';
import Swal from 'sweetalert2';
import { TokenService } from 'src/app/core/services/token.service';
import { toggleAnimation } from 'src/app/shared/animations';
import { IconEditComponent } from 'src/app/shared/icon/icon-edit';
import { IconHorizontalDotsComponent } from 'src/app/shared/icon/icon-horizontal-dots';
import { IconMenuComponent } from 'src/app/shared/icon/icon-menu';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconSettingsComponent } from 'src/app/shared/icon/icon-settings';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import { IconUserComponent } from 'src/app/shared/icon/icon-user';
import { ComprasProveedorService } from 'src/app/core/services/comprasProveedor.service';
import { CompraProveedorDTO } from 'src/app/core/models/request/compraProveedorDTO';
import { FlatpickrDirective } from 'angularx-flatpickr';
import { ParametrosIndex } from 'src/app/core/models/request/parametrosIndex';

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgScrollbarModule, NgxTippyModule, IconMenuComponent, IconUserComponent,
    IconPlusComponent, IconSearchComponent, IconEditComponent, IconTrashLinesComponent, NgxCustomModalComponent, NgxSpinnerModule, IconSettingsComponent,
    NgSelectModule, IconHorizontalDotsComponent, MenuModule, FontAwesomeModule, NgbPaginationModule, FlatpickrDirective
  ],
  animations: [toggleAnimation],
  templateUrl: './compras.component.html',
  styleUrl: './compras.component.css'
})
export class ComprasComponent implements OnInit, OnDestroy {
  toggleDropdown = false;
  @ViewChild('offcanvasRight', { static: false }) offcanvasElement!: ElementRef;

  store: any;
  private subscription: Subscription = new Subscription();
  actual_role: string = '';
  compras: any[] = [];
  selectedCompra: any;
  compraForm!: FormGroup;
  newCompraForm!: FormGroup;

  cargandoProductos: boolean = true;
  filtroSimpleName: string = '';
  filtroSimpleContiene: boolean = true;
  filtroTipoPersona: string = 'todos';
  isEdicion: boolean = false;
  isShowMailMenu = false;
  isTabDisabled = false;

  //Paginación
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;

  // Orden y filtro
  params = new ParametrosIndex();
  filtroFechaTransacDesde!: string;
  filtroFechaTransacHasta!: string;
  filtroFechaFacturaDesde: string = '';
  filtroFechaFacturaHasta: string = '';
  filtros: any = {
    'operator': { value: '' },
    'transaction.person.human.lastname': { value: '', op: 'LIKE', contiene: true },
    'transaction.person.human.firstname': { value: '', op: 'LIKE', contiene: true },
    'transaction.person.legalEntity.company_name': { value: '', op: 'LIKE', contiene: true },
    'transaction.person.human.uuid': { value: '', op: '!=', contiene: false },
    'transaction.person.legalEntity.uuid': { value: '', op: '!=', contiene: false },
    'transaction.transactionDocuments.prefix_number': { value: '', op: 'LIKE', contiene: true },
    'transaction.transactionDocuments.document_number': { value: '', op: 'LIKE', contiene: true },
    'transaction.transactionProducts.product.uuid': { value: '', op: '=', contiene: false },
    'transaction.transactionDocuments.accountDocumentType.uuid': { value: '', op: '=', contiene: false },
    'batch.batch_identification': { value: '', op: 'LIKE', contiene: true },
    'batch.stocks.productInstances.serial_number': { value: '', op: 'LIKE', contiene: true },
  };
  ordenamiento: any = {
  };

  productosParaFiltro: [] = [];
  isSubmit = false;

  iconArrowUp = faArrowUp;
  iconArrowDown = faArrowDown;
  iconArrowLeft = faArrowLeft;

  tab1: string = 'datos-generales';

  // Referencia al modal para crear y editar países.
  @ViewChild('modalCompra') modalCompra!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };
  tituloModal: string = '';

  // Catalogos
  tiposDocumentosContables: any[] = [];

  constructor(public storeData: Store<any>, private swalService: SwalService, private _indexService: IndexService,
    private _comprasService: ComprasProveedorService, private spinner: NgxSpinnerService, private tokenService: TokenService,
    private _catalogoService: CatalogoService) {
    this.initStore();
  }

  async initStore() {
    this.storeData
      .select((d) => d.index)
      .subscribe((d) => {
        this.actual_role = d.userRole;
      });
  }

  ngAfterViewInit() {
    if (this.offcanvasElement) {
      this.offcanvasElement.nativeElement.addEventListener('hidden.bs.offcanvas', () => {
        // Aquí puedes ejecutar cualquier acción adicional al cierre
      });
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.spinner.show();
    this.obtenerCompras();
    this.obtenerProductosParaFiltro();
    this.obtenerCatalogos();
  }

  obtenerCompras(alta: boolean = false) {
    // El booleano 'alta' es para que cuando da de alta un nuevo registro, no entre a inicializar, sino siempre muestra el primero de 
    // la lista y no el que acabo de agregar.

    // Inicializamos un objeto vacío para los parámetros
    this.params.with = ["transaction.person.human", "transaction.person.legalEntity", "transaction.transactionDocuments.accountDocumentType", 'transaction.transactionProducts.product', 'batch', 'batch.stocks.productInstances'];
    this.params.paging = this.itemsPerPage;
    this.params.page = this.currentPage;
    this.params.order_by = this.ordenamiento;
    this.params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getComprasProveedorWithParam(this.params, this.actual_role).subscribe({
        next: res => {
          this.compras = res.data;
          console.log("🚀 ~ ComprasComponent ~ this._indexService.getComprasProveedorWithParam ~ this.compras:", this.compras)
          if (this.compras.length === 0) {
            this.swalService.toastSuccess('center', 'No existen compras.');
            this.isTabDisabled = true;
            this.tab1 = 'datos-generales';
          } else {
            this.isTabDisabled = false;
          }
          if (!alta && this.compras.length > 0) {
            this.isEdicion = false;
            this.obtenerCompraPorId(this.compras[0].uuid);
            // this.inicializarFormEdit(this.compras[0]);
          }
          this.modificarPaginacion(res);
          this.tokenService.setToken(res.token);
          this.spinner.hide();
        },
        error: error => {
          console.error(error);
          this.spinner.hide();
        }
      })
    )
  }
  modificarPaginacion(res: any) {
    this.total_rows = res.meta.total;
    this.last_page = res.meta.last_page;
    if (this.compras.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }

  obtenerCompraPorId(uuid: string) {
    this.subscription.add(
      this._comprasService.getCompraById(uuid, this.actual_role).subscribe({
        next: res => {
          // console.log(res);
        },
        error: error => {
          this.swalService.toastError('top-right', error.error.message);
          console.error(error);
        }
      })
    )
  }

  obtenerProductosParaFiltro() {

    const paramsProcesos: any = {};
    paramsProcesos.with = [];
    paramsProcesos.paging = null;
    paramsProcesos.page = null;
    paramsProcesos.order_by = {};
    paramsProcesos.filters = {};

    this.subscription.add(
      this._indexService.getProductosWithParam(paramsProcesos, this.actual_role).subscribe({
        next: res => {
          this.productosParaFiltro = res.data;
          this.cargandoProductos = false;
        },
        error: error => {
          this.cargandoProductos = false;
          this.swalService.toastError('top-right', error.error.message);
          console.error(error);
          this.spinner.hide();
        }
      })
    )
  }

  obtenerCatalogos() {
    forkJoin({
      tiposDocumentosContables: this._catalogoService.getTiposDocumentosContables(this.actual_role)
    }).subscribe({
      next: res => {
        this.tiposDocumentosContables = res.tiposDocumentosContables.data;

      },
      error: error => {
        console.error('Error cargando catalogos:', error);
      }
    });
  }

  getNombreProveedor(proveedor: any): string {
    if (!proveedor || !proveedor.person) return '';
    if (proveedor.person?.human) {
      return proveedor.person?.human?.firstname + ' ' + proveedor.person?.human?.lastname;
    } else if (proveedor.person?.legal_entity) {
      return proveedor.person?.legal_entity?.company_name;
    }
    return ''; // En caso de que no tenga ninguno de los dos
  }

  inicializarFormEdit(producto: any) {
    this.selectedCompra = producto;
    this.compraForm = new FormGroup({
      nombre: new FormControl({ value: producto?.name, disabled: !this.isEdicion }, [Validators.required]),
      codigo: new FormControl({ value: producto?.code, disabled: !this.isEdicion }, []),
      tipoProducto: new FormControl({ value: producto?.product_type?.uuid, disabled: !this.isEdicion }, [Validators.required]),
      categoria: new FormControl({ value: producto?.product_category?.uuid, disabled: !this.isEdicion }, []),
      estado: new FormControl({ value: producto?.current_state?.state?.uuid, disabled: !this.isEdicion }, [Validators.required]),
      estadoComentario: new FormControl({ value: producto?.current_state?.comments, disabled: !this.isEdicion }, []),
      nomenclatura: new FormControl({ value: producto?.mercosur_nomenclature, disabled: !this.isEdicion }, []),
      unidad: new FormControl({ value: producto?.measure?.uuid, disabled: !this.isEdicion }, [Validators.required]),
      iva: new FormControl({ value: producto?.vat_percent, disabled: !this.isEdicion }, [Validators.required]),
      pais: new FormControl({ value: producto?.country?.uuid, disabled: !this.isEdicion }, [Validators.required]),
      asignaNumSerie: new FormControl({ value: producto?.assign_serial_number, disabled: !this.isEdicion }, [Validators.required]),
      tieneNumSerie: new FormControl({ value: producto?.has_serial_number, disabled: !this.isEdicion }, [Validators.required]),
      trazable: new FormControl({ value: producto?.traceable, disabled: !this.isEdicion }, [Validators.required]),
      vendible: new FormControl({ value: producto?.salable, disabled: !this.isEdicion }, [Validators.required]),
      controlable: new FormControl({ value: producto?.controllable, disabled: !this.isEdicion }, [Validators.required]),
      descripcionControl: new FormControl({ value: producto?.control_description, disabled: !this.isEdicion }, []),
      comentarios: new FormControl({ value: producto?.comments, disabled: !this.isEdicion }, []),
      nombreVenta: new FormControl({ value: producto?.sales_name, disabled: !this.isEdicion }, []),
      stock_available: new FormControl({ value: this.mostrarCantidad(producto, producto?.stock_data?.available), disabled: true }, []),
      stock_reserved: new FormControl({ value: this.mostrarCantidad(producto, producto?.stock_data?.reserved), disabled: true }, []),
      stock_samples: new FormControl({ value: this.mostrarCantidad(producto, producto?.stock_data?.samples), disabled: true }, []),
      stock_observed: new FormControl({ value: this.mostrarCantidad(producto, producto?.stock_data?.observed), disabled: true }, []),
      stock_minimum: new FormControl({ value: this.mostrarCantidad(producto, producto?.stock_data?.minimum), disabled: true }, []),
      stock_optimum: new FormControl({ value: this.mostrarCantidad(producto, producto?.stock_data?.optimum), disabled: true }, []),
      stock_initial: new FormControl({ value: this.mostrarCantidad(producto, producto?.stock_data?.initial_stock), disabled: true }, []),
      stock_quantity_sold: new FormControl({ value: this.mostrarCantidad(producto, producto?.stock_data?.quantity_sold), disabled: true }, []),
    });
    // Habilitar todos los controles si es edición
    if (this.isEdicion) {
      Object.keys(this.compraForm.controls).forEach(key => {
        if (key !== 'stock_available' && key !== 'stock_initial' && key !== 'stock_minimum' && key !== 'stock_observed' &&
          key !== 'stock_optimum' && key !== 'stock_quantity_sold' && key !== 'stock_reserved' && key !== 'stock_samples') {
          this.compraForm.controls[key].enable();
        }
      });
      // Deshabilita la descripción si no es controlable
      if (this.compraForm.get('controlable')?.value === 0) {
        this.compraForm.get('descripcionControl')?.disable();
      }
    }
    this.onFormEditChange();
  }
  onFormEditChange() {
    this.compraForm.get('controlable')!.valueChanges.subscribe(
      (value) => {
        if (value) {
          this.compraForm.get('descripcionControl')?.enable();
        } else {
          this.compraForm.get('descripcionControl')?.disable();
        }
      });
  }

  mostrarCantidad(data: any, stock: string) {
    if (data.measure?.is_integer === 1) {
      return (+stock)?.toFixed(0);
    } else {
      return (+stock)?.toFixed(2);
    }
  }

  inicializarFormNew() {
    this.newCompraForm = new FormGroup({
      nombre: new FormControl({ value: null, disabled: false }, [Validators.required]),
      codigo: new FormControl({ value: null, disabled: false }, []),
      tipoProducto: new FormControl({ value: null, disabled: false }, [Validators.required]),
      categoria: new FormControl({ value: null, disabled: false }, []),
      estado: new FormControl({ value: null, disabled: false }, [Validators.required]),
      estadoComentario: new FormControl({ value: null, disabled: false }, []),
      nomenclatura: new FormControl({ value: null, disabled: false }, []),
      pais: new FormControl({ value: null, disabled: false }, [Validators.required]),
      unidad: new FormControl({ value: null, disabled: false }, [Validators.required]),
      iva: new FormControl({ value: null, disabled: false }, [Validators.required]),
      comentarios: new FormControl({ value: null, disabled: false }, []),
      nombreVenta: new FormControl({ value: null, disabled: false }, []),
      descripcionControl: new FormControl({ value: null, disabled: true }, []),
      asignaNumSerie: new FormControl({ value: false, disabled: false }, [Validators.required]),
      tieneNumSerie: new FormControl({ value: false, disabled: false }, [Validators.required]),
      trazable: new FormControl({ value: false, disabled: false }, [Validators.required]),
      vendible: new FormControl({ value: false, disabled: false }, [Validators.required]),
      controlable: new FormControl({ value: false, disabled: false }, [Validators.required])
    });
    this.onNewForm();
  }
  onNewForm() {
    this.newCompraForm.get('controlable')!.valueChanges.subscribe(
      (value) => {
        if (value) {
          this.newCompraForm.get('descripcionControl')?.enable();
        } else {
          this.newCompraForm.get('descripcionControl')?.disable();
        }
      });
  }

  showName(dato: any) {
    if (dato.transaction?.person?.human) {
      return dato.transaction?.person?.human.firstname + ' ' + dato.transaction?.person?.human.lastname;
    } else {
      return dato.transaction?.person?.legal_entity.company_name;
    }
  }

  showFactura(dato: any) {
    let factura = '';
    if (dato.transaction?.transaction_documents?.length > 0) {
      factura = dato.transaction?.transaction_documents[0].account_document_type.name + '-' + dato.transaction?.transaction_documents[0].document_number;
    }
    return factura;
  }

  showFecha(dato: any) {
    const soloFecha = dato.transaction?.transaction_datetime?.substring(0, 10);
    return soloFecha;
  }

  showDataCompra(compra: any) {
    this.isEdicion = false;
    // this.inicializarFormEdit(compra);
  }

  cancelarEdicion() {
    this.isEdicion = false;
    this.inicializarFormEdit(this.selectedCompra);
  }

  openSwalEliminar(compra: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar la compra seleccionada?`,
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
        this.eliminarCompra(compra);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarCompra(compra: any) {
    this.spinner.show();
    this.subscription.add(
      this._comprasService.deleteCompra(compra.uuid, this.actual_role.toUpperCase()).subscribe({
        next: res => {
          this.obtenerCompras();
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

  cerrarModal() {
    this.isSubmit = false;
    this.modalCompra.close();
  }


  openModalCompra(type: string, producto?: any) {
    if (type === 'NEW') {
      if (this.isEdicion) {
        this.isEdicion = false;
        this.inicializarFormEdit(this.selectedCompra); // Esto es para que no quede inconsistente cuando edita, da de alta y cerra el modal de alta.
      }
      this.tituloModal = 'Nueva compra';
      this.inicializarFormNew();
      this.modalCompra.options = this.modalOptions;
      this.modalCompra.open();
    } else {
      this.tab1 = 'datos-generales';
      this.isEdicion = true;
      this.tituloModal = 'Edición compra';
      this.inicializarFormEdit(producto);
    }
  }

  confirmarProducto(form: FormGroup) {
    this.isSubmit = true;
    if (form.valid) {
      if ((form.get('asignaNumSerie')?.value === 1 || form.get('asignaNumSerie')?.value === true) &&
        (form.get('tieneNumSerie')?.value === 1 || form.get('tieneNumSerie')?.value === true)) {
        this.swalService.toastError('top-right', 'No es posible asignar y tener número de serie al mismo tiempo.');
        return;
      }
      this.spinner.show();
      let producto = new CompraProveedorDTO();
      // this.armarDTOProducto(producto, form);
      if (!this.isEdicion) {
        this.subscription.add(
          this._comprasService.saveCompra(producto).subscribe({
            next: res => {
              this.spinner.hide();
              this.obtenerCompras(true);
              this.cerrarModal();
              this.showDataCompra(res.data);
            },
            error: error => {
              this.spinner.hide();
              this.swalService.toastError('top-right', error.error.message)
              console.error(error);
            }
          })
        )
      } else {
        this.subscription.add(
          this._comprasService.editCompra(this.selectedCompra.uuid, producto).subscribe({
            next: res => {
              this.compras = [...this.compras.map(p =>
                p.uuid === res.data.uuid ? res.data : p
              )];
              this.isEdicion = false;
              this.inicializarFormEdit(res.data);
              this.swalService.toastSuccess('top-right', "Producto actualizado.");
              this.spinner.hide();
            },
            error: error => {
              this.spinner.hide();
              this.swalService.toastError('top-right', error.error.message);
              console.error(error);
            }
          })
        )
      }
    }
  }

  armarDTOProducto(producto: ProductoDTO, form: FormGroup) {
    producto.actual_role = this.actual_role;
    producto.with = ["productType", "productCategory", "productStates", "measure", "country", "stocks"];
    producto.name = form.get('nombre')?.value;
    producto.code = form.get('codigo')?.value;
    producto.product_type_uuid = form.get('tipoProducto')?.value;
    producto.product_category_uuid = form.get('categoria')?.value;
    let estadoProducto = new ProductState();
    estadoProducto.possible_product_state_uuid = form.get('estado')?.value;
    estadoProducto.comments = form.get('estadoComentario')?.value;
    producto.product_state = estadoProducto;
    producto.comments = form.get('comentarios')?.value;
    producto.measure_uuid = form.get('unidad')?.value;
    producto.vat_percent = form.get('iva')?.value;
    producto.country_uuid = form.get('pais')?.value;
    producto.mercosur_nomenclature = form.get('nomenclatura')?.value;
    producto.assign_serial_number = form.get('asignaNumSerie')?.value;
    producto.has_serial_number = form.get('tieneNumSerie')?.value;
    producto.traceable = form.get('trazable')?.value;
    producto.salable = form.get('vendible')?.value;
    producto.sales_name = form.get('nombreVenta')?.value;
    producto.controllable = form.get('controlable')?.value;
    producto.control_description = form.get('descripcionControl')?.value;

    if (!this.isEdicion) {
      this.cleanObject(producto);
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

  getDropdownClass(index: number) {
    let mitad = this.compras.length / 2;
    return index < mitad ? 'ltr:right-0 rtl:left-0' : 'bottom-full !mt-0 mb-1 whitespace-nowrap ltr:right-0 rtl:left-0';
  }
  obtenerComprasPorFiltroSimple() {
    this.filtroTipoPersona = 'todos';
    this.filtros['transaction.person.human.uuid'].value = '';
    this.filtros['transaction.person.legalEntity.uuid'].value = '';
    this.filtros['transaction.transactionDocuments.prefix_number'].value = '';
    this.filtros['transaction.transactionDocuments.document_number'].value = '';
    this.filtros['transaction.transactionProducts.product.uuid'].value = '';
    this.filtros['transaction.transactionDocuments.accountDocumentType.uuid'].value = '';
    this.filtros['batch.batch_identification'].value = '';
    this.filtros['batch.stocks.productInstances.serial_number'].value = '';
    // Limpio las fechas
    this.filtroFechaTransacDesde = '';
    this.filtroFechaTransacHasta = '';
    this.filtroFechaFacturaDesde = '';
    this.filtroFechaFacturaHasta = '';
    this.params.extraDateFilters = [];

    this.filtros['transaction.person.human.firstname'].contiene = this.filtroSimpleContiene;
    this.filtros['transaction.person.human.lastname'].contiene = this.filtroSimpleContiene;
    this.filtros['transaction.person.legalEntity.company_name'].contiene = this.filtroSimpleContiene;

    if (this.filtroSimpleName) {
      this.filtros['transaction.person.human.firstname'].value = this.filtroSimpleName;
      this.filtros['transaction.person.human.lastname'].value = this.filtroSimpleName;
      this.filtros['transaction.person.legalEntity.company_name'].value = this.filtroSimpleName;
      this.filtros.operator.value = 'OR';
    } else {
      this.filtros['transaction.person.human.firstname'].value = '';
      this.filtros['transaction.person.human.lastname'].value = '';
      this.filtros['transaction.person.legalEntity.company_name'].value = '';
      this.filtros.operator.value = '';
    }

    this.obtenerCompras();
  }

  obtenerComprasPorFiltroAvanzado() {
    this.filtroSimpleName = '';
    this.filtroSimpleContiene = true;
    this.filtros.operator.value = '';
    this.params.extraDateFilters = [];
    // Manejar fechas
    if (this.filtroFechaTransacDesde) {
      this.params.extraDateFilters.push(['transaction.transaction_datetime', '>=', this.filtroFechaTransacDesde]);
    }
    if (this.filtroFechaTransacHasta) {
      this.params.extraDateFilters.push(['transaction.transaction_datetime', '<=', this.filtroFechaTransacHasta]);
    }
    if (this.filtroFechaFacturaDesde) {
      this.params.extraDateFilters.push(['transaction.transactionDocuments.document_datetime', '>=', this.filtroFechaFacturaDesde]);

    }
    if (this.filtroFechaFacturaHasta) {
      this.params.extraDateFilters.push(['transaction.transactionDocuments.document_datetime', '<=', this.filtroFechaFacturaHasta]);

    }
    this.obtenerCompras();
  }

  limpiarFiltros() {
    this.filtroTipoPersona = 'todos';
    this.filtros['transaction.person.human.uuid'].value = '';
    this.filtros['transaction.person.legalEntity.uuid'].value = '';
    this.filtros['transaction.person.human.firstname'].value = '';
    this.filtros['transaction.person.human.lastname'].value = '';
    this.filtros['transaction.person.legalEntity.company_name'].value = '';
    this.filtros['transaction.transactionDocuments.prefix_number'].value = '';
    this.filtros['transaction.transactionDocuments.document_number'].value = '';
    this.filtros['transaction.transactionProducts.product.uuid'].value = '';
    this.filtros['transaction.transactionDocuments.accountDocumentType.uuid'].value = '';
    this.filtros['batch.batch_identification'].value = '';
    this.filtros['batch.stocks.productInstances.serial_number'].value = '';
    // Limpio las fechas
    this.filtroFechaTransacDesde = '';
    this.filtroFechaTransacHasta = '';
    this.filtroFechaFacturaDesde = '';
    this.filtroFechaFacturaHasta = '';
    this.params.extraDateFilters = [];

    this.obtenerCompras();
  }

  // irAlProducto(event: any) {
  //   this.inicializarFormEdit(event);
  //   this.tab1 = 'datos-generales';
  // }

  changeTipoPersona() {
    this.filtroSimpleName = '';
    this.filtroSimpleContiene = true;
    this.filtros.operator.value = '';
    this.filtros['transaction.person.human.firstname'].value = '';
    this.filtros['transaction.person.human.lastname'].value = '';
    this.filtros['transaction.person.legalEntity.company_name'].value = '';
    this.filtros['transaction.transactionDocuments.prefix_number'].value = '';
    this.filtros['transaction.transactionDocuments.document_number'].value = '';
    this.filtros['transaction.transactionProducts.product.uuid'].value = '';
    this.filtros['transaction.transactionDocuments.accountDocumentType.uuid'].value = '';
    this.filtros['batch.batch_identification'].value = '';
    this.filtros['batch.stocks.productInstances.serial_number'].value = '';
    // Limpio las fechas
    this.filtroFechaTransacDesde = '';
    this.filtroFechaTransacHasta = '';
    this.params.extraDateFilters = [];

    if (this.filtroTipoPersona === 'todos') {
      this.filtros['transaction.person.human.uuid'].value = '';
      this.filtros['transaction.person.legalEntity.uuid'].value = '';
    } else if (this.filtroTipoPersona === 'fisica') {
      this.filtros['transaction.person.human.uuid'].value = 'null';
      this.filtros['transaction.person.legalEntity.uuid'].value = '';
    } else {
      //jurídica
      this.filtros['transaction.person.human.uuid'].value = '';
      this.filtros['transaction.person.legalEntity.uuid'].value = 'null';
    }
    this.obtenerCompras();
  }

}
