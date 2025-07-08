import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { Store } from '@ngrx/store';
import { FlatpickrDirective } from 'angularx-flatpickr';
import { MenuModule } from 'headlessui-angular';
import { ModalOptions, NgxCustomModalComponent } from 'ngx-custom-modal';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { debounceTime, distinctUntilChanged, finalize, forkJoin, map, Observable, of, Subject, Subscription, switchMap, tap } from 'rxjs';
import { CatalogoService } from 'src/app/core/services/catalogo.service';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FacturaService } from 'src/app/core/services/factura.service';
import { IndexService } from 'src/app/core/services/index.service';
import { PagosService } from 'src/app/core/services/pagos.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { TransactionProductoService } from 'src/app/core/services/transactionProducto.service';
import { DatePipe } from '@angular/common';
import { UserLoggedService } from 'src/app/core/services/user-logged.service';
import { VentasService } from 'src/app/core/services/ventas.service';
import { toggleAnimation } from 'src/app/shared/animations';
import { IconEditComponent } from 'src/app/shared/icon/icon-edit';
import { IconHorizontalDotsComponent } from 'src/app/shared/icon/icon-horizontal-dots';
import { IconMenuComponent } from 'src/app/shared/icon/icon-menu';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconSettingsComponent } from 'src/app/shared/icon/icon-settings';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import { IconUserComponent } from 'src/app/shared/icon/icon-user';
import Swal from 'sweetalert2';
import { Location } from '@angular/common';
import { ParametrosIndex } from 'src/app/core/models/request/parametrosIndex';
import { Title } from '@angular/platform-browser';
import { format } from 'date-fns';
import { CompraDTO, Transaction } from 'src/app/core/models/request/compraDTO';
import { VentaDTO } from 'src/app/core/models/request/ventaDTO';
import { FacturaDTO } from 'src/app/core/models/request/facturaDTO';
import { ProductoTransaccionDTO } from 'src/app/core/models/request/productoTransaccionDTO';
import { PagoDTO } from 'src/app/core/models/request/pagoDTO';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgScrollbarModule, NgxTippyModule, IconMenuComponent, IconUserComponent,
    IconPlusComponent, IconSearchComponent, IconEditComponent, IconTrashLinesComponent, NgxCustomModalComponent, NgxSpinnerModule, IconSettingsComponent,
    NgSelectModule, IconHorizontalDotsComponent, MenuModule, FontAwesomeModule, NgbPaginationModule, FlatpickrDirective,
    IconPencilComponent],
  animations: [toggleAnimation],
  providers: [DatePipe],
  templateUrl: './ventas.component.html',
  styleUrl: './ventas.component.css'
})
export class VentasComponent implements OnInit, OnDestroy {

  @ViewChild('offcanvasRight', { static: false }) offcanvasElement!: ElementRef;
  @ViewChild('modalVenta') modalVenta!: NgxCustomModalComponent;
  @ViewChild('modalCliente') modalCliente!: NgxCustomModalComponent;
  @ViewChild('modalComprobante') modalComprobante!: NgxCustomModalComponent;
  @ViewChild('modalProducto') modalProducto!: NgxCustomModalComponent;
  @ViewChild('modalPago') modalPago!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  store: any;
  private subscription: Subscription = new Subscription();

  actual_role: string = '';
  isShowMailMenu = false;
  isEdicion: boolean = false;
  selectedVenta: any;
  uuidFromUrl: string = '';
  isLoadingVentas: boolean = true;
  filtroSimpleName: string = '';
  filtroSimpleContiene: boolean = true;
  filtroTipoPersona: string = 'todos';
  isTabDisabled = false;
  ventaForm!: FormGroup;
  comprobanteForm!: FormGroup;
  productoForm!: FormGroup;
  newVentaForm!: FormGroup;
  pagoForm!: FormGroup;

  isSubmit = false;
  isSubmitPago = false;

  mostrarProductos = true;
  mostrarComprobantes = true;
  mostrarCliente = true;
  mostrarDetalle = true;
  mostrarPagos = true;
  inEdicionProducto: boolean = false;
  inEdicionPago: boolean = false;
  inEdicionComprobante: boolean = false;
  inEdicionDetalles: boolean = false;
  inEdicionRetirado: boolean = false;
  inEdicionCliente: boolean = false;
  inEdicionVenta: boolean = false;
  tituloModal: string = '';
  placeholderCantidad: string = '';

  // Iconos
  iconEye = faEye;
  iconEyeSlash = faEyeSlash;

  //Paginación
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;
  tab1: string = 'datos-generales';

  params = new ParametrosIndex();
  filtroFechaTransacDesde!: string;
  filtroFechaTransacHasta!: string;
  filtroFechaComprobanteDesde: string = '';
  filtroFechaComprobanteHasta: string = '';
  filtrosVentas: any = {
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
  showFilterVentas: boolean = false;
  ordenamiento: any = {
    'transaction.transaction_datetime': 'desc'
  };

  ventas: any[] = [];
  tiposDocumentosContables: any[] = [];
  posiblesEstadosTransaccion: any[] = [];
  ubicaciones: any[] = [];
  monedas: any[] = [];
  metodosDePago: any[] = [];

  productoInput$ = new Subject<string>();
  productos$!: Observable<any[]>;
  loadingProductos = false;

  clienteInput$ = new Subject<string>();
  clientes$!: Observable<any[]>;
  loadingClientes = false;
  clienteEdit: any;

  productosEnPosesion: any[] = [];
  stocks: any[] = [];
  showStocks: boolean = false;
  showSerialNumber: boolean = false;
  mostrarCantidad: boolean = false;

  constructor(public storeData: Store<any>, private swalService: SwalService, private _indexService: IndexService,
    private _ventaService: VentasService, private spinner: NgxSpinnerService, private tokenService: TokenService,
    private _catalogoService: CatalogoService, private _userLogged: UserLoggedService,
    private _transactionProductService: TransactionProductoService, private _facturaService: FacturaService,
    private _transactionDocumentsService: FacturaService, private _pagoService: PagosService, private location: Location, private route: ActivatedRoute,
    private router: Router, private datePipe: DatePipe) {
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

  ngOnInit(): void {
    this.spinner.show();
    this.route.paramMap.subscribe(params => {
      this.uuidFromUrl = params.get('uuid') ?? '';
    });
    this.obtenerVentas();
    this.obtenerClientes();
    this.obtenerProductos();
    this.obtenerCatalogos();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  obtenerVentas(alta: boolean = false) {
    // El booleano 'alta' es para que cuando da de alta un nuevo registro, no entre a inicializar, sino siempre muestra el primero de 
    // la lista y no el que acabo de agregar.

    // Inicializamos un objeto vacío para los parámetros
    this.params.with = ["transaction.person.human",
      "transaction.person.legalEntity",
      "transaction.transactionDocuments.accountDocumentType",
      "transaction.transactionProducts.product",
      "transaction.transactionProducts.product.productType",
      "transaction.transactionProducts.saleProduct.productInstances",
      "transaction.transactionProducts.saleProduct.stock.batch"
    ];
    this.params.paging = this.itemsPerPage;
    this.params.page = this.currentPage;
    this.params.order_by = this.ordenamiento;
    this.params.filters = this.filtrosVentas;

    this.subscription.add(
      this._indexService.getVentasWithParam(this.params, this.actual_role).subscribe({
        next: res => {
          this.ventas = res.data;
          this.modificarPaginacion(res);
          this.tokenService.setToken(res.token);
          if (this.uuidFromUrl) {
            this.obtenerVentaPorId(this.uuidFromUrl);
          } else {
            this.isLoadingVentas = false;
            if (this.ventas.length === 0) {
              this.swalService.toastSuccess('center', 'No existen ventas.');
              this.isTabDisabled = true;
              this.tab1 = 'datos-generales';
              this.selectedVenta = null;
            } else {
              this.isTabDisabled = false;
            }
            if (!alta && this.ventas.length > 0) {
              this.isEdicion = false;
              this.obtenerVentaPorId(this.ventas[0].uuid);
              this.location.replaceState(`/dashboard/ventas/${this.ventas[0].uuid}`);
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
    if (this.ventas.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }

  showName(dato: any) {
    if (dato.transaction?.person?.human) {
      return dato.transaction?.person?.human.firstname + ' ' + dato.transaction?.person?.human.lastname;
    } else {
      return dato.transaction?.person?.legal_entity.company_name;
    }
  }
  showFecha(dato: any) {
    const soloFecha = dato.transaction?.transaction_datetime?.substring(0, 10);
    return soloFecha;
  }
  showDocumento(dato: any) {
    const documentos = dato.transaction?.transaction_documents;

    if (!documentos || documentos.length === 0) {
      return 'Sin documento';
    }
    const docOrden1 = documentos.find((doc: any) => doc.order === 1);
    const docIdent = docOrden1 ? docOrden1.account_document_type.name + '-' + docOrden1.prefix_number + '-' + docOrden1.document_number : 'Sin documento';
    return docIdent;
  }

  obtenerProductos() {
    const params: any = {};
    params.with = ["productType", "productCategory", "productStates", "measure", "country", "stocks"];
    params.paging = 20;
    params.page = null;
    params.order_by = {};
    /* params.filters = {
      'salable': { value: '1', op: '=', contiene: false }
    }; */

    this.productos$ = this.productoInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.loadingProductos = true),
      switchMap((term: string) => {
        if (!term || term.trim().length < 2) {
          this.loadingProductos = false;
          return of([]);
        }
        params.filters = {
          'name': { value: term, op: 'LIKE', contiene: true },
          'salable': { value: 1, op: '=', contiene: false },
          'productStates.possibleProductState.name': { value: 'Vigente', op: '=', contiene: false },
          'productStates.datetime_to': { value: 'null', op: '=', contiene: false },
        };

        return this._indexService.getProductosWithParamAsync(params, this.actual_role).pipe(
          map((res: any) => res.data), //
          finalize(() => this.loadingProductos = false)
        );
      })
    );
  }

  obtenerCatalogos() {
    forkJoin({
      tiposDocumentosContables: this._catalogoService.getTiposVentaDocumentosContables(this.actual_role),
      posiblesEstadosTransaccion: this._catalogoService.getPosiblesEstadosTransaccionVenta(this.actual_role),
      // calificaciones: this._catalogoService.getCalificaciones(this.actual_role),
      monedas: this._indexService.getMonedas(this.actual_role),
      metodos: this._indexService.getMetodosDePagoWithParam(null, this.actual_role)
    }).subscribe({
      next: res => {
        this.tiposDocumentosContables = res.tiposDocumentosContables.data;
        this.posiblesEstadosTransaccion = res.posiblesEstadosTransaccion.data;
        // this.calificaciones = res.calificaciones.data;
        this.monedas = res.monedas.data;
        this.metodosDePago = res.metodos.data;
      },
      error: error => {
        console.error('Error cargando catalogos:', error);
      }
    });
  }

  inicializarFormEdit() {
    this.ventaForm = new FormGroup({
      // Venta
      nombre: new FormControl({ value: this.selectedVenta?.transaction?.person?.human?.firstname, disabled: true }, []),
      apellido: new FormControl({ value: this.selectedVenta?.transaction?.person?.human?.lastname, disabled: true }, []),
      razonSocial: new FormControl({ value: this.selectedVenta?.transaction?.person?.legal_entity?.company_name, disabled: true }, []),
      cuit: new FormControl({ value: this.getCuit(), disabled: true }, []),
      tipoDocumento: new FormControl({ value: this.selectedVenta?.transaction?.person?.human?.document_type?.name, disabled: true }, []),
      numeroDocumento: new FormControl({ value: this.selectedVenta?.transaction?.person?.human?.document_number, disabled: true }, []),
      fechaVenta: new FormControl({ value: this.selectedVenta?.transaction?.transaction_datetime, disabled: true }, []),
      estadoVenta: new FormControl({ value: this.selectedVenta?.transaction?.current_state?.state.uuid, disabled: true }, []),
      calle: new FormControl({ value: this.selectedVenta?.transaction?.person?.street_name, disabled: true }, []),
      numero: new FormControl({ value: this.selectedVenta?.transaction?.person?.door_number, disabled: true }, []),
      ciudad: new FormControl({ value: this.selectedVenta?.transaction?.person?.city?.name, disabled: true }, []),
      pais: new FormControl({ value: this.selectedVenta?.transaction?.person?.city?.district?.country?.name, disabled: true }, []),
      // Detalles
      subtotalSinDescuento: new FormControl({ value: this.selectedVenta?.transaction?.subtotal_before_discount, disabled: true }, []),
      descuento1: new FormControl({ value: this.selectedVenta?.transaction?.discount1, disabled: true }, []),
      descuento2: new FormControl({ value: this.selectedVenta?.transaction?.discount2, disabled: true }, []),
      subtotalConDescuento: new FormControl({ value: this.selectedVenta?.transaction?.subtotal_after_discount, disabled: true }, []),
      otrosCargos: new FormControl({ value: this.selectedVenta?.transaction?.others, disabled: true }, []),
      iva: new FormControl({ value: this.selectedVenta?.transaction?.vat, disabled: true }, []),
      percepcionIIBB: new FormControl({ value: this.selectedVenta?.transaction?.perceptionIB, disabled: true }, []),
      percepcionRG3337: new FormControl({ value: this.selectedVenta?.transaction?.perceptionRG3337, disabled: true }, []),
      total: new FormControl({ value: this.selectedVenta?.transaction?.total, disabled: true }, []),
      // Retira
      nombreRetira: new FormControl({ value: this.selectedVenta?.delivered_to, disabled: true }, []),
      fechaRetira: new FormControl({ value: this.selectedVenta?.delivery_date, disabled: true }, []),
      remito: new FormControl({ value: this.selectedVenta?.delivery_note, disabled: true }, []),
    })

  }

  getCuit() {
    if (this.selectedVenta) {
      if (this.isPersonaFisica()) {
        return this.selectedVenta.transaction?.person?.human?.cuit;
      } else {
        return this.selectedVenta.transaction?.person?.legal_entity?.cuit;
      }
    }
  }

  isPersonaFisica() {
    if (this.selectedVenta?.transaction?.person?.human !== null) {
      return true
    } else {
      return false;
    }
  }

  openCloseEditarRetirado() {
    this.inEdicionRetirado = !this.inEdicionRetirado;
    if (this.inEdicionRetirado) {
      if (this.inEdicionVenta) {
        this.openCloseEditarVenta();
      }
      if (this.inEdicionDetalles) {
        this.openCloseEditarDetalles();
      }
      this.ventaForm.get('nombreRetira')?.enable();
      this.ventaForm.get('fechaRetira')?.enable();
      this.ventaForm.get('remito')?.enable();
    } else {
      this.ventaForm.get('nombreRetira')?.disable();
      this.ventaForm.get('fechaRetira')?.disable();
      this.ventaForm.get('remito')?.disable();
    }

  }

  confirmarRetirado() {
    this.spinner.show();
    let ventaDTO = new VentaDTO();
    ventaDTO.delivered_to = this.ventaForm.get('nombreRetira')?.value;
    ventaDTO.delivery_date = this.ventaForm.get('fechaRetira')?.value;
    ventaDTO.delivery_note = this.ventaForm.get('remito')?.value;
    ventaDTO.actual_role = this.actual_role;
    ventaDTO.with = [
      "transaction.person.human",
      "transaction.person.legalEntity",
      "transaction.person.city.district.country",
      "transaction.transactionDocuments.accountDocumentType",
      "transaction.transactionDocuments.currency",
      "transaction.transactionProducts.product.measure"];
    this.subscription.add(
      this._ventaService.editVenta(this.selectedVenta.uuid, ventaDTO).subscribe({
        next: res => {
          this.selectedVenta = res.data;
          this.inicializarFormEdit();
          this.obtenerVentas(true);
          this.openCloseEditarRetirado();
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

  openModalCliente() {
    this.modalCliente.options = this.modalOptions;
    this.modalCliente.open();
    // Cerramos los edit
    if (this.inEdicionDetalles) {
      this.openCloseEditarDetalles();
    }
    if (this.inEdicionVenta) {
      this.openCloseEditarVenta();
    }
    if (this.inEdicionRetirado) {
      this.openCloseEditarRetirado();
    }
  }

  cerrarModalCliente() {
    this.clienteEdit = null;
    this.modalCliente.close();
  }

  confirmarCliente() {
    if (this.clienteEdit) {
      if (this.clienteEdit?.person?.uuid === this.selectedVenta?.transaction?.person?.uuid) {
        this.swalService.toastError('top-right', 'No puede elegir el cliente actual.');
        return;
      }
      let ventaDTO = new VentaDTO();
      let transaction = new Transaction();
      transaction.person_uuid = this.clienteEdit.person.uuid;
      ventaDTO.transaction = transaction;
      ventaDTO.actual_role = this.actual_role;
      ventaDTO.with = [
        "transaction.person.human",
        "transaction.person.legalEntity",
        "transaction.person.city.district.country",
        "transaction.transactionDocuments.accountDocumentType",
        "transaction.transactionDocuments.currency",
        "transaction.transactionProducts.product.measure"];
      this.subscription.add(
        this._ventaService.editVenta(this.selectedVenta.uuid, ventaDTO).subscribe({
          next: res => {
            this.selectedVenta = res.data;
            this.inicializarFormEdit();
            this.obtenerVentas(true);
            this.cerrarModalCliente();
            this.spinner.hide();
          },
          error: error => {
            console.error(error);
            this.swalService.toastError('top-right', error.error.message);
          }
        })
      )
    }
  }

  openCloseEditarDetalles() {
    this.inEdicionDetalles = !this.inEdicionDetalles;
    if (this.inEdicionDetalles) {
      this.mostrarDetalle = true;
      // Cerramos los edit
      if (this.inEdicionVenta) {
        this.openCloseEditarVenta();
      }
      if (this.inEdicionRetirado) {
        this.openCloseEditarRetirado();
      }
      this.ventaForm.get('descuento1')?.enable();
      this.ventaForm.get('descuento2')?.enable();
      this.ventaForm.get('otrosCargos')?.enable();
      this.ventaForm.get('percepcionIIBB')?.enable();
      this.ventaForm.get('percepcionRG3337')?.enable();
    } else {
      this.ventaForm.get('descuento1')?.disable();
      this.ventaForm.get('descuento2')?.disable();
      this.ventaForm.get('otrosCargos')?.disable();
      this.ventaForm.get('percepcionIIBB')?.disable();
      this.ventaForm.get('percepcionRG3337')?.disable();
      this.inicializarFormEdit();
    }
  }

  confirmarDetalles() {
    this.spinner.show();
    let ventaDTO = new VentaDTO();
    let transaction = new Transaction();
    transaction.discount1 = this.ventaForm.get('descuento1')?.value;
    transaction.discount2 = this.ventaForm.get('descuento2')?.value;
    transaction.others = this.ventaForm.get('otrosCargos')?.value;
    transaction.perceptionIB = this.ventaForm.get('percepcionIIBB')?.value;
    transaction.perceptionRG3337 = this.ventaForm.get('percepcionRG3337')?.value;
    ventaDTO.transaction = transaction;
    ventaDTO.actual_role = this.actual_role;
    ventaDTO.with = [
      "transaction.person.human",
      "transaction.person.legalEntity",
      "transaction.person.city.district.country",
      "transaction.transactionDocuments.accountDocumentType",
      "transaction.transactionDocuments.currency",
      "transaction.transactionProducts.product.measure"];
    this.subscription.add(
      this._ventaService.editVenta(this.selectedVenta.uuid, ventaDTO).subscribe({
        next: res => {
          this.obtenerVentaPorId(this.uuidFromUrl);
          this.openCloseEditarDetalles();
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

  obtenerVentaPorId(uuid: any) {
    this.spinner.show();
    this.subscription.add(
      this._ventaService.getVentaById(uuid, this.actual_role).subscribe({
        next: res => {
          this.selectedVenta = res.data;
          this.inicializarFormEdit();
          this.uuidFromUrl = this.selectedVenta.uuid;
          this.location.replaceState(`/dashboard/ventas/${this.selectedVenta.uuid}`);
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

  showDataVenta(venta: any) {
    if (this.ventas.length == 0 || this.selectedVenta && this.selectedVenta.uuid !== venta.uuid) {
      this.isEdicion = false;
      // Cerramos los edit
      if (this.inEdicionDetalles) {
        this.openCloseEditarDetalles();
      }
      if (this.inEdicionVenta) {
        this.openCloseEditarVenta();
      }
      if (this.inEdicionRetirado) {
        this.openCloseEditarRetirado();
      }
      this.obtenerVentaPorId(venta.uuid);
    }
  }


  openModalVenta(type: string, venta?: any) {
    if (type === 'NEW') {
      if (this.isEdicion) {
        this.isEdicion = false;
        this.inicializarFormEdit(); // Esto es para que no quede inconsistente cuando edita, da de alta y cerra el modal de alta.
      }
      this.tituloModal = 'Nueva venta';
      this.inicializarFormNew();
      this.modalVenta.options = this.modalOptions;
      this.modalVenta.open();
    } else {
      // this.tab1 = 'datos-generales';
      this.isEdicion = true;
      this.tituloModal = 'Edición venta';
      this.obtenerVentaPorId(venta.uuid);
    }
    // Cerramos los edit
    if (this.inEdicionDetalles) {
      this.openCloseEditarDetalles();
    }
    if (this.inEdicionVenta) {
      this.openCloseEditarVenta();
    }
    if (this.inEdicionRetirado) {
      this.openCloseEditarRetirado();
    }
  }
  inicializarFormNew() {
    this.newVentaForm = new FormGroup({
      transaction_datetime: new FormControl({ value: new Date(), disabled: false }, []),
      person_uuid: new FormControl({ value: null, disabled: false }, [Validators.required]),
      // vat_after_discount: new FormControl({ value: null, disabled: false }, []),
      // discount1: new FormControl({ value: null, disabled: false }, []),
      // discount2: new FormControl({ value: null, disabled: false }, []),
      // others: new FormControl({ value: null, disabled: false }, []),
      // perceptionIB: new FormControl({ value: null, disabled: false }, []),
      // perceptionRG3337: new FormControl({ value: null, disabled: false }, []),
      // possible_transaction_state_uuid: new FormControl({ value: null, disabled: false }, []),
    });
    this.onNewForm();
  }
  onNewForm() {

  }

  obtenerVentasPorFiltroSimple() {
    this.filtroTipoPersona = 'todos';
    this.filtrosVentas['transaction.person.human.uuid'].value = '';
    this.filtrosVentas['transaction.person.legalEntity.uuid'].value = '';
    this.filtrosVentas['transaction.transactionDocuments.prefix_number'].value = '';
    this.filtrosVentas['transaction.transactionDocuments.document_number'].value = '';
    this.filtrosVentas['transaction.transactionProducts.product.uuid'].value = '';
    this.filtrosVentas['transaction.transactionDocuments.accountDocumentType.uuid'].value = '';
    this.filtrosVentas['batch.batch_identification'].value = '';
    this.filtrosVentas['batch.stocks.productInstances.serial_number'].value = '';
    // Limpio las fechas
    this.filtroFechaTransacDesde = '';
    this.filtroFechaTransacHasta = '';
    this.filtroFechaComprobanteDesde = '';
    this.filtroFechaComprobanteHasta = '';
    this.params.extraDateFilters = [];

    this.filtrosVentas['transaction.person.human.firstname'].contiene = this.filtroSimpleContiene;
    this.filtrosVentas['transaction.person.human.lastname'].contiene = this.filtroSimpleContiene;
    this.filtrosVentas['transaction.person.legalEntity.company_name'].contiene = this.filtroSimpleContiene;

    if (this.filtroSimpleName) {
      this.filtrosVentas['transaction.person.human.firstname'].value = this.filtroSimpleName;
      this.filtrosVentas['transaction.person.human.lastname'].value = this.filtroSimpleName;
      this.filtrosVentas['transaction.person.legalEntity.company_name'].value = this.filtroSimpleName;
      this.filtrosVentas.operator.value = 'OR';
    } else {
      this.filtrosVentas['transaction.person.human.firstname'].value = '';
      this.filtrosVentas['transaction.person.human.lastname'].value = '';
      this.filtrosVentas['transaction.person.legalEntity.company_name'].value = '';
      this.filtrosVentas.operator.value = '';
    }

    this.obtenerVentas();
  }

  openSwalEliminar(venta: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar la venta seleccionada?`,
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
        this.eliminarVenta(venta);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarVenta(venta: any) {
    this.spinner.show();
    this.subscription.add(
      this._ventaService.deleteVenta(venta.uuid, this.actual_role.toUpperCase()).subscribe({
        next: res => {
          if (this.uuidFromUrl === venta.uuid) {
            // Se blanquea para que si elimina en el que está parado no tire error al recargar, ya que no existe el uuid.
            this.uuidFromUrl = '';
          }
          this.obtenerVentas();
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

  changeTipoPersona() {
    this.filtroSimpleName = '';
    this.filtroSimpleContiene = true;
    this.filtrosVentas.operator.value = '';
    this.filtrosVentas['transaction.person.human.firstname'].value = '';
    this.filtrosVentas['transaction.person.human.lastname'].value = '';
    this.filtrosVentas['transaction.person.legalEntity.company_name'].value = '';
    this.filtrosVentas['transaction.transactionDocuments.prefix_number'].value = '';
    this.filtrosVentas['transaction.transactionDocuments.document_number'].value = '';
    this.filtrosVentas['transaction.transactionProducts.product.uuid'].value = '';
    this.filtrosVentas['transaction.transactionDocuments.accountDocumentType.uuid'].value = '';
    this.filtrosVentas['batch.batch_identification'].value = '';
    this.filtrosVentas['batch.stocks.productInstances.serial_number'].value = '';
    // Limpio las fechas
    this.filtroFechaTransacDesde = '';
    this.filtroFechaTransacHasta = '';
    this.params.extraDateFilters = [];

    if (this.filtroTipoPersona === 'todos') {
      this.filtrosVentas['transaction.person.human.uuid'].value = '';
      this.filtrosVentas['transaction.person.legalEntity.uuid'].value = '';
    } else if (this.filtroTipoPersona === 'fisica') {
      this.filtrosVentas['transaction.person.human.uuid'].value = 'null';
      this.filtrosVentas['transaction.person.legalEntity.uuid'].value = '';
    } else {
      //jurídica
      this.filtrosVentas['transaction.person.human.uuid'].value = '';
      this.filtrosVentas['transaction.person.legalEntity.uuid'].value = 'null';
    }
    this.obtenerVentas();
  }

  obtenerComprasPorFiltroAvanzado() {
    this.filtroSimpleName = '';
    this.filtroSimpleContiene = true;
    this.filtrosVentas.operator.value = '';
    this.params.extraDateFilters = [];
    // Manejar fechas
    if (this.filtroFechaTransacDesde) {
      this.params.extraDateFilters.push(['transaction.transaction_datetime', '>=', this.filtroFechaTransacDesde]);
    }
    if (this.filtroFechaTransacHasta) {
      this.params.extraDateFilters.push(['transaction.transaction_datetime', '<=', this.filtroFechaTransacHasta]);
    }
    if (this.filtroFechaComprobanteDesde) {
      this.params.extraDateFilters.push(['transaction.transactionDocuments.document_datetime', '>=', this.filtroFechaComprobanteDesde]);

    }
    if (this.filtroFechaComprobanteHasta) {
      this.params.extraDateFilters.push(['transaction.transactionDocuments.document_datetime', '<=', this.filtroFechaComprobanteHasta]);

    }
    this.obtenerVentas();
  }

  limpiarFiltros() {
    this.filtroTipoPersona = 'todos';
    this.filtrosVentas['transaction.person.human.uuid'].value = '';
    this.filtrosVentas['transaction.person.legalEntity.uuid'].value = '';
    this.filtrosVentas['transaction.person.human.firstname'].value = '';
    this.filtrosVentas['transaction.person.human.lastname'].value = '';
    this.filtrosVentas['transaction.person.legalEntity.company_name'].value = '';
    this.filtrosVentas['transaction.transactionDocuments.prefix_number'].value = '';
    this.filtrosVentas['transaction.transactionDocuments.document_number'].value = '';
    this.filtrosVentas['transaction.transactionProducts.product.uuid'].value = '';
    this.filtrosVentas['transaction.transactionDocuments.accountDocumentType.uuid'].value = '';
    this.filtrosVentas['batch.batch_identification'].value = '';
    this.filtrosVentas['batch.stocks.productInstances.serial_number'].value = '';
    // Limpio las fechas
    this.filtroFechaTransacDesde = '';
    this.filtroFechaTransacHasta = '';
    this.filtroFechaComprobanteDesde = '';
    this.filtroFechaComprobanteHasta = '';
    this.params.extraDateFilters = [];

    this.obtenerVentas();
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

  getMostrarOcultarProductosTooltip() {
    return this.mostrarProductos ? 'Ocultar' : 'Mostrar';
  }
  getMostrarOcultarComprobantesTooltip() {
    return this.mostrarComprobantes ? 'Ocultar' : 'Mostrar';
  }
  getMostrarOcultarClienteTooltip() {
    return this.mostrarCliente ? 'Ocultar' : 'Mostrar';
  }
  getMostrarOcultarDetalleTooltip() {
    return this.mostrarDetalle ? 'Ocultar' : 'Mostrar';
  }
  getMostrarOcultarPagosTooltip() {
    return this.mostrarPagos ? 'Ocultar' : 'Mostrar';
  }

  toggleProductos() {
    this.mostrarProductos = !this.mostrarProductos;
  }
  toggleComprobantes() {
    this.mostrarComprobantes = !this.mostrarComprobantes;
  }
  toggleCliente() {
    this.mostrarCliente = !this.mostrarCliente;
  }
  toggleDetalle() {
    this.mostrarDetalle = !this.mostrarDetalle;
  }
  togglePagos() {
    this.mostrarPagos = !this.mostrarPagos;
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
          this.obtenerVentaPorId(this.selectedVenta.uuid);
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

  openModalProducto(type: string, producto?: any) {
    if (type === 'NEW') {
      if (this.isEdicion) {
        this.isEdicion = false;
      }
      this.tituloModal = 'Nuevo producto';
      this.obtenerUbicaciones();
      this.inicializarFormProducto();
    } else {
      this.inEdicionProducto = true;
      this.inicializarFormProducto(producto);
      this.tituloModal = 'Edición de producto';
      this.showItems(producto);
    }
    this.modalProducto.options = this.modalOptions;
    this.modalProducto.open();
    // Cerramos los edit
    if (this.inEdicionDetalles) {
      this.openCloseEditarDetalles();
    }
    if (this.inEdicionVenta) {
      this.openCloseEditarVenta();
    }
    if (this.inEdicionRetirado) {
      this.openCloseEditarRetirado();
    }
  }

  showItems(producto: any) {
    if (producto.product.product_type?.stock_controlled === 1) {
      this.showStocks = true;
      this.obtenerStocks(producto.product);
      if (producto.product.assign_serial_number === 0 && producto.product.has_serial_number === 0) {
        this.mostrarCantidad = true;
        this.showSerialNumber = false;
        ['stock_uuid'].forEach((field) => {
          const control = this.productoForm.get(field);
          control?.setValidators(Validators.required);
          control?.disable();
          control?.updateValueAndValidity({ emitEvent: false });
        });
      } else {
        this.mostrarCantidad = false;
        this.showSerialNumber = true;
        ['stock_uuid', 'serial_number'].forEach((field) => {
          const control = this.productoForm.get(field);
          control?.setValidators(Validators.required);
          control?.disable();
          control?.updateValueAndValidity({ emitEvent: false });
        });
      }
    } else {
      this.showStocks = false;
      this.placeholderCantidad = 'Cantidad en ' + producto.measure?.name;
      this.mostrarCantidad = true;
      ['quantity'].forEach((field) => {
        const control = this.productoForm.get(field);
        control?.setValidators(Validators.required);
        control?.updateValueAndValidity({ emitEvent: false });
      });
    }
  }

  compararStocks = (stock1: any, stock2: any) => stock1 && stock2 && stock1.uuid === stock2.uuid;

  inicializarFormProducto(data?: any) {
    this.productoForm = new FormGroup({
      transaction_uuid: new FormControl(data ? data.uuid : null, []),
      product_uuid: new FormControl({ value: data ? data.product : null, disabled: data ? true : false }, [Validators.required]),
      stock_uuid: new FormControl(data ? data.stock : null, []),
      serial_number: new FormControl({ value: data ? data.sale_product?.product_instances[0] : null, disabled: true }, []),
      quantity: new FormControl({ value: data ? this.showCantidad(data) : null, disabled: false }, []),
      unit_price: new FormControl(data ? data.unit_price : null, [Validators.required]),
    })
    this.onFormProductoChange();
  }
  onFormProductoChange() {
    this.productoForm.get('product_uuid')!.valueChanges.subscribe(
      (producto: any) => {
        this.obtenerStocks(producto);
        if (producto.product_type?.stock_controlled === 1) {
          ['stock_uuid'].forEach((field) => {
            const control = this.productoForm.get(field);
            control?.setValidators(Validators.required);
            control?.setValue(null);
            control?.updateValueAndValidity({ emitEvent: false });
          });
          this.productoForm.get('serial_number')?.setValue(null);
          this.showStocks = true;
          // this.stocks = []; // Se limpia el array
          if (producto.assign_serial_number === 0 && producto.has_serial_number === 0) {
            // No asigna ni tiene por lo que pide cantidad
            this.placeholderCantidad = 'Cantidad en ' + producto.measure?.name;
            this.mostrarCantidad = true;
            this.showSerialNumber = false;
            this.productoForm.get('quantity')?.setValue(null);
            ['quantity'].forEach((field) => {
              const control = this.productoForm.get(field);
              control?.setValidators(Validators.required);
              control?.updateValueAndValidity({ emitEvent: false });
            });
          } else {
            // Asigna o tiene número de serie
            this.mostrarCantidad = false;
            this.placeholderCantidad = '';
            this.showSerialNumber = true;
            this.productoForm.get('quantity')?.setValue(1);
            ['quantity'].forEach((field) => {
              const control = this.productoForm.get(field);
              control?.setValidators([]);
              control?.updateValueAndValidity({ emitEvent: false });
            });
          }
        } else {
          this.placeholderCantidad = 'Cantidad en ' + producto.measure?.name;
          this.mostrarCantidad = true;
          this.productoForm.get('quantity')?.setValue(null);
          ['quantity'].forEach((field) => {
            const control = this.productoForm.get(field);
            control?.setValidators(Validators.required);
            control?.updateValueAndValidity({ emitEvent: false });
          });
          // No tiene stock controlled por lo que no muestra el select de stocks.
          this.showStocks = false;
          ['stock_uuid'].forEach((field) => {
            const control = this.productoForm.get(field);
            control?.setValidators([]);
            control?.updateValueAndValidity({ emitEvent: false });
          });
        }
      });

    this.productoForm.get('stock_uuid')!.valueChanges.subscribe(
      (stock: any) => {
        if (stock && !this.mostrarCantidad) {
          // Tiene o asigna numero de serie
          this.obtenerProductosEnPosesion(stock.uuid);
          ['serial_number'].forEach((field) => {
            const control = this.productoForm.get(field);
            control?.setValidators(Validators.required);
            control?.enable();
            control?.updateValueAndValidity({ emitEvent: false });
          });
        } else {
          ['serial_number'].forEach((field) => {
            const control = this.productoForm.get(field);
            control?.setValidators([]);
            control?.disable();
            control?.updateValueAndValidity({ emitEvent: false });
          });
        }
      });
  }

  obtenerStocks(producto: any) {
    const params: any = {};
    params.with = ["batch"];
    params.paging = null;
    params.page = null;
    params.order_by = {};
    params.filters = {
      'product.uuid': { value: producto.uuid, op: '=', contiene: false },
      'total_amount': { value: 0, op: '>', contiene: false },
    };

    this.subscription.add(
      this._indexService.getStocksWithParam(params, this.actual_role).subscribe({
        next: res => {
          this.stocks = res.data.map((stock: any) => ({
            ...stock,
            nombreCompleto: this.armarStock(producto, stock)
          }));
          if (producto.product_type?.stock_controlled === 0) {
            // Se setea en el stock_uuid del form el único elemento
            this.productoForm.get('stock_uuid')?.setValue(this.stocks[0]);
          }
        },
        error: error => {
          this.swalService.toastError('top-right', error.error.message);
          console.error(error);
        }
      })
    )
  }

  armarStock(producto: any, stock: any) {
    let amount;
    if (producto.measure?.is_integer === 1) {
      amount = (+stock.total_amount).toFixed(0);
    } else {
      amount = (+stock.total_amount).toFixed(2);
    }
    return `${this.datePipe.transform(stock.created_at, 'yyyy-MM-dd')} | (${stock.batch != null ? stock.batch.batch_identification : "Lote único"}) | ${amount}`
  }

  obtenerProductosEnPosesion(stock_uuid: string) {
    const params: any = {};
    params.with = [];
    params.paging = null;
    params.page = null;
    params.order_by = {
      'serial_number': 'asc'
    };
    params.filters = {
      'stock_uuid': { value: stock_uuid, op: '=', contiene: false }
    };

    this.subscription.add(
      this._indexService.getProductosEnPosesionWithParam(params, this.actual_role).subscribe({
        next: res => {
          this.productosEnPosesion = res.data;
        },
        error: error => {
          this.swalService.toastError('top-right', error.error.message);
          console.error(error);
        }
      })
    )
  }

  confirmarProducto() {
    this.isSubmit = true;
    if (this.productoForm.valid) {
      this.spinner.show();
      let productoTransaccionDTO = new ProductoTransaccionDTO();
      productoTransaccionDTO.actual_role = this.actual_role;
      productoTransaccionDTO.transaction_uuid = this.selectedVenta.transaction?.uuid;
      productoTransaccionDTO.product_uuid = this.productoForm.get('product_uuid')?.value?.uuid;
      productoTransaccionDTO.quantity = this.productoForm.get('quantity')?.value;
      productoTransaccionDTO.unit_price = this.productoForm.get('unit_price')?.value;
      productoTransaccionDTO.stock_uuid = this.productoForm.get('stock_uuid')?.value?.uuid;
      productoTransaccionDTO.serial_number = this.productoForm.get('serial_number')?.value?.serial_number;
      if (!this.inEdicionProducto) {
        this.subscription.add(
          this._transactionProductService.saveTransactionProduct(productoTransaccionDTO).subscribe({
            next: res => {
              this.tokenService.setToken(res.token);
              this.isSubmit = false;
              this.inEdicionProducto = false;
              this.obtenerVentaPorId(this.selectedVenta.uuid);
              this.cerrarModalProducto();
              this.spinner.hide();
            },
            error: error => {
              this.swalService.toastError('top-right', error.error.message);
              this.isSubmit = false;
              console.error(error);
              this.spinner.hide();
            }
          })
        )
      } else {
        delete productoTransaccionDTO.transaction_uuid;
        delete productoTransaccionDTO.stock_uuid;
        delete productoTransaccionDTO.serial_number;
        delete productoTransaccionDTO.product_uuid;
        this.subscription.add(
          this._transactionProductService.editTransactionProduct(this.productoForm.get('transaction_uuid')?.value, productoTransaccionDTO).subscribe({
            next: res => {
              this.tokenService.setToken(res.token);
              this.isSubmit = false;
              this.inEdicionProducto = false;
              this.obtenerVentaPorId(this.selectedVenta.uuid);
              this.cerrarModalProducto();
              this.spinner.hide();
            },
            error: error => {
              this.swalService.toastError('top-right', error.error.message);
              this.isSubmit = false;
              console.error(error);
              this.spinner.hide();
            }
          })
        )
      }
    }
  }

  cerrarModalProducto() {
    this.isSubmit = false;
    this.inEdicionProducto = false;
    this.showStocks = false;
    this.mostrarCantidad = false;
    this.showSerialNumber = false;
    this.modalProducto.close();
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

  obtenerClientes() {
    const params: any = {};
    params.with = ["person.city", "person.city.district", "person.city.district.country", "person.human", "person.human.gender",
      "person.human.documentType", "person.human.user", "person.legalEntity"];
    params.paging = 10;
    params.page = 1;
    params.order_by = {};
    params.filters = {};

    this.clientes$ = this.clienteInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.loadingClientes = true),
      switchMap((term: string) => {
        if (!term || term.trim().length < 2) {
          this.loadingClientes = false;
          return of([]);
        }
        params.filters = {
          operator: { value: 'OR' },
          'person.human.firstname': { value: term, op: 'LIKE', contiene: true },
          'person.human.lastname': { value: term, op: 'LIKE', contiene: true },
          'person.legalEntity.company_name': { value: term, op: 'LIKE', contiene: true }
        };

        return this._indexService.getClientesWithParamAsync(params, this.actual_role).pipe(
          map((res: any) => res.data.map((proveedor: any) => ({
            ...proveedor,
            nombreCompleto: this.bindName(proveedor)
          }))),
          finalize(() => this.loadingClientes = false)
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

  cerrarModal() {
    this.isSubmit = false;
    this.modalVenta.close();
  }

  confirmarVenta(form: FormGroup) {
    this.isSubmit = true;
    if (form.valid) {
      this.spinner.show();
      let venta = new VentaDTO();
      this.armarDTOVenta(venta, form);
      if (!this.isEdicion) {
        this.subscription.add(
          this._ventaService.saveVenta(venta).subscribe({
            next: res => {
              this.spinner.hide();
              this.obtenerVentas(true);
              this.cerrarModal();
              this.showDataVenta(res.data);
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
          this._ventaService.editVenta(this.selectedVenta.uuid, venta).subscribe({
            next: res => {
              this.ventas = [...this.ventas.map(p =>
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

  armarDTOVenta(venta: VentaDTO, form: FormGroup) {
    venta.actual_role = this.actual_role;
    let transaction = new Transaction();
    transaction.person_uuid = form.get('person_uuid')?.value.person.uuid;
    const fechaFormateada = form.get('transaction_datetime')?.value instanceof Date
      ? format(form.get('transaction_datetime')?.value, 'yyyy-MM-dd')
      : form.get('transaction_datetime')?.value;
    transaction.transaction_datetime = fechaFormateada;

    // transaction.possible_transaction_state_uuid = form.get('possible_transaction_state_uuid')?.value;
    venta.transaction = transaction;

    if (!this.isEdicion) {
      this.cleanObject(venta);
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

  openCloseEditarVenta() {
    this.inEdicionVenta = !this.inEdicionVenta;
    if (this.inEdicionVenta) {
      // Cerramos los edit
      if (this.inEdicionDetalles) {
        this.openCloseEditarDetalles();
      }
      if (this.inEdicionRetirado) {
        this.openCloseEditarRetirado();
      }
      this.ventaForm.get('fechaVenta')?.enable();
      this.ventaForm.get('estadoVenta')?.enable();
    } else {
      this.ventaForm.get('fechaVenta')?.disable();
      this.ventaForm.get('estadoVenta')?.disable();
      this.inicializarFormEdit();
    }
  }
  confirmarEdicionVenta() {
    if (this.ventaForm.get('estadoVenta')?.value === null) {
      this.swalService.toastError('top-right', 'Debe seleccionar un estado');
      return;
    }
    this.spinner.show();
    let ventaDTO = new VentaDTO();
    let transaction = new Transaction();
    transaction.transaction_datetime = this.ventaForm.get('fechaVenta')?.value;
    transaction.possible_transaction_state_uuid = this.ventaForm.get('estadoVenta')?.value;
    ventaDTO.transaction = transaction;
    ventaDTO.actual_role = this.actual_role;
    ventaDTO.with = [
      "transaction.person.human",
      "transaction.person.legalEntity",
      "transaction.person.city.district.country",
      "transaction.transactionDocuments.accountDocumentType",
      "transaction.transactionDocuments.currency",
      "transaction.transactionProducts.product.measure"];
    this.subscription.add(
      this._ventaService.editVenta(this.selectedVenta.uuid, ventaDTO).subscribe({
        next: res => {
          this.selectedVenta = res.data;
          this.inicializarFormEdit();
          this.obtenerVentas(true);
          this.openCloseEditarVenta();
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


  openSwalEliminarComprobante(comprobante: any) {
    Swal.fire({
      title: '',
      text: `¿Desea eliminar el comprobante seleccionado?`,
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
        this.eliminarComprobante(comprobante);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarComprobante(comprobante: any) {
    this.spinner.show();
    this.subscription.add(
      this._transactionDocumentsService.deleteFactura(comprobante.uuid, this.actual_role.toUpperCase()).subscribe({
        next: res => {
          // let comprobantes = this.selectedVenta.transaction?.transaction_documents;
          // const index = comprobantes.findIndex((p: any) => p.uuid === comprobante.uuid);
          // if (index !== -1) {
          //   comprobantes.splice(index, 1);
          // }
          this.obtenerVentaPorId(this.selectedVenta.uuid);
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

  cerrarModalComprobante() {
    this.isSubmit = false;
    this.modalComprobante.close();
  }

  openModalComprobante(type: string, data?: any) {
    if (type === 'NEW') {
      if (this.isEdicion) {
        this.isEdicion = false;
      }
      this.tituloModal = 'Nuevo comprobante';
      this.inicializarNewFormComprobante();
    } else {
      this.inEdicionComprobante = true;
      this.tituloModal = 'Edición de comprobante';
      this.inicializarNewFormComprobante(data);
    }
    this.modalComprobante.options = this.modalOptions;
    this.modalComprobante.open();
    // Cerramos los edit
    if (this.inEdicionDetalles) {
      this.openCloseEditarDetalles();
    }
    if (this.inEdicionVenta) {
      this.openCloseEditarVenta();
    }
    if (this.inEdicionRetirado) {
      this.openCloseEditarRetirado();
    }
  }

  inicializarNewFormComprobante(data?: any) {
    this.comprobanteForm = new FormGroup({
      comprobante_uuid: new FormControl(data ? data.uuid : null, []),
      account_document_type_uuid: new FormControl(data ? data.account_document_type?.uuid : null, [Validators.required]),
      document_datetime: new FormControl(data ? data.document_datetime : new Date(), []),
      prefix_number: new FormControl(data ? data.prefix_number : null, []),
      document_number: new FormControl(data ? data.document_number : null, []),
      currency_uuid: new FormControl({ value: data ? data.currency : null, disabled: false }, [Validators.required]),
      exchange_rate: new FormControl({ value: data ? data.exchange_rate : null, disabled: data ? data.currency?.name === 'Pesos' : false }, [Validators.required])
    })
    this.onChange();
  }
  onChange() {
    this.comprobanteForm.get('currency_uuid')!.valueChanges.subscribe(
      (value: any) => {
        if (value.name === 'Pesos') {
          this.comprobanteForm.get('exchange_rate')?.setValue(1);
          this.comprobanteForm.get('exchange_rate')?.disable();
        } else {
          this.comprobanteForm.get('exchange_rate')?.setValue(null);
          this.comprobanteForm.get('exchange_rate')?.enable();
        }
      });
  }

  confirmarComprobante() {
    this.isSubmit = true;
    if (this.comprobanteForm.valid) {
      this.spinner.show();
      let comprobante = new FacturaDTO();
      comprobante.transaction_uuid = this.selectedVenta.transaction?.uuid;
      comprobante.account_document_type_uuid = this.comprobanteForm.get('account_document_type_uuid')?.value;
      const fechaFormateada = this.comprobanteForm.get('document_datetime')?.value instanceof Date
        ? format(this.comprobanteForm.get('document_datetime')?.value, 'yyyy-MM-dd')
        : this.comprobanteForm.get('document_datetime')?.value;
      comprobante.document_datetime = fechaFormateada;
      comprobante.prefix_number = this.comprobanteForm.get('prefix_number')?.value;
      comprobante.document_number = this.comprobanteForm.get('document_number')?.value;
      comprobante.currency_uuid = this.comprobanteForm.get('currency_uuid')?.value?.uuid;
      comprobante.exchange_rate = this.comprobanteForm.get('exchange_rate')?.value;
      comprobante.actual_role = this.actual_role;
      if (!this.inEdicionComprobante) {
        this.subscription.add(
          this._transactionDocumentsService.saveFactura(comprobante).subscribe({
            next: res => {
              this.tokenService.setToken(res.token);
              this.isSubmit = false;
              this.obtenerVentaPorId(this.selectedVenta.uuid);
              this.cerrarModalComprobante();
              this.spinner.hide();
            },
            error: error => {
              this.spinner.hide();
              this.swalService.toastError('top-right', error.error.message);
              console.error(error);
            }
          })
        )
      } else {
        delete comprobante.transaction_uuid;
        this.subscription.add(
          this._transactionDocumentsService.editFactura(this.comprobanteForm.get('comprobante_uuid')?.value, comprobante).subscribe({
            next: res => {
              this.tokenService.setToken(res.token);
              this.isSubmit = false;
              this.obtenerVentaPorId(this.selectedVenta.uuid);
              this.cerrarModalComprobante();
              this.inEdicionComprobante = false;
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

  showCantidad(data: any) {
    if (data.product?.measure?.is_integer === 1) {
      return (+data.quantity).toFixed(0);
    } else {
      return (+data.quantity).toFixed(2);
    }
  }

  showPrecioTotal(data: any) {
    return (data.quantity * data.unit_price).toFixed(2);
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
    // Cerramos los edit
    if (this.inEdicionDetalles) {
      this.openCloseEditarDetalles();
    }
    if (this.inEdicionVenta) {
      this.openCloseEditarVenta();
    }
    if (this.inEdicionRetirado) {
      this.openCloseEditarRetirado();
    }
  }

  inicializarFormPago(data?: any) {
    this.pagoForm = new FormGroup({
      pago_uuid: new FormControl({ value: data ? data.uuid : null, disabled: false }, []),
      payment_datetime: new FormControl({ value: data ? data.payment_datetime : null, disabled: false }, this.inEdicionPago ? [] : [Validators.required]),
      payment_method: new FormControl({ value: data ? data.payment_method?.uuid : null, disabled: false }, this.inEdicionPago ? [] : [Validators.required]),
      amount: new FormControl({ value: data ? data.amount : null, disabled: false }, this.inEdicionPago ? [] : [Validators.required]),
      detail: new FormControl({ value: data ? data.detail : null, disabled: false }, []),
      currency_uuid: new FormControl({ value: data ? data.currency : null, disabled: false }, this.inEdicionPago ? [] : [Validators.required]),
      exchange_rate: new FormControl({ value: data ? data.exchange_rate : null, disabled: false }, this.inEdicionPago ? [] : [Validators.required]),
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

  cerrarModalPago() {
    this.isSubmitPago = false;
    this.inEdicionPago = false;
    this.modalPago.close();
  }

  confirmarPago() {
    this.isSubmitPago = true;
    if (this.pagoForm.valid) {
      this.spinner.show();
      let pago = new PagoDTO();
      pago.actual_role = this.actual_role;
      pago.payment_datetime = this.pagoForm.get('payment_datetime')?.value;
      pago.amount = this.pagoForm.get('amount')?.value;
      pago.currency_uuid = this.pagoForm.get('currency_uuid')?.value?.uuid;
      pago.detail = this.pagoForm.get('detail')?.value;
      pago.exchange_rate = this.pagoForm.get('exchange_rate')?.value ? this.pagoForm.get('exchange_rate')?.value : 1;
      pago.payment_method_uuid = this.pagoForm.get('payment_method')?.value;
      if (!this.inEdicionPago) {
        pago.transaction_uuid = this.selectedVenta.transaction?.uuid;
        this.subscription.add(
          this._pagoService.savePago(pago).subscribe({
            next: res => {
              this.obtenerVentaPorId(this.selectedVenta.uuid);
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
              this.obtenerVentaPorId(this.selectedVenta.uuid);
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
          this.obtenerVentaPorId(this.selectedVenta.uuid);
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

}
