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
import { Observable, Subject, Subscription, debounceTime, distinctUntilChanged, finalize, forkJoin, map, of, switchMap, tap } from 'rxjs';
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
import { FlatpickrDirective } from 'angularx-flatpickr';
import { ParametrosIndex } from 'src/app/core/models/request/parametrosIndex';
import { CompraDTO, Transaction } from 'src/app/core/models/request/compraDTO';
import { ProductoTransaccionDTO } from 'src/app/core/models/request/productoTransaccionDTO';
import { UserLoggedService } from 'src/app/core/services/user-logged.service';
import { TransactionProductoService } from 'src/app/core/services/transactionProducto.service';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconAutoPaymentComponent } from 'src/app/shared/icon/icon-auto-payment';
import { FacturaService } from 'src/app/core/services/factura.service';
import { FacturaDTO } from 'src/app/core/models/request/facturaDTO';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import { UbicacionesService } from 'src/app/core/services/ubicaciones.service';
import { Location } from '@angular/common';
import { PagoDTO } from 'src/app/core/models/request/pagoDTO';
import { PagosService } from 'src/app/core/services/pagos.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { BatchUpdateControlDTO } from 'src/app/core/models/request/batchUpdateControlDTO';
import { ValidatePriceRangeDTO } from 'src/app/core/models/request/validatePriceRangeDTO';
import { IconDollarSignComponent } from 'src/app/shared/icon/icon-dollar-sign';

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgScrollbarModule, NgxTippyModule, IconMenuComponent, IconUserComponent,
    IconPlusComponent, IconSearchComponent, IconEditComponent, IconTrashLinesComponent, NgxCustomModalComponent, NgxSpinnerModule, IconSettingsComponent,
    NgSelectModule, IconHorizontalDotsComponent, MenuModule, FontAwesomeModule, NgbPaginationModule, FlatpickrDirective,
    IconPencilComponent, IconDollarSignComponent
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
  selectedProducto: any;
  compraForm!: FormGroup;
  newCompraForm!: FormGroup;
  productoForm!: FormGroup;
  controlTotalForm!: FormGroup;
  pagoForm!: FormGroup;

  // cargandoProductos: boolean = true;
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
  isSubmitPago = false;

  iconArrowUp = faArrowUp;
  iconArrowDown = faArrowDown;
  iconArrowLeft = faArrowLeft;

  proveedorInput$ = new Subject<string>();
  proveedores$!: Observable<any[]>;
  loadingProveedores = false;

  productoInput$ = new Subject<string>();
  productos$!: Observable<any[]>;
  loadingProductos = false;

  placeholderCantidad: string = '';

  @ViewChild('modalCompra') modalCompra!: NgxCustomModalComponent;
  @ViewChild('modalProducto') modalProducto!: NgxCustomModalComponent;
  @ViewChild('modalControlarTodos') modalControlarTodos!: NgxCustomModalComponent;
  @ViewChild('modalPago') modalPago!: NgxCustomModalComponent;
  @ViewChild('modalEditarProveedor') modalEditarProveedor!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };
  tituloModal: string = '';

  // Catalogos
  tiposDocumentosContables: any[] = [];
  posiblesEstadosTransaccion: any[] = [];
  calificaciones: any[] = [];
  ubicaciones: any[] = [];
  pagos: any[] = [];
  monedas: any[] = [];
  metodosDePago: any[] = [];
  productosGuardados: any[] = [];

  breadcrumb: any[] = [];
  ultimaUbicacion: any = null;
  mostrarProductos = true;
  mostrarPagos = true;
  mostrarDetalles = true;
  usuarioLogueado: any;
  proveedorEdit: any;
  inEdicionFechaCompra: boolean = false;
  inEdicionDescuentos: boolean = false;
  inEdicionFactura: boolean = false;
  inEdicionProducto: boolean = false;
  inEdicionPago: boolean = false;
  inAltaFactura: boolean = false;
  poseeFactura: boolean = false;

  showPassword: boolean = false;
  showWarningUbicacion: boolean = false;

  // Iconos
  iconEye = faEye;
  iconEyeSlash = faEyeSlash;

  uuidFromUrl: string = '';
  isLoadingCompras: boolean = true;

  productosSeleccionados: any[] = [];

  // Manejo de filtros activos.
  activeFilters: Array<{ key: string; label: string; display: string }> = [];

  constructor(public storeData: Store<any>, private swalService: SwalService, private _indexService: IndexService,
    private _comprasService: ComprasProveedorService, private spinner: NgxSpinnerService, private tokenService: TokenService,
    private _catalogoService: CatalogoService, private _userLogged: UserLoggedService, private titleService: Title,
    private _transactionProductService: TransactionProductoService, private _facturaService: FacturaService,
    private _ubicacionService: UbicacionesService, private _pagoService: PagosService, private location: Location, private route: ActivatedRoute,
    private router: Router) {
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
    this.route.paramMap.subscribe(params => {
      this.uuidFromUrl = params.get('uuid') ?? '';
    });
    this.spinner.show();
    this.usuarioLogueado = this._userLogged.getUsuarioLogueado;
    this.obtenerCompras();
    this.obtenerProductos();
    this.obtenerProveedores();
    this.obtenerCatalogos();
  }

  obtenerCompras(alta: boolean = false) {
    // El booleano 'alta' es para que cuando da de alta un nuevo registro, no entre a inicializar, sino siempre muestra el primero de 
    // la lista y no el que acabo de agregar.

    // Inicializamos un objeto vacío para los parámetros
    this.params.with = [
      "transaction.person.human",
      "transaction.person.city.district.country",
      "transaction.person.legalEntity",
      "transaction.transactionDocuments.accountDocumentType",
      'transaction.transactionProducts.product.productType',
      'batch.stocks.productInstances',
      'transaction.currentState'
    ];
    this.params.paging = this.itemsPerPage;
    this.params.page = this.currentPage;
    this.params.order_by = this.ordenamiento;
    this.params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getComprasProveedorWithParam(this.params, this.actual_role).subscribe({
        next: res => {
          this.compras = res.data;
          this.modificarPaginacion(res);
          this.tokenService.setToken(res.token);
          if (this.uuidFromUrl) {
            this.obtenerCompraPorId(this.uuidFromUrl);
          } else {
            if (this.compras.length === 0) {
              this.swalService.toastSuccess('center', 'No existen compras.');
              this.isTabDisabled = true;
              this.selectedCompra = null;
            } else {
              this.isTabDisabled = false;
            }
            if (!alta && this.compras.length > 0) {
              this.isEdicion = false;
              this.obtenerCompraPorId(this.compras[0].uuid);
              this.location.replaceState(`/dashboard/compras/${this.compras[0].uuid}`);
            }
          }
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

  obtenerCompraPorId(uuid: any) {
    this.spinner.show();
    this.subscription.add(
      this._comprasService.getCompraById(uuid, this.actual_role).subscribe({
        next: res => {
          this.selectedCompra = res.data;
          this.obtenerPagos(this.selectedCompra?.transaction?.uuid);
          this.inicializarFormEdit();
          this.uuidFromUrl = this.selectedCompra.uuid;
          this.location.replaceState(`/dashboard/compras/${this.selectedCompra.uuid}`);
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

  inicializarFormEdit() {
    this.poseeFactura = false;
    this.compraForm = new FormGroup({
      // Proveedor
      nombre: new FormControl({ value: this.selectedCompra?.transaction?.person?.human?.firstname, disabled: true }, []),
      apellido: new FormControl({ value: this.selectedCompra?.transaction?.person?.human?.lastname, disabled: true }, []),
      razonSocial: new FormControl({ value: this.selectedCompra?.transaction?.person?.legal_entity?.company_name, disabled: true }, []),
      cuit: new FormControl({ value: this.getCuit(), disabled: true }, []),
      calle: new FormControl({ value: this.selectedCompra?.transaction?.person?.street_name, disabled: true }, []),
      numero: new FormControl({ value: this.selectedCompra?.transaction?.person?.door_number, disabled: true }, []),
      localidad: new FormControl({ value: this.selectedCompra?.transaction?.person?.city?.name, disabled: true }, []),
      // Facturacion
      fechaCompra: new FormControl({ value: this.getFecha(this.selectedCompra?.transaction?.transaction_datetime), disabled: true }, []),
      fechaFacturacion: new FormControl({ value: this.getFechaFacturacion(), disabled: true }, []),
      estadoCompra: new FormControl({ value: this.selectedCompra?.transaction?.current_state?.state?.uuid, disabled: true }, []),
      tipoComprobante: new FormControl({ value: this.getTipoComprobante(), disabled: true }, []),
      prefijoComprobante: new FormControl({ value: this.getPrefijoComprobante(), disabled: true }, []),
      documentoComprobante: new FormControl({ value: this.getDocumentoComprobante(), disabled: true }, []),
      moneda: new FormControl({ value: this.getMoneda(), disabled: true }, []),
      tipoCambio: new FormControl({ value: this.getTipoCambio(), disabled: true }, []),
      lote: new FormControl({ value: this.selectedCompra?.batch?.batch_identification, disabled: true }, []),
      // 
      subtotalSinDescuento: new FormControl({ value: this.selectedCompra?.transaction?.subtotal_before_discount, disabled: true }, []),
      descuento1: new FormControl({ value: this.selectedCompra?.transaction?.discount1, disabled: true }, []),
      descuento2: new FormControl({ value: this.selectedCompra?.transaction?.discount2, disabled: true }, []),
      subtotalConDescuento: new FormControl({ value: this.selectedCompra?.transaction?.subtotal_after_discount, disabled: true }, []),
      otrosCargos: new FormControl({ value: this.selectedCompra?.transaction?.others, disabled: true }, []),
      iva: new FormControl({ value: this.selectedCompra?.transaction?.vat, disabled: true }, []),
      percepcionIIBB: new FormControl({ value: this.selectedCompra?.transaction?.perceptionIB, disabled: true }, []),
      percepcionRG3337: new FormControl({ value: this.selectedCompra?.transaction?.perceptionRG3337, disabled: true }, []),
      total: new FormControl({ value: this.selectedCompra?.transaction?.total, disabled: true }, []),
      calificacion: new FormControl({ value: this.selectedCompra?.qualification_option?.uuid, disabled: true }, []),
      calificacionComentarios: new FormControl({ value: this.selectedCompra?.qualification_comments, disabled: true }, []),
    });
    if (this.selectedCompra?.transaction?.transaction_documents.length > 0) {
      this.poseeFactura = true;
    }
    this.onFormEditChange();
  }
  onFormEditChange() {
    this.compraForm.get('moneda')!.valueChanges.subscribe(
      (value: any) => {
        if (value.name === 'Pesos') {
          this.compraForm.get('tipoCambio')?.setValue(1);
          this.compraForm.get('tipoCambio')?.disable();
        } else {
          this.compraForm.get('tipoCambio')?.setValue(null);
          this.compraForm.get('tipoCambio')?.enable();
        }
      });
  }

  getFecha(fecha: string) {
    const date = new Date(fecha.replace(' ', 'T'));
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getFechaFacturacion() {
    if (this.selectedCompra?.transaction?.transaction_documents.length > 0) {
      return this.getFecha(this.selectedCompra?.transaction?.transaction_documents[0]?.document_datetime);
    }
    return '';
  }

  getMoneda() {
    if (this.selectedCompra?.transaction?.transaction_documents.length > 0) {
      return this.selectedCompra?.transaction?.transaction_documents[0]?.currency;
    }
    return '';
  }

  getTipoCambio() {
    if (this.selectedCompra?.transaction?.transaction_documents.length > 0) {
      return this.selectedCompra?.transaction?.transaction_documents[0]?.exchange_rate;
    }
    return '';
  }

  getTipoComprobante() {
    if (this.selectedCompra?.transaction?.transaction_documents.length > 0) {
      return this.selectedCompra?.transaction?.transaction_documents[0]?.account_document_type?.uuid;
    }
    return '';
  }

  getPrefijoComprobante() {
    if (this.selectedCompra?.transaction?.transaction_documents.length > 0) {
      return this.selectedCompra?.transaction?.transaction_documents[0]?.prefix_number
    }
    return '';
  }

  getDocumentoComprobante() {
    if (this.selectedCompra?.transaction?.transaction_documents.length > 0) {
      return this.selectedCompra?.transaction?.transaction_documents[0]?.document_number
    }
    return '';
  }

  getCalificacionTooltip() {
    return this.selectedCompra?.qualification_option?.description;
  }

  getMostrarOcultarTooltip() {
    return this.mostrarProductos ? 'Ocultar' : 'Mostrar';
  }

  getMostrarOcultarTooltipPagos() {
    return this.mostrarPagos ? 'Ocultar' : 'Mostrar';
  }

  getMostrarOcultarTooltipDetalles() {
    return this.mostrarDetalles ? 'Ocultar' : 'Mostrar';
  }

  getCuit() {
    if (this.selectedCompra) {
      if (this.isPersonaFisica()) {
        return this.selectedCompra.transaction?.person?.human?.cuit;
      } else {
        return this.selectedCompra.transaction?.person?.legal_entity?.cuit;
      }
    }
  }

  isPersonaFisica() {
    if (this.selectedCompra?.transaction?.person?.human !== null) {
      return true
    } else {
      return false;
    }
  }

  obtenerProductos() {
    const params: any = {};
    params.with = ["productType", "productCategory", "currentState", "productStates", "measure", "country", "stocks"];
    params.paging = 20;
    params.page = null;
    params.order_by = {};
    params.filters = {
      'productType.can_be_purchased': { value: '1', op: '=', contiene: false },
      'productStates.possibleProductState.name': { value: 'Vigente', op: '=', contiene: false },
      'productStates.datetime_to': { value: 'null', op: '=', contiene: false },
    };

    this.productos$ = this.productoInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.loadingProductos = true),
      switchMap((term: string) => {
        if (!term || term.trim().length < 2) {
          this.loadingProductos = false;
          return of([]);
        }
        params.filters['name'] = { value: term, op: 'LIKE', contiene: true };

        return this._indexService.getProductosWithParamAsync(params, this.actual_role).pipe(
          map((res: any) => {
            this.productosGuardados = res.data;
            return res.data;
          }), finalize(() => this.loadingProductos = false)
        );
      })
    );
  }

  obtenerUbicaciones(uuid?: string) {
    const params: any = {};
    params.with = ["location.location.location.location"];
    params.paging = null;
    params.page = null;
    params.order_by = {
      'name': 'asc'
    };
    params.filters = {
      'location_uuid': { value: uuid ? uuid : 'null', op: '=', contiene: false },
    };

    this.subscription.add(
      this._indexService.getUbicacionesWithParam(params, this.actual_role).subscribe({
        next: res => {
          this.ubicaciones = res.data;
        },
        error: error => {
          this.swalService.toastError('top-right', error.error.message);
          console.error(error);
        }
      })
    )
  }

  obtenerCatalogos() {
    const params: any = {};
    params.with = [];
    params.paging = null;
    params.page = null;
    params.order_by = { "name": "asc" };
    params.filters = {};

    forkJoin({
      tiposDocumentosContables: this._catalogoService.getTiposCompraDocumentosContables(this.actual_role),
      posiblesEstadosTransaccion: this._catalogoService.getPosiblesEstadosTransaccionCompra(this.actual_role),
      calificaciones: this._catalogoService.getCalificaciones(this.actual_role),
      monedas: this._indexService.getMonedas(this.actual_role),
      metodosPago: this._indexService.getMetodosDePagoWithParam(params, this.actual_role)
    }).subscribe({
      next: res => {
        this.tiposDocumentosContables = res.tiposDocumentosContables.data;
        this.posiblesEstadosTransaccion = res.posiblesEstadosTransaccion.data;
        this.calificaciones = res.calificaciones.data;
        this.monedas = res.monedas.data;
        this.metodosDePago = res.metodosPago.data;
      },
      error: error => {
        console.error('Error cargando catalogos:', error);
      }
    });
  }

  obtenerPagos(uuid: string) {
    const params: any = {};
    params.with = ["currency.currentExchangeRate", "paymentMethod"];
    params.paging = 10;
    params.page = 1;
    params.order_by = {

    };
    params.filters = {
      'transaction_uuid': { value: uuid, op: '=', contiene: false },
    };

    this.subscription.add(
      this._indexService.getPagosWithParam(params, this.actual_role).subscribe({
        next: res => {
          this.pagos = res.data;
        },
        error: error => {
          this.swalService.toastError('top-right', error.error.message);
          console.error(error);
        }
      })
    )
  }

  inicializarFormNew() {
    this.newCompraForm = new FormGroup({
      transaction_datetime: new FormControl({ value: new Date(), disabled: false }, []),
      person_uuid: new FormControl({ value: null, disabled: false }, [Validators.required])
    });
    this.onNewForm();
  }
  onNewForm() {

  }

  showName(dato: any) {
    if (dato.transaction?.person?.human) {
      return dato.transaction?.person?.human.firstname + ' ' + dato.transaction?.person?.human.lastname;
    } else {
      return dato.transaction?.person?.legal_entity.company_name;
    }
  }

  showFactura(dato: any) {
    let factura = 'Sin factura';
    if (dato.transaction?.transaction_documents?.length > 0) {
      factura = dato.transaction?.transaction_documents[0].account_document_type.name + '-' + dato.transaction?.transaction_documents[0].prefix_number + '-' + dato.transaction?.transaction_documents[0].document_number;
    }
    return factura;
  }

  showDataCompra(compra: any) {
    if (this.compras.length == 0 || this.selectedCompra && this.selectedCompra.uuid !== compra.uuid) {
      this.isEdicion = false;
      // Cerramos todos los edit.
      if (this.inEdicionFechaCompra) {
        this.openCloseEditarFechaCompra();
      }
      if (this.inEdicionDescuentos) {
        this.openCloseEditarDescuentosCompra();
      }
      if (this.inEdicionFactura || this.inAltaFactura) {
        this.openCloseEditarFactura();
      }
      this.obtenerCompraPorId(compra.uuid);
    }
  }

  cancelarEdicion() {
    this.isEdicion = false;
    this.inicializarFormEdit();
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
          if (this.uuidFromUrl === compra.uuid) {
            // Se blanquea para que si elimina en el que está parado no tire error al recargar, ya que no existe el uuid.
            this.uuidFromUrl = '';
          }
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


  openModalCompra(type: string, compra?: any) {
    if (type === 'NEW') {
      if (this.isEdicion) {
        this.isEdicion = false;
        this.inicializarFormEdit(); // Esto es para que no quede inconsistente cuando edita, da de alta y cerra el modal de alta.
      }
      this.tituloModal = 'Nueva compra';
      this.inicializarFormNew();
      this.modalCompra.options = this.modalOptions;
      this.modalCompra.open();
    } else {
      // this.tab1 = 'datos-generales';
      this.isEdicion = true;
      this.tituloModal = 'Edición compra';
      this.obtenerCompraPorId(compra.uuid);
    }
    // Cerramos todos los edit.
    if (this.inEdicionFechaCompra) {
      this.openCloseEditarFechaCompra();
    }
    if (this.inEdicionDescuentos) {
      this.openCloseEditarDescuentosCompra();
    }
    if (this.inEdicionFactura || this.inAltaFactura) {
      this.openCloseEditarFactura();
    }
  }

  openModalProducto(type: string, producto?: any) {
    if (type === 'NEW') {
      if (this.isEdicion) {
        this.isEdicion = false;
      }
      this.tituloModal = 'Nuevo producto';
      this.obtenerUbicaciones();
      this.inicializarFormProducto();
      this.modalProducto.options = this.modalOptions;
      this.modalProducto.open();
    } else {
      this.inEdicionProducto = true;
      this.tituloModal = 'Edición de producto';
      if (producto.product?.stocks?.length > 0 && producto.product.stocks[0].location !== null) {
        this.getParentsFromLocation(producto.product.stocks[0].location);
        this.obtenerUbicaciones(producto.product.stocks[0].location.uuid);
      } else {
        this.obtenerUbicaciones();
      }
      this.inicializarFormProducto(producto);
      this.modalProducto.options = this.modalOptions;
      this.modalProducto.open();
    }
    // Cerramos todos los edit.
    if (this.inEdicionFechaCompra) {
      this.openCloseEditarFechaCompra();
    }
    if (this.inEdicionDescuentos) {
      this.openCloseEditarDescuentosCompra();
    }
    if (this.inEdicionFactura) {
      this.openCloseEditarFactura();
    }
  }

  openModalPagos(type: string, pago?: any) {
    if (type === 'NEW') {
      if (this.isEdicion) {
        this.isEdicion = false;
      }
      this.tituloModal = 'Nuevo pago';
      this.inicializarFormPago();
      this.modalPago.options = this.modalOptions;
      this.modalPago.open();
    } else {
      this.inEdicionPago = true;
      this.tituloModal = 'Edición pago';
      this.inicializarFormPago(pago);
      this.modalPago.options = this.modalOptions;
      this.modalPago.open();
    }
    // Cerramos todos los edit.
    if (this.inEdicionFechaCompra) {
      this.openCloseEditarFechaCompra();
    }
    if (this.inEdicionDescuentos) {
      this.openCloseEditarDescuentosCompra();
    }
    if (this.inEdicionFactura) {
      this.openCloseEditarFactura();
    }
  }

  inicializarFormPago(data?: any) {
    this.pagoForm = new FormGroup({
      pago_uuid: new FormControl({ value: data ? data.uuid : null, disabled: false }, []),
      payment_datetime: new FormControl({ value: data ? this.getFecha(data.payment_datetime) : null, disabled: false }, this.inEdicionPago ? [] : [Validators.required]),
      payment_method: new FormControl({ value: data ? data.payment_method?.uuid : null, disabled: false }, this.inEdicionPago ? [] : []),
      amount: new FormControl({ value: data ? data.amount : null, disabled: false }, this.inEdicionPago ? [] : []),
      detail: new FormControl({ value: data ? data.detail : null, disabled: false }, []),
      currency_uuid: new FormControl({ value: data ? data.currency.name : null, disabled: false }, this.inEdicionPago ? [] : []),
      exchange_rate: new FormControl({ value: data ? data.exchange_rate : null, disabled: false }, this.inEdicionPago ? [] : []),
    });
    this.onChangePagoForm();
  }
  onChangePagoForm() {
    this.pagoForm.get('currency_uuid')!.valueChanges.subscribe(
      (value: any) => {
        if (value.name === 'Pesos') {
          this.pagoForm.get('exchange_rate')?.setValue(1);
          this.pagoForm.get('exchange_rate')?.disable();
        } else {
          this.pagoForm.get('exchange_rate')?.setValue(null);
          this.pagoForm.get('exchange_rate')?.enable();
        }
      });
  }


  getParentsFromLocation(ubicacion: any) {
    this.subscription.add(
      this._ubicacionService.showUbicacionWithParent(ubicacion.uuid, this.actual_role).subscribe({
        next: res => {
          this.ultimaUbicacion = res.data;
          this.breadcrumb = [...this.construirBreadcrumb(res.data)];
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

  inicializarFormProducto(data?: any) {
    this.selectedProducto = data;
    this.productoForm = new FormGroup({
      transaction_uuid: new FormControl({ value: data ? data.uuid : null, disabled: false }, []),
      product_uuid: new FormControl({ value: data ? data.product : null, disabled: data ? true : false }, [Validators.required]),
      quantity: new FormControl({ value: data ? this.showCantidad(data) : null, disabled: data ? false : true }, [Validators.required]),
      unit_price: new FormControl({ value: data ? data.unit_price : null, disabled: false }, [Validators.required]),
      control_ok: new FormControl({ value: data ? (data.control_result === 1) : null, disabled: false }, []),
      control_propio: new FormControl({ value: true, disabled: false }, []),
      producto_controlado: new FormControl({ value: data ? (data.control_result !== null) : null, disabled: false }, []),
      usuario: new FormControl({ value: null, disabled: false }, []),
      password: new FormControl({ value: null, disabled: false }, []),
      control_comments: new FormControl({ value: data ? data.control_comments : null, disabled: false }, []),
      location_uuid: new FormControl({ value: data ? this.getLocation(data) : null, disabled: false }, []),
      control_description: new FormControl({ value: data ? data.product.control_description : null, disabled: true }, []),
    });
    if (this.selectedCompra.transaction?.current_state?.state?.name === 'Entregada pendiente de factura' ||
      this.selectedCompra.transaction?.current_state?.state?.name === 'Finalizada') {
      this.productoForm.get('quantity')?.disable();
      this.productoForm.get('unit_price')?.disable();
    }
    this.onFormProductoChange();
  }
  onFormProductoChange() {
    this.productoForm.get('product_uuid')!.valueChanges.subscribe(
      (producto: any) => {
        this.productoForm.get('control_description')?.setValue(producto.control_description);
        // if (producto?.product_type?.stock_controlled === 1 && producto.traceable === 1) {
        //   this.showInputUbicacion = true;
        // } else {
        //   this.showInputUbicacion = false;
        // }
        // Quantity
        if (producto) {
          this.productoForm.get('quantity')?.enable();
          this.productoForm.get('quantity')?.setValue('');
          this.placeholderCantidad = 'Cantidad en ' + producto.measure?.name;
        } else {
          this.productoForm.get('quantity')?.disable();
          this.placeholderCantidad = '';
        }
      });

    this.productoForm.get('producto_controlado')!.valueChanges.subscribe(
      (value: any) => {
        ['password'].forEach((field) => {
          const control = this.productoForm.get(field);
          control?.setValidators(Validators.required);
        });
        if (value) {

        } else {
          this.productoForm.get('control_ok')?.setValue(null);
        }
        ['password'].forEach((field) => {
          this.productoForm.get(field)?.updateValueAndValidity({ emitEvent: false });
        });
      });

    this.productoForm.get('control_ok')!.valueChanges.subscribe(
      (value: any) => {
        if (value) {
          this.productoForm.get('producto_controlado')?.setValue(true);
        }
        ['password'].forEach((field) => {
          const control = this.productoForm.get(field);
          control?.setValidators(Validators.required);
        });
        ['password'].forEach((field) => {
          this.productoForm.get(field)?.updateValueAndValidity({ emitEvent: false });
        });
      });

    this.productoForm.get('control_comments')!.valueChanges.subscribe(
      (value: any) => {
        ['password'].forEach((field) => {
          const control = this.productoForm.get(field);
          control?.setValidators(Validators.required);
        });
        ['password'].forEach((field) => {
          this.productoForm.get(field)?.updateValueAndValidity({ emitEvent: false });
        });
      });

    this.productoForm.get('location_uuid')!.valueChanges.subscribe(
      (value: any) => {
        if (this.selectedProducto?.product?.product_type?.stock_controlled === 0 ||
          this.selectedProducto?.product?.traceable === 0) {
          this.showWarningUbicacion = true;
        } else {
          this.showWarningUbicacion = false;
        }
      });
  }

  getLocation(data: any) {
    if (data.product.stocks.length > 0) {
      return data.product.stocks[0].location?.uuid;
    }
  }

  onSeleccionUbicacion() {
    const seleccion = this.ubicaciones.find(
      (u) => u.uuid === this.productoForm.get('location_uuid')?.value
    );

    if (!seleccion) return;

    this.breadcrumb.push(seleccion);
    this.ultimaUbicacion = seleccion;
    // this.productoForm.get('location_uuid')?.setValue(seleccion.uuid);
    this.productoForm.get('location_uuid')?.setValue(null);
    this.obtenerUbicaciones(seleccion.uuid);
  }

  irAUbicacion(index: number) {
    this.productoForm.markAsTouched();
    this.productoForm.markAsDirty();
    this.ultimaUbicacion = this.breadcrumb[index];
    this.breadcrumb = this.breadcrumb.slice(0, index + 1);
    // this.ultimaUbicacion = ubicacion;
    // this.productoForm.get('location_uuid')?.setValue(ubicacion.uuid);
    this.productoForm.get('location_uuid')?.setValue(null);
    this.obtenerUbicaciones(this.ultimaUbicacion.uuid);
  }

  eliminarUbicacion(index: number): void {
    this.productoForm.markAsTouched();
    this.productoForm.markAsDirty();
    const ubicacion = this.breadcrumb[index - 1];
    this.breadcrumb.splice(index);
    this.productoForm.controls['location_uuid'].setValue(null);
    this.ultimaUbicacion = ubicacion ? ubicacion : null;
    if (index === 0) {
      this.obtenerUbicaciones();
    } else {
      this.obtenerUbicaciones(ubicacion.uuid);
    }
  }

  // resetUbicaciones() {
  //   this.breadcrumb = [];
  //   this.productoForm.get('location_uuid')?.setValue(null);
  //   this.obtenerUbicaciones();
  // }

  obtenerProveedores() {
    const params: any = {};
    params.with = ["person.city.district.country", "person.currentState", "person.human.gender",
      "person.human.documentType", "person.human.user", "person.legalEntity"];
    params.paging = 10;
    params.page = 1;
    params.order_by = {};
    params.filters = {};

    this.proveedores$ = this.proveedorInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.loadingProveedores = true),
      switchMap((term: string) => {
        if (!term || term.trim().length < 2) {
          this.loadingProveedores = false;
          return of([]);
        }
        params.filters = {
          operator: { value: 'OR' },
          'person.human.firstname': { value: term, op: 'LIKE', contiene: true },
          'person.human.lastname': { value: term, op: 'LIKE', contiene: true },
          'person.legalEntity.company_name': { value: term, op: 'LIKE', contiene: true }
        };

        return this._indexService.getProveedoresWithParamAsync(params, this.actual_role).pipe(
          map((res: any) => res.data.map((proveedor: any) => ({
            ...proveedor,
            nombreCompleto: this.bindName(proveedor)
          }))),
          finalize(() => this.loadingProveedores = false)
        );
      })
    );
  }

  bindName(data: any): string {
    if (!data.person) return '';
    if (data.person.human) {
      return data.person.human.firstname + ' ' + data.person.human.lastname;
    } else if (data.person.legal_entity) {
      return data.person.legal_entity.company_name;
    }
    return '';
  }

  confirmarCompra(form: FormGroup) {
    this.isSubmit = true;
    if (form.valid) {
      this.spinner.show();
      let compra = new CompraDTO();
      this.armarDTOCompra(compra, form);
      if (!this.isEdicion) {
        this.subscription.add(
          this._comprasService.saveCompra(compra).subscribe({
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
          this._comprasService.editCompra(this.selectedCompra.uuid, compra).subscribe({
            next: res => {
              this.compras = [...this.compras.map(p =>
                p.uuid === res.data.uuid ? res.data : p
              )];
              this.isEdicion = false;
              this.inicializarFormEdit();
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

  armarDTOCompra(compra: CompraDTO, form: FormGroup) {
    compra.actual_role = this.actual_role;
    compra.qualification_option_uuid = form.get('qualification_option_uuid')?.value;
    compra.qualification_comments = form.get('qualification_comments')?.value;
    let transaction = new Transaction();
    transaction.person_uuid = form.get('person_uuid')?.value.person.uuid;
    const fechaFormateada = form.get('transaction_datetime')?.value instanceof Date
      ? format(form.get('transaction_datetime')?.value, 'dd-MM-yyyy')
      : form.get('transaction_datetime')?.value;
    transaction.transaction_datetime = this.convertirFechaADateBackend(fechaFormateada);
    transaction.vat_after_discount = false;
    transaction.discount1 = form.get('discount1')?.value;
    transaction.discount2 = form.get('discount2')?.value;
    transaction.others = form.get('others')?.value;
    transaction.perceptionIB = form.get('perceptionIB')?.value;
    transaction.perceptionRG3337 = form.get('perceptionRG3337')?.value;
    transaction.possible_transaction_state_uuid = form.get('possible_transaction_state_uuid')?.value;
    compra.transaction = transaction;

    if (!this.isEdicion) {
      this.cleanObject(compra);
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
      this.params.extraDateFilters.push(['transaction.transaction_datetime', '>=', this.convertirFechaADateBackend(this.filtroFechaTransacDesde)]);
    }
    if (this.filtroFechaTransacHasta) {
      this.params.extraDateFilters.push(['transaction.transaction_datetime', '<=', this.convertirFechaADateBackend(this.filtroFechaTransacHasta)]);
    }
    if (this.filtroFechaFacturaDesde) {
      this.params.extraDateFilters.push(['transaction.transactionDocuments.document_datetime', '>=', this.convertirFechaADateBackend(this.filtroFechaFacturaDesde)]);
    }
    if (this.filtroFechaFacturaHasta) {
      this.params.extraDateFilters.push(['transaction.transactionDocuments.document_datetime', '<=', this.convertirFechaADateBackend(this.filtroFechaFacturaHasta)]);
    }
    this.params.distinct = true;
    this.obtenerCompras();
  }

  convertirFechaADateBackend(fechaStr: string): string {
    const fechaNormalizada = fechaStr.replace(/[\/()]/g, '-');
    const [dia, mes, anio] = fechaNormalizada.split('-');
    return `${anio}-${mes}-${dia}`;
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
    this.activeFilters = [];
    this.obtenerCompras();
  }

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

  toggleProductos() {
    this.mostrarProductos = !this.mostrarProductos;
    this.productosSeleccionados = [];
  }

  togglePagos() {
    this.mostrarPagos = !this.mostrarPagos;
  }
  toggleDetalles() {
    this.mostrarDetalles = !this.mostrarDetalles;
  }

  showCantidad(data: any) {
    if (data.product?.measure?.is_integer === 1) {
      return (+data.quantity).toFixed(0);
    } else {
      return (+data.quantity).toFixed(2);
    }
  }

  isControlRealizado(data: any) {
    return (data.control_result !== null);
  }

  resultadoControl(data: any) {
    if (data && data.control_result !== null) {
      return data.control_result === 1 ? 'Aprobado' : 'Desaprobado';
    }
    return '';
  }

  showPrecioTotal(data: any) {
    return (data.quantity * data.unit_price).toFixed(2);
  }

  validatePriceRange() {
    this.isSubmit = true;
    if (this.productoForm.valid) {
      let validatePriceRange = new ValidatePriceRangeDTO();
      validatePriceRange.actual_role = this.actual_role;
      validatePriceRange.product_uuid = this.productoForm.get('product_uuid')?.value?.uuid;
      validatePriceRange.transaction_uuid = this.selectedCompra.transaction?.uuid;
      validatePriceRange.unit_price = this.productoForm.get('unit_price')?.value;
      this.subscription.add(
        this._transactionProductService.validatePriceRange(validatePriceRange).subscribe({
          next: res => {
            if (res.data?.message === "") {
              this.confirmarAltaProducto();
            } else {
              // El usuario debe confirmar si acepta o no.
              this.swalMessageToConfirm(res.data?.message);
            }
          },
          error: error => {
            this.swalService.toastError('top-right', error.error.message);
            console.error(error);
          }
        })
      );
    }
  }

  swalMessageToConfirm(message: string) {
    Swal.fire({
      title: "¿Estás seguro?",
      text: message,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        this.confirmarAltaProducto();
      }
    });
  }

  confirmarAltaProducto() {
    this.isSubmit = true;
    if (this.productoForm.valid) {
      if (!this.productoForm.pristine) {
        this.spinner.show();
        let producto = new ProductoTransaccionDTO();
        producto.actual_role = this.actual_role;
        producto.with = [];
        producto.quantity = this.productoForm.get('quantity')?.value;
        producto.unit_price = this.productoForm.get('unit_price')?.value;
        producto.location_uuid = this.ultimaUbicacion ? this.ultimaUbicacion?.uuid : null;
        if (this.productoForm.get('producto_controlado')?.value) {
          producto.control_result = this.productoForm.get('control_ok')?.value ?? false;
          producto.control_comments = this.productoForm.get('control_comments')?.value;
          if (this.productoForm.get('control_propio')?.value) {
            producto['user->control_user_uuid'] = this.usuarioLogueado.uuid;
            producto.password = this.productoForm.get('password')?.value;
          } else {
            if (this.isEmail(this.productoForm.get('usuario')?.value)) {
              producto.control_user_email = this.productoForm.get('usuario')?.value;
            } else {
              producto.control_user_name = this.productoForm.get('usuario')?.value;
            }
            producto.password = this.productoForm.get('password')?.value;
          }
        } else {
          producto.control_result = null;
          producto.control_comments = null;
        }

        if (!this.inEdicionProducto) {
          producto.product_uuid = this.productoForm.get('product_uuid')?.value?.uuid;
          producto.transaction_uuid = this.selectedCompra?.transaction?.uuid;
          this.cleanObject(producto);
          this.subscription.add(
            this._transactionProductService.saveTransactionProduct(producto).subscribe({
              next: res => {
                this.cerrarModalAltaProducto();
                this.isSubmit = false;
                this.obtenerCompraPorId(this.selectedCompra.uuid);
                this.tokenService.setToken(res.token);
                this.breadcrumb = [];
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
          if (this.productoForm.get('control_ok')?.pristine && this.productoForm.get('producto_controlado')?.pristine &&
            this.productoForm.get('control_comments')?.pristine) {
            delete producto.control_result;
            delete producto.password;
          } else {
            // Le remueve el producto controlado ya sea por error o x motivo
            if (this.productoForm.get('control_propio')?.value) {
              producto['user->control_user_uuid'] = this.usuarioLogueado.uuid;
              producto.password = this.productoForm.get('password')?.value;
            } else {
              if (this.isEmail(this.productoForm.get('usuario')?.value)) {
                producto.control_user_email = this.productoForm.get('usuario')?.value;
              } else {
                producto.control_user_name = this.productoForm.get('usuario')?.value;
              }
              producto.password = this.productoForm.get('password')?.value;
            }
          }
          if (this.selectedCompra?.transaction?.current_state?.state?.name === 'Borrador') {
            delete producto.location_uuid;
          }
          if (this.selectedCompra.transaction?.current_state?.state?.name === 'Entregada pendiente de factura' ||
            this.selectedCompra.transaction?.current_state?.state?.name === 'Finalizada') {
            delete producto.quantity;
            delete producto.unit_price;
          }
          this.subscription.add(
            this._transactionProductService.editTransactionProduct(this.productoForm.get('transaction_uuid')?.value, producto).subscribe({
              next: res => {
                this.cerrarModalAltaProducto();
                this.isSubmit = false;
                this.inEdicionProducto = false;
                this.tokenService.setToken(res.token);
                this.breadcrumb = [];
                this.obtenerCompraPorId(this.selectedCompra.uuid);
                this.spinner.hide();
              },
              error: error => {
                this.swalService.toastError('top-right', error.error.message);
                console.error(error);
                this.spinner.hide();
              }
            })
          )
        }
      } else {
        this.swalService.toastInfo('top-right', "El formulario no se modificó.");
      }
    }
  }

  isEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  cerrarModalAltaProducto() {
    this.isSubmit = false;
    this.inEdicionProducto = false;
    this.breadcrumb = [];
    this.ultimaUbicacion = null;
    this.showWarningUbicacion = false;
    this.modalProducto.close();
  }


  openSwalEliminarProductoTransaccion(producto: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar el producto seleccionado?`,
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
        this.eliminarProductoTransaccion(producto);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarProductoTransaccion(producto: any) {
    this.spinner.show();
    this.subscription.add(
      this._transactionProductService.deleteTransactionProduct(producto.uuid, this.actual_role.toUpperCase()).subscribe({
        next: res => {
          let productos = this.selectedCompra.transaction.transaction_products;
          const index = productos.findIndex((p: any) => p.uuid === producto.uuid);
          if (index !== -1) {
            productos.splice(index, 1);
          }
          this.obtenerCompraPorId(this.selectedCompra.uuid);
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

  openModalEditarProveedor() {
    this.modalEditarProveedor.options = this.modalOptions;
    this.modalEditarProveedor.open();
    // Cerramos todos los edit.
    if (this.inEdicionFechaCompra) {
      this.openCloseEditarFechaCompra();
    }
    if (this.inEdicionDescuentos) {
      this.openCloseEditarDescuentosCompra();
    }
    if (this.inEdicionFactura || this.inAltaFactura) {
      this.openCloseEditarFactura();
    }
  }

  editarProveedor() {
    if (this.proveedorEdit) {
      if (this.proveedorEdit?.person?.uuid === this.selectedCompra?.transaction?.person?.uuid) {
        this.swalService.toastError('top-right', 'No puede elegir el proveedor actual.');
        return;
      }
      let compraDTO = new CompraDTO();
      let transaction = new Transaction();
      transaction.person_uuid = this.proveedorEdit.person.uuid;
      compraDTO.transaction = transaction;
      compraDTO.actual_role = this.actual_role;
      compraDTO.with = [
        "transaction.person.human",
        "transaction.person.legalEntity",
        "transaction.person.city.district.country",
        "transaction.transactionDocuments.accountDocumentType",
        "transaction.transactionDocuments.currency",
        "transaction.transactionProducts.product.measure",
        "transaction.transactionProducts.controlUser",
        "transaction.currentState",
        "batch",
        "qualificationOption"
      ];
      this.subscription.add(
        this._comprasService.editCompra(this.selectedCompra.uuid, compraDTO).subscribe({
          next: res => {
            this.selectedCompra = res.data;
            this.inicializarFormEdit();
            this.obtenerCompras(true);
            this.cerrarEdicionProveedor();
          },
          error: error => {
            console.error(error);
            this.swalService.toastError('top-right', error.error.message);
          }
        })
      )
    }
  }

  cerrarEdicionProveedor() {
    this.proveedorEdit = null;
    this.modalEditarProveedor.close();
  }

  openCloseEditarFechaCompra() {
    this.inEdicionFechaCompra = !this.inEdicionFechaCompra;
    if (this.inEdicionFechaCompra) {
      // Cerramos todos los edit.
      if (this.inEdicionFactura) {
        this.openCloseEditarFactura();
      }
      if (this.inEdicionDescuentos) {
        this.openCloseEditarDescuentosCompra();
      }
      this.compraForm.get('fechaCompra')?.enable();
      this.compraForm.get('estadoCompra')?.enable();
    } else {
      this.compraForm.get('fechaCompra')?.disable();
      this.compraForm.get('estadoCompra')?.disable();
      this.inicializarFormEdit();
    }

  }

  confirmarEdicionFechaCompra() {
    if (this.compraForm.get('estadoCompra')?.value === null) {
      this.swalService.toastError('top-right', 'Debe seleccionar un estado');
      return;
    }
    this.spinner.show();
    let compraDTO = new CompraDTO();
    let transaction = new Transaction();
    transaction.transaction_datetime = this.convertirFechaADateBackend(this.compraForm.get('fechaCompra')?.value);
    transaction.possible_transaction_state_uuid = this.compraForm.get('estadoCompra')?.value;
    compraDTO.transaction = transaction;
    compraDTO.actual_role = this.actual_role;
    compraDTO.with = [
      "transaction.person.human",
      "transaction.person.legalEntity",
      "transaction.person.city.district.country",
      "transaction.transactionDocuments.accountDocumentType",
      "transaction.transactionDocuments.currency",
      "transaction.transactionProducts.product.measure",
      "transaction.transactionProducts.controlUser",
      "transaction.currentState",
      "batch",
      "qualificationOption"];
    this.subscription.add(
      this._comprasService.editCompra(this.selectedCompra.uuid, compraDTO).subscribe({
        next: res => {
          this.selectedCompra = res.data;
          this.inicializarFormEdit();
          this.obtenerCompras(true);
          this.openCloseEditarFechaCompra();
          this.spinner.hide();
        },
        error: error => {
          this.spinner.hide();
          console.error(error);
          this.swalService.toastError('top-right', error.error.message);
        }
      })
    )
  }

  openCloseEditarDescuentosCompra() {
    this.inEdicionDescuentos = !this.inEdicionDescuentos;
    if (this.inEdicionDescuentos) {
      this.mostrarDetalles = true;
      // Cerramos todos los edit.
      if (this.inEdicionFechaCompra) {
        this.openCloseEditarFechaCompra();
      }
      if (this.inEdicionFactura) {
        this.openCloseEditarFactura();
      }
      this.compraForm.get('descuento1')?.enable();
      this.compraForm.get('descuento2')?.enable();
      this.compraForm.get('otrosCargos')?.enable();
      this.compraForm.get('percepcionIIBB')?.enable();
      this.compraForm.get('percepcionRG3337')?.enable();
      this.compraForm.get('calificacion')?.enable();
      this.compraForm.get('calificacionComentarios')?.enable();
    } else {
      this.compraForm.get('descuento1')?.disable();
      this.compraForm.get('descuento2')?.disable();
      this.compraForm.get('otrosCargos')?.disable();
      this.compraForm.get('percepcionIIBB')?.disable();
      this.compraForm.get('percepcionRG3337')?.disable();
      this.compraForm.get('calificacion')?.disable();
      this.compraForm.get('calificacionComentarios')?.disable();
      this.inicializarFormEdit();
    }
  }

  confirmarEdicionDescuentos() {
    let compraDTO = new CompraDTO();
    let transaction = new Transaction();
    transaction.discount1 = this.compraForm.get('descuento1')?.value;
    transaction.discount2 = this.compraForm.get('descuento2')?.value;
    transaction.others = this.compraForm.get('otrosCargos')?.value;
    transaction.perceptionIB = this.compraForm.get('percepcionIIBB')?.value;
    transaction.perceptionRG3337 = this.compraForm.get('percepcionRG3337')?.value;
    compraDTO.transaction = transaction;
    compraDTO.qualification_option_uuid = this.compraForm.get('calificacion')?.value;
    compraDTO.qualification_comments = this.compraForm.get('calificacionComentarios')?.value;
    compraDTO.actual_role = this.actual_role;
    compraDTO.with = [
      "transaction.person.human",
      "transaction.person.legalEntity",
      "transaction.person.city.district.country",
      "transaction.transactionDocuments.accountDocumentType",
      "transaction.transactionDocuments.currency",
      "transaction.transactionProducts.product.measure",
      "transaction.transactionProducts.controlUser",
      "transaction.currentState",
      "batch",
      "qualificationOption"];
    this.subscription.add(
      this._comprasService.editCompra(this.selectedCompra.uuid, compraDTO).subscribe({
        next: res => {
          this.selectedCompra = res.data;
          this.inicializarFormEdit();
          this.openCloseEditarDescuentosCompra();
        },
        error: error => {
          console.error(error);
          this.swalService.toastError('top-right', error.error.message);
        }
      })
    )
  }

  openCloseEditarFactura(type?: string) {
    if (!type) {
      // Está cerrando el modal 
      this.inEdicionFactura = false;
      this.inAltaFactura = false;
    } else if (type === 'NEW') {
      this.inAltaFactura = !this.inAltaFactura;
    } else {
      this.inEdicionFactura = !this.inEdicionFactura;
    }
    if (this.inEdicionFactura || this.inAltaFactura) {
      // Cerramos todos los edit.
      if (this.inEdicionFechaCompra) {
        this.openCloseEditarFechaCompra();
      }
      if (this.inEdicionDescuentos) {
        this.openCloseEditarDescuentosCompra();
      }
      this.compraForm.get('fechaFacturacion')?.enable();
      if (this.inAltaFactura) {
        this.compraForm.get('fechaFacturacion')?.setValue(this.compraForm.get('fechaCompra')?.value);
      }
      this.compraForm.get('tipoComprobante')?.enable();
      this.compraForm.get('prefijoComprobante')?.enable();
      this.compraForm.get('documentoComprobante')?.enable();
      this.compraForm.get('moneda')?.enable();
      this.compraForm.get('tipoCambio')?.enable();
    } else {
      this.compraForm.get('fechaFacturacion')?.disable();
      this.compraForm.get('tipoComprobante')?.disable();
      this.compraForm.get('prefijoComprobante')?.disable();
      this.compraForm.get('documentoComprobante')?.disable();
      this.compraForm.get('moneda')?.disable();
      this.compraForm.get('tipoCambio')?.disable();
      this.inicializarFormEdit();
    }
  }

  confirmarEdicionFactura() {
    this.spinner.show();
    let factura = new FacturaDTO();
    factura.account_document_type_uuid = this.compraForm.get('tipoComprobante')?.value;
    factura.document_datetime = this.convertirFechaADateBackend(this.compraForm.get('fechaFacturacion')?.value);
    factura.prefix_number = this.compraForm.get('prefijoComprobante')?.value;
    factura.document_number = this.compraForm.get('documentoComprobante')?.value;
    factura.currency_uuid = this.compraForm.get('moneda')?.value?.uuid;
    factura.exchange_rate = this.compraForm.get('tipoCambio')?.value;
    factura.actual_role = this.actual_role;
    factura.with = ["accountDocumentType", "currency"];
    if (this.inAltaFactura) {
      factura.transaction_uuid = this.selectedCompra.transaction.uuid;
      this.subscription.add(
        this._facturaService.saveFactura(factura).subscribe({
          next: res => {
            this.tokenService.setToken(res.token);
            this.inAltaFactura = false;
            this.obtenerCompras(true);
            this.showDataCompra(this.selectedCompra);
          },
          error: error => {
            console.error(error);
            this.spinner.hide();
            this.swalService.toastError('top-right', error.error.message);
          }
        })
      )
    } else {
      this.subscription.add(
        this._facturaService.editFactura(this.selectedCompra.transaction.transaction_documents[0].uuid, factura).subscribe({
          next: res => {
            this.tokenService.setToken(res.token);
            this.inEdicionFactura = false;
            this.obtenerCompras(true);

            // this.selectedCompra.transaction.transaction_documents[0] = res.data;
            // this.inicializarFormEdit();
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

  openSwalEliminarFactura() {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar la factura seleccionada?`,
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
        this.eliminarFactura();
      } else if (result.isDenied) {

      }
    })
  }

  eliminarFactura() {
    this.spinner.show();
    this.subscription.add(
      this._facturaService.deleteFactura(this.selectedCompra.transaction?.transaction_documents[0].uuid, this.actual_role.toUpperCase()).subscribe({
        next: res => {
          this.selectedCompra.transaction.transaction_documents = [];
          this.obtenerCompras(true);
          this.inicializarFormEdit();
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

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  confirmarPago() {
    this.isSubmitPago = true;
    if (this.pagoForm.valid) {
      this.spinner.show();
      let pago = new PagoDTO();
      pago.actual_role = this.actual_role;
      pago.payment_datetime = this.convertirFechaADateBackend(this.pagoForm.get('payment_datetime')?.value);
      pago.amount = this.pagoForm.get('amount')?.value;
      pago.currency_uuid = this.pagoForm.get('currency_uuid')?.value?.uuid;
      pago.detail = this.pagoForm.get('detail')?.value;
      pago.exchange_rate = this.pagoForm.get('exchange_rate')?.value ? this.pagoForm.get('exchange_rate')?.value : 1;
      pago.payment_method_uuid = this.pagoForm.get('payment_method')?.value;
      if (!this.inEdicionPago) {
        this.cleanObject(pago);
        pago.transaction_uuid = this.selectedCompra.transaction?.uuid;
        this.subscription.add(
          this._pagoService.savePago(pago).subscribe({
            next: res => {
              this.obtenerCompraPorId(this.selectedCompra.uuid);
              this.cerrarModalPago();
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
      } else {
        this.subscription.add(
          this._pagoService.editPago(this.pagoForm.get('pago_uuid')?.value, pago).subscribe({
            next: res => {
              this.obtenerCompraPorId(this.selectedCompra.uuid);
              this.cerrarModalPago();
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

  openSwalEliminarPago(pago: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar el pago seleccionado?`,
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
        this.eliminarPago(pago);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarPago(pago: any) {
    this.spinner.show();
    this.subscription.add(
      this._pagoService.deletePago(pago.uuid, this.actual_role.toUpperCase()).subscribe({
        next: res => {
          this.obtenerCompraPorId(this.selectedCompra.uuid);
          this.cerrarModalPago();
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

  cerrarModalPago() {
    this.isSubmitPago = false;
    this.inEdicionPago = false;
    this.modalPago.close();
  }

  calcularTotalImporte() {
    let suma = 0;
    this.pagos.forEach(element => {
      if (element.currency.name === 'Pesos') {
        suma = suma + (+element.amount);
      } else {
        suma = suma + (+element.amount * +element.exchange_rate);
      }
    });
    return suma.toFixed(2);
  }

  irAlProducto(event: MouseEvent, data: any) {
    const baseUrl = window.location.origin + window.location.pathname;
    const url = this.router.serializeUrl(
      this.router.createUrlTree([`/dashboard/productos/${data.uuid}`])
    );
    if (event.ctrlKey || event.metaKey) {
      window.open(`${baseUrl}#${url}`, '_blank');
    } else {
      this.router.navigate([`/dashboard/productos/${data.uuid}`])
    }
  }

  toggleSeleccionTodos(event: any) {
    const checked = (event.target as HTMLInputElement).checked;
    const productosTotales = (this.selectedCompra?.transaction?.transaction_products || []);
    productosTotales.forEach((p: any) => {
      const checkbox = document.getElementById('checkbox' + p.uuid) as HTMLInputElement;
      if (checkbox) {
        checkbox.checked = checked;
      }
      if (checked) {
        if (!this.productosSeleccionados.find(uuid => uuid === p.uuid)) {
          this.productosSeleccionados.push(p.uuid);
        }
      } else {
        this.productosSeleccionados = this.productosSeleccionados.filter(uuid => uuid !== p.uuid);
      }
    });
  }

  actualizarSeleccionados(producto: any) {
    const index = this.productosSeleccionados.findIndex(uuid => uuid === producto.uuid);
    if (index === -1) {
      // Lo agregamos
      this.productosSeleccionados.push(producto.uuid);
    } else {
      // Lo eliminamos
      this.productosSeleccionados.splice(index, 1);
    }
  }

  controlarSeleccionados() {
    this.inicializarFormControlTotal();
    this.modalControlarTodos.options = this.modalOptions;
    this.modalControlarTodos.open();
    // Cerramos todos los edit.
    if (this.inEdicionFechaCompra) {
      this.openCloseEditarFechaCompra();
    }
    if (this.inEdicionDescuentos) {
      this.openCloseEditarDescuentosCompra();
    }
    if (this.inEdicionFactura) {
      this.openCloseEditarFactura();
    }
  }
  inicializarFormControlTotal() {
    this.controlTotalForm = new FormGroup({
      producto_controlado: new FormControl(true, []),
      control_ok: new FormControl(null, []),
      control_propio: new FormControl(true, []),
      control_comments: new FormControl(null, []),
      usuario: new FormControl(null, []),
      password: new FormControl(null, [Validators.required]),
    });
    this.onChangeControlForm();
  }

  onChangeControlForm() {
    this.controlTotalForm.get('control_ok')!.valueChanges.subscribe(
      (value: any) => {
        if (value) {
          this.controlTotalForm.get('producto_controlado')?.setValue(true);
        }
      });
  }

  cerrarModalControl() {
    this.modalControlarTodos.close();
  }

  confirmarControlTotal() {
    this.isSubmit = true;
    if (this.controlTotalForm.valid) {
      this.spinner.show();
      let controlTotalDTO = new BatchUpdateControlDTO();
      controlTotalDTO.actual_role = this.actual_role;
      controlTotalDTO.transaction_product_uuids = this.productosSeleccionados;
      controlTotalDTO.control_result = this.controlTotalForm.get('control_ok')?.value ?? false;
      controlTotalDTO.control_comments = this.controlTotalForm.get('control_comments')?.value;

      if (this.controlTotalForm.get('producto_controlado')?.value) {
        controlTotalDTO.control_result = this.controlTotalForm.get('control_ok')?.value ?? false;
        controlTotalDTO.control_comments = this.controlTotalForm.get('control_comments')?.value;
      } else {
        controlTotalDTO.control_result = null;
        controlTotalDTO.control_comments = null;
      }
      if (this.controlTotalForm.get('control_propio')?.value) {
        controlTotalDTO['user->control_user_uuid'] = this.usuarioLogueado.uuid;
        controlTotalDTO.password = this.controlTotalForm.get('password')?.value;
      } else {
        if (this.isEmail(this.controlTotalForm.get('usuario')?.value)) {
          controlTotalDTO.control_user_email = this.controlTotalForm.get('usuario')?.value;
        } else {
          controlTotalDTO.control_user_name = this.controlTotalForm.get('usuario')?.value;
        }
        controlTotalDTO.password = this.controlTotalForm.get('password')?.value;
      }

      this.subscription.add(
        this._transactionProductService.batchUpdateControl(controlTotalDTO).subscribe({
          next: res => {
            this.productosSeleccionados = [];
            this.tokenService.setToken(res.token);
            this.cerrarModalControl();
            this.obtenerCompraPorId(this.selectedCompra.uuid);
            this.isSubmit = false;
            const checkbox = document.getElementById('seleccionarTodos') as HTMLInputElement;
            if (checkbox.checked) {
              checkbox.checked = false;
            }
            const productosTotales = (this.selectedCompra?.transaction?.transaction_products || []);
            productosTotales.forEach((p: any) => {
              const checkbox = document.getElementById('checkbox' + p.uuid) as HTMLInputElement;
              if (checkbox) {
                checkbox.checked = false;
              }
            });
            this.spinner.hide();
          },
          error: error => {
            this.swalService.toastError('top-right', error.error.message);
            this.isSubmit = false;
            this.spinner.hide();
            console.error(error);
          }
        })
      )
    }
  }

  crearPagoTotalCompra() {
    this.spinner.show();
    let pago = new PagoDTO();
    pago.actual_role = this.actual_role;
    pago.transaction_uuid = this.selectedCompra.transaction?.uuid;
    pago.payment_datetime = new Date().toISOString().split('T')[0];
    pago.amount = this.selectedCompra.transaction?.total;
    pago.currency_uuid = this.selectedCompra.transaction?.transaction_documents?.[0].currency?.uuid;
    pago.exchange_rate = this.selectedCompra.transaction?.transaction_documents?.[0].currency?.current_exchange_rate?.rate;
    this.subscription.add(
      this._pagoService.savePago(pago).subscribe({
        next: res => {
          this.obtenerCompraPorId(this.selectedCompra.uuid);
          this.tokenService.setToken(res.token);
          this.spinner.hide();
        },
        error: error => {
          console.error(error);
          this.swalService.toastError('top-right', error.error.message);
          this.spinner.hide();
        }
      })
    );
  }


  buildActiveFilters(): void {
    const list: Array<{ key: string; label: string; display: string }> = [];

    const pushIf = (key: string, label: string, value: any, extra: string = '') => {
      if (value !== null && value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0)) {
        list.push({ key, label, display: `${value}${extra}` });
      }
    };

    if (this.filtroTipoPersona && this.filtroTipoPersona !== 'todos') {
      pushIf(
        '__tipo_persona__',
        'Tipo de persona',
        this.filtroTipoPersona
      );
    }

    pushIf('transaction.person.human.firstname', 'Nombre', this.filtros['transaction.person.human.firstname'].value);
    pushIf('transaction.person.human.lastname', 'Apellido', this.filtros['transaction.person.human.lastname'].value);
    pushIf('transaction.person.legalEntity.company_name', 'Razón social', this.filtros['transaction.person.legalEntity.company_name'].value);
    pushIf('transaction.transactionDocuments.prefix_number', 'Prefijo', this.filtros['transaction.transactionDocuments.prefix_number'].value);
    pushIf('transaction.transactionDocuments.document_number', 'N° documento contable', this.filtros['transaction.transactionDocuments.document_number'].value);
    pushIf('batch.batch_identification', 'Lote', this.filtros['batch.batch_identification'].value, this.filtros['batch.batch_identification'].contiene ? ' (contiene)' : '');
    pushIf('batch.stocks.productInstances.serial_number', 'N° de serie', this.filtros['batch.stocks.productInstances.serial_number'].value, this.filtros['batch.stocks.productInstances.serial_number'].contiene ? ' (contiene)' : '');
    pushIf('__fecha_desde_transaccion__', 'Fecha transacción desde', this.filtroFechaTransacDesde);
    pushIf('__fecha_hasta_transaccion__', 'Fecha transacción hasta', this.filtroFechaTransacHasta);
    pushIf('__fecha_desde_factura__', 'Fecha factura desde', this.filtroFechaFacturaDesde);
    pushIf('__fecha_hasta_factura__', 'Fecha factura hasta', this.filtroFechaFacturaHasta);

    // Tipo comprobante contable (convertir UUID a nombre)
    const tipoComprobanteContable = this.filtros['transaction.transactionDocuments.accountDocumentType.uuid'].value;
    if (tipoComprobanteContable) {
      this.pushById(tipoComprobanteContable, 'transaction.transactionDocuments.accountDocumentType.uuid', 'Tipo comprobante contable', this.tiposDocumentosContables, list);
    }

    const productoId = this.filtros['transaction.transactionProducts.product.uuid'].value;
    if (productoId) {
      this.pushById(productoId, 'transaction.transactionProducts.product.uuid', 'Producto', this.productosGuardados, list);
    }

    this.activeFilters = list;
  }

  pushById(filtroValue: any, filtroName: string, label: string, array: any, list: Array<{ key: string; label: string; display: string }>) {
    const item = array.find((e: any) => e.uuid === filtroValue);
    list.push({ key: filtroName, label: label, display: item.name });
  }

  clearFilter(key: string): void {
    switch (key) {
      case '__tipo_persona__':
        this.filtroTipoPersona = 'todos';
        this.filtros['person.human.uuid'].value = ''
        this.filtros['person.legalEntity.uuid'].value = ''
        break;
      case 'transaction.person.human.firstname':
      case 'transaction.person.human.lastname':
      case 'transaction.person.legalEntity.company_name':
      case 'transaction.transactionDocuments.accountDocumentType.uuid':
      case 'transaction.transactionDocuments.prefix_number':
      case 'transaction.transactionDocuments.document_number':
      case 'transaction.transactionProducts.product.uuid':
        this.filtros[key].value = '';
        break;
      case 'batch.stocks.productInstances.serial_number':
      case 'batch.batch_identification':
        this.filtros[key].value = '';
        this.filtros[key].contiene = true;
        break;
      case '__fecha_desde_transaccion__':
        this.filtroFechaTransacDesde = '';
        break;
      case '__fecha_hasta_transaccion__':
        this.filtroFechaTransacHasta = '';
        break;
      case '__fecha_desde_factura__':
        this.filtroFechaFacturaDesde = '';
        break;
      case '__fecha_hasta_factura__':
        this.filtroFechaFacturaHasta = '';
        break;
    }

    this.buildActiveFilters();
    this.obtenerComprasPorFiltroAvanzado();
  }

}