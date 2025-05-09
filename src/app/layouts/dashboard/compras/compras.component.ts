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
import { Observable, Subject, Subscription, debounceTime, distinctUntilChanged, filter, finalize, forkJoin, map, of, switchMap, tap } from 'rxjs';
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
import { FacturaService } from 'src/app/core/services/factura.service';
import { FacturaDTO } from 'src/app/core/models/request/facturaDTO';
import { timeStamp } from 'console';
import { format } from 'date-fns';

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgScrollbarModule, NgxTippyModule, IconMenuComponent, IconUserComponent,
    IconPlusComponent, IconSearchComponent, IconEditComponent, IconTrashLinesComponent, NgxCustomModalComponent, NgxSpinnerModule, IconSettingsComponent,
    NgSelectModule, IconHorizontalDotsComponent, MenuModule, FontAwesomeModule, NgbPaginationModule, FlatpickrDirective,
    IconPencilComponent
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
  productoForm!: FormGroup;

  cargandoProductos: boolean = true;
  filtroSimpleName: string = '';
  filtroSimpleContiene: boolean = true;
  filtroTipoPersona: string = 'todos';
  isEdicion: boolean = false;
  isShowMailMenu = false;
  isTabDisabled = false;

  //Paginación
  MAX_ITEMS_PER_PAGE = 8;
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

  proveedorInput$ = new Subject<string>();
  proveedores$!: Observable<any[]>;
  loadingProveedores = false;

  productoInput$ = new Subject<string>();
  productos$!: Observable<any[]>;
  loadingProductos = false;

  productoControllable: boolean = false;

  // Referencia al modal para crear y editar países.
  @ViewChild('modalCompra') modalCompra!: NgxCustomModalComponent;
  @ViewChild('modalProducto') modalProducto!: NgxCustomModalComponent;
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
  monedas: any[] = [];

  breadcrumb: any[] = [];
  ubicacionSeleccionada: string | null = null;

  mostrarProductos = true;
  usuarioLogueado: any;
  proveedorEdit: any;
  inEdicionFechaCompra: boolean = false;
  inEdicionDescuentos: boolean = false;
  inEdicionFactura: boolean = false;
  inAltaFactura: boolean = false;
  poseeFactura: boolean = false;

  constructor(public storeData: Store<any>, private swalService: SwalService, private _indexService: IndexService,
    private _comprasService: ComprasProveedorService, private spinner: NgxSpinnerService, private tokenService: TokenService,
    private _catalogoService: CatalogoService, private _userLogged: UserLoggedService,
    private _transactionProductService: TransactionProductoService, private _facturaService: FacturaService) {
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
    this.usuarioLogueado = this._userLogged.getUsuarioLogueado;
    this.obtenerCompras();
    this.obtenerProductosParaFiltro();
    this.obtenerProveedores();
    this.obtenerUbicaciones();
    this.obtenerCatalogos();
  }

  obtenerCompras(alta: boolean = false) {
    // El booleano 'alta' es para que cuando da de alta un nuevo registro, no entre a inicializar, sino siempre muestra el primero de 
    // la lista y no el que acabo de agregar.

    // Inicializamos un objeto vacío para los parámetros
    this.params.with = ["transaction.person.human", "transaction.person.city.district.country", "transaction.person.legalEntity",
      "transaction.transactionDocuments.accountDocumentType", 'transaction.transactionProducts.product', 'batch', 'batch.stocks.productInstances'];
    this.params.paging = this.itemsPerPage;
    this.params.page = this.currentPage;
    this.params.order_by = this.ordenamiento;
    this.params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getComprasProveedorWithParam(this.params, this.actual_role).subscribe({
        next: res => {
          this.compras = res.data;
          if (this.compras.length === 0) {
            this.swalService.toastSuccess('center', 'No existen compras.');
            this.isTabDisabled = true;
            this.tab1 = 'datos-generales';
          } else {
            this.isTabDisabled = false;
          }
          if (!alta && this.compras.length > 0) {
            this.isEdicion = false;
            this.obtenerCompraPorId(this.compras[0]);
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

  obtenerCompraPorId(compra: any) {
    // this.poseeFactura = false;
    this.subscription.add(
      this._comprasService.getCompraById(compra.uuid, this.actual_role).subscribe({
        next: res => {
          this.selectedCompra = res.data;
          this.inicializarFormEdit();
        },
        error: error => {
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
      fechaCompra: new FormControl({ value: this.selectedCompra?.transaction?.transaction_datetime, disabled: true }, []),
      fechaFacturacion: new FormControl({ value: this.getFechaFacturacion(), disabled: true }, []),
      estadoCompra: new FormControl({ value: this.selectedCompra?.transaction?.current_state?.state?.uuid, disabled: true }, []),
      tipoComprobante: new FormControl({ value: this.getTipoComprobante(), disabled: true }, []),
      prefijoComprobante: new FormControl({ value: this.getPrefijoComprobante(), disabled: true }, []),
      documentoComprobante: new FormControl({ value: this.getDocumentoComprobante(), disabled: true }, []),
      // numeroComprobante: new FormControl({ value: this.getNumeroComprobante(), disabled: true }, []),
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

  }

  getFechaFacturacion() {
    if (this.selectedCompra?.transaction?.transaction_documents.length > 0) {
      return this.selectedCompra?.transaction?.transaction_documents[0]?.document_datetime;
    }
    return '';
  }

  getMoneda() {
    if (this.selectedCompra?.transaction?.transaction_documents.length > 0) {
      return this.selectedCompra?.transaction?.transaction_documents[0]?.currency?.uuid;
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

  // getNumeroComprobante() {
  //   if (this.selectedCompra?.transaction?.transaction_documents.length > 0) {
  //     return this.selectedCompra?.transaction?.transaction_documents[0]?.prefix_number + ' ' +
  //       this.selectedCompra?.transaction?.transaction_documents[0]?.document_number
  //   }
  //   return '';
  // }

  getCalificacionTooltip() {
    return this.selectedCompra?.qualification_option?.description;
  }

  // getComentario() {
  //   return this.selectedCompra?.qualification_option?.score + ' - ' + this.selectedCompra?.qualification_option?.name;
  // }

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


  obtenerProductosParaFiltro() {
    const paramsProcesos: any = {};
    paramsProcesos.with = ["productType", "productCategory", "productStates", "measure", "country", "stocks"];
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

  obtenerUbicaciones(uuid?: string) {
    const params: any = {};
    params.with = ["location.location.location.location"];
    params.paging = null;
    params.page = null;
    params.order_by = {};
    params.filters = {
      'location_uuid': { value: uuid ? uuid : 'null', op: '=', contiene: false },
    };

    this.subscription.add(
      this._indexService.getUbicacionesWithParam(params, this.actual_role).subscribe({
        next: res => {
          this.ubicaciones = res.data;
          console.log("🚀 ~ ComprasComponent ~ this._indexService.getUbicacionesWithParam ~ this.ubicaciones:", this.ubicaciones)
        },
        error: error => {
          this.swalService.toastError('top-right', error.error.message);
          console.error(error);
        }
      })
    )
  }

  obtenerCatalogos() {
    forkJoin({
      tiposDocumentosContables: this._catalogoService.getTiposCompraDocumentosContables(this.actual_role),
      posiblesEstadosTransaccion: this._catalogoService.getPosiblesEstadosTransaccion(this.actual_role),
      calificaciones: this._catalogoService.getCalificaciones(this.actual_role),
      monedas: this._indexService.getMonedas(this.actual_role)
    }).subscribe({
      next: res => {
        this.tiposDocumentosContables = res.tiposDocumentosContables.data;
        this.posiblesEstadosTransaccion = res.posiblesEstadosTransaccion.data;
        this.calificaciones = res.calificaciones.data;
        this.monedas = res.monedas.data;
      },
      error: error => {
        console.error('Error cargando catalogos:', error);
      }
    });
  }



  inicializarFormNew() {
    this.newCompraForm = new FormGroup({
      qualification_option_uuid: new FormControl({ value: null, disabled: false }, []),
      qualification_comments: new FormControl({ value: null, disabled: false }, []),
      transaction_datetime: new FormControl({ value: new Date(), disabled: false }, []),
      person_uuid: new FormControl({ value: null, disabled: false }, [Validators.required]),
      vat_after_discount: new FormControl({ value: null, disabled: false }, []),
      discount1: new FormControl({ value: null, disabled: false }, []),
      discount2: new FormControl({ value: null, disabled: false }, []),
      others: new FormControl({ value: null, disabled: false }, []),
      perceptionIB: new FormControl({ value: null, disabled: false }, []),
      perceptionRG3337: new FormControl({ value: null, disabled: false }, []),
      possible_transaction_state_uuid: new FormControl({ value: null, disabled: false }, [Validators.required]),
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

  showFecha(dato: any) {
    const soloFecha = dato.transaction?.transaction_datetime?.substring(0, 10);
    return soloFecha;
  }

  showDataCompra(compra: any) {
    this.isEdicion = false;
    this.obtenerCompraPorId(compra);
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
      this.tab1 = 'datos-generales';
      this.isEdicion = true;
      this.tituloModal = 'Edición compra';
      this.obtenerCompraPorId(compra);
    }
  }

  openModalProducto(type: string) {
    if (type === 'NEW') {
      if (this.isEdicion) {
        this.isEdicion = false;
      }
      this.tituloModal = 'Nuevo producto';
      this.inicializarFormProducto();
      this.modalProducto.options = this.modalOptions;
      this.modalProducto.open();
    }
  }

  inicializarFormProducto() {
    this.productoControllable = false;
    this.productoForm = new FormGroup({
      transaction_uuid: new FormControl({ value: null, disabled: false }, []),
      product_uuid: new FormControl({ value: null, disabled: false }, [Validators.required]),
      quantity: new FormControl({ value: null, disabled: false }, [Validators.required]),
      unit_price: new FormControl({ value: null, disabled: false }, [Validators.required]),
      control_result: new FormControl({ value: false, disabled: false }, [Validators.required]),
      control_user_uuid: new FormControl({ value: null, disabled: false }, []),
      password: new FormControl({ value: null, disabled: false }, []),
      control_comments: new FormControl({ value: null, disabled: false }, []),
      location_uuid: new FormControl({ value: null, disabled: false }, [Validators.required]),
      control_description: new FormControl({ value: null, disabled: true }, []),
    });
    this.onFormProductoChange();
  }
  onFormProductoChange() {
    this.productoForm.get('product_uuid')!.valueChanges.subscribe(
      (producto: any) => {
        if (producto.controllable === 1) {
          this.productoControllable = true;
          this.productoForm.get('control_description')?.setValue(producto.control_description);
        }
      });

    this.productoForm.get('control_result')!.valueChanges.subscribe(
      (value: any) => {
        if (value) {
          ['control_user_uuid', 'password', 'control_comments'].forEach((field) => {
            const control = this.productoForm.get(field);
            control?.setValidators(Validators.required);
          });
        } else {
          ['control_user_uuid', 'password', 'control_comments'].forEach((field) => {
            const control = this.productoForm.get(field);
            control?.clearValidators();
            control?.setErrors(null);
          });
        }
        ['control_user_uuid', 'password', 'control_comments'].forEach((field) => {
          this.productoForm.get(field)?.updateValueAndValidity({ emitEvent: false });
        });
      });

    // this.productoForm.get('location_uuid')!.valueChanges.subscribe(
    //   (location_uuid: string) => {
    //     console.log(location_uuid);
    //     this.obtenerUbicaciones(location_uuid);
    //   });

  }

  onSeleccionUbicacion() {
    const seleccion = this.ubicaciones.find(
      (u) => u.uuid === this.productoForm.get('location_uuid')?.value
    );

    if (!seleccion) return;

    this.breadcrumb.push(seleccion);
    this.productoForm.get('location_uuid')?.setValue(seleccion.uuid);
    this.obtenerUbicaciones(seleccion.uuid);
  }

  irAUbicacion(index: number) {
    const ubicacion = this.breadcrumb[index];
    this.breadcrumb = this.breadcrumb.slice(0, index + 1);
    this.productoForm.get('location_uuid')?.setValue(ubicacion.uuid);
    this.obtenerUbicaciones(ubicacion.uuid);
  }

  resetUbicaciones() {
    this.breadcrumb = [];
    this.obtenerUbicaciones();
  }

  obtenerProveedores() {
    const params: any = {};
    params.with = ["person.city", "person.city.district", "person.city.district.country", "person.human", "person.human.gender",
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
      ? format(form.get('transaction_datetime')?.value, 'yyyy-MM-dd')
      : form.get('transaction_datetime')?.value;
    transaction.transaction_datetime = fechaFormateada;
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

  toggleProductos() {
    this.mostrarProductos = !this.mostrarProductos;
  }

  showCantidad(data: any) {
    if (data.product?.measure?.is_integer === 1) {
      return (+data.quantity).toFixed(0);
    } else {
      return (+data.quantity).toFixed(2);
    }
  }

  isControlRealizado(data: any) {
    return (data.control_result == 1);
  }

  confirmarAltaProducto() {
    this.isSubmit = true;
    if (this.productoForm.valid) {
      this.spinner.show();
      let producto = new ProductoTransaccionDTO();
      producto.actual_role = this.actual_role;
      producto.with = [];
      producto.transaction_uuid = this.selectedCompra?.transaction?.uuid;
      producto.product_uuid = this.productoForm.get('product_uuid')?.value?.uuid;
      producto.quantity = this.productoForm.get('quantity')?.value;
      producto.unit_price = this.productoForm.get('unit_price')?.value;
      producto.control_result = this.productoForm.get('control_result')?.value ?? false;
      if (producto.control_result) {
        producto['user->control_user_uuid'] = this.usuarioLogueado.uuid;
        producto.password = this.productoForm.get('password')?.value;
        producto.control_comments = this.productoForm.get('control_comments')?.value;
      }
      producto.location_uuid = this.productoForm.get('location_uuid')?.value;
      this._transactionProductService.saveTransactionProduct(producto).subscribe({
        next: res => {
          this.cerrarModalAltaProducto();
          this.isSubmit = false;
          this.obtenerCompraPorId(this.selectedCompra);
          this.tokenService.setToken(res.token);
          this.spinner.hide();
        },
        error: error => {
          this.swalService.toastError('top-right', error.error.message);
          console.error(error);
          this.spinner.hide();
        }
      })
    }
  }

  cerrarModalAltaProducto() {
    this.isSubmit = false;
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

  openModalEditarProveedor() {
    this.modalEditarProveedor.options = this.modalOptions;
    this.modalEditarProveedor.open();
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
        "batch",
        "qualificationOption"];
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
    let compraDTO = new CompraDTO();
    let transaction = new Transaction();
    transaction.transaction_datetime = this.compraForm.get('fechaCompra')?.value;
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
      "batch",
      "qualificationOption"];
    this.subscription.add(
      this._comprasService.editCompra(this.selectedCompra.uuid, compraDTO).subscribe({
        next: res => {
          this.selectedCompra = res.data;
          this.inicializarFormEdit();
          this.obtenerCompras(true);
          this.openCloseEditarFechaCompra();
        },
        error: error => {
          console.error(error);
          this.swalService.toastError('top-right', error.error.message);
        }
      })
    )
  }

  openCloseEditarDescuentosCompra() {
    this.inEdicionDescuentos = !this.inEdicionDescuentos;
    if (this.inEdicionDescuentos) {
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
    factura.document_datetime = this.compraForm.get('fechaFacturacion')?.value;
    factura.prefix_number = this.compraForm.get('prefijoComprobante')?.value;
    factura.document_number = this.compraForm.get('documentoComprobante')?.value;
    factura.currency_uuid = this.compraForm.get('moneda')?.value;
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
            this.selectedCompra.transaction.transaction_documents[0] = res.data;
            this.inicializarFormEdit();
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

}