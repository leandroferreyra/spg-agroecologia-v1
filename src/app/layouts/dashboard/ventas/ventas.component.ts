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
import { UbicacionesService } from 'src/app/core/services/ubicaciones.service';
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

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgScrollbarModule, NgxTippyModule, IconMenuComponent, IconUserComponent,
    IconPlusComponent, IconSearchComponent, IconEditComponent, IconTrashLinesComponent, NgxCustomModalComponent, NgxSpinnerModule, IconSettingsComponent,
    NgSelectModule, IconHorizontalDotsComponent, MenuModule, FontAwesomeModule, NgbPaginationModule, FlatpickrDirective,
    IconPencilComponent],
  animations: [toggleAnimation],
  templateUrl: './ventas.component.html',
  styleUrl: './ventas.component.css'
})
export class VentasComponent implements OnInit, OnDestroy {

  @ViewChild('offcanvasRight', { static: false }) offcanvasElement!: ElementRef;
  @ViewChild('modalVenta') modalVenta!: NgxCustomModalComponent;
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
  newVentaForm!: FormGroup;
  isSubmit = false;

  mostrarProductos = true;
  mostrarComprobantes = true;
  inEdicionProducto: boolean = false;


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

  productoInput$ = new Subject<string>();
  productos$!: Observable<any[]>;
  loadingProductos = false;

  clienteInput$ = new Subject<string>();
  clientes$!: Observable<any[]>;
  loadingClientes = false;

  tituloModal: string = '';

  inEdicionVenta: boolean = false;
  // inEdicionDescuentos: boolean = false;
  // inEdicionFactura: boolean = false;
  // inEdicionProducto: boolean = false;
  // inEdicionPago: boolean = false;


  constructor(public storeData: Store<any>, private swalService: SwalService, private _indexService: IndexService,
    private _ventaService: VentasService, private spinner: NgxSpinnerService, private tokenService: TokenService,
    private _catalogoService: CatalogoService, private _userLogged: UserLoggedService,
    private _transactionProductService: TransactionProductoService, private _facturaService: FacturaService,
    private titleService: Title, private _pagoService: PagosService, private location: Location, private route: ActivatedRoute,
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
      "transaction.transactionDocuments"];
    this.params.paging = this.itemsPerPage;
    this.params.page = this.currentPage;
    this.params.order_by = this.ordenamiento;
    this.params.filters = this.filtrosVentas;

    this.subscription.add(
      this._indexService.getVentasWithParam(this.params, this.actual_role).subscribe({
        next: res => {
          this.ventas = res.data;
          console.log("🚀 ~ VentasComponent ~ this._indexService.getComprasClientesWithParam ~ this.ventas:", this.ventas)
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
    return docOrden1?.document_number ?? 'Sin documento';
  }

  obtenerProductos() {
    const params: any = {};
    params.with = ["productType", "productCategory", "productStates", "measure", "country", "stocks"];
    params.paging = 20;
    params.page = null;
    params.order_by = {};
    params.filters = {};

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
      // monedas: this._indexService.getMonedas(this.actual_role)
    }).subscribe({
      next: res => {
        this.tiposDocumentosContables = res.tiposDocumentosContables.data;
        this.posiblesEstadosTransaccion = res.posiblesEstadosTransaccion.data;
        // this.calificaciones = res.calificaciones.data;
        // this.monedas = res.monedas.data;
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
      razonSocial: new FormControl({ value: this.selectedVenta?.transaction?.person?.legal_entity?.company_name, disabled: true }, []), cuit: new FormControl({ value: this.getCuit(), disabled: true }, []),
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

  // showVentaByUuid() {
  //   this.subscription.add(
  //     this._ventaService.getVentaById(this.uuidFromUrl, this.actual_role).subscribe({
  //       next: res => {
  //         this.showDataVenta(res.data);
  //         this.isLoadingVentas = false;
  //         this.tokenService.setToken(res.token);
  //       },
  //       error: error => {
  //         console.error(error);
  //       }
  //     })
  //   )
  // }

  obtenerVentaPorId(uuid: any) {
    this.spinner.show();
    this.subscription.add(
      this._ventaService.getVentaById(uuid, this.actual_role).subscribe({
        next: res => {
          this.selectedVenta = res.data;
          console.log("🚀 ~ VentasComponent ~ this._ventaService.getVentaById ~ this.selectedVenta:", this.selectedVenta)
          // this.obtenerPagos(this.selectedVenta?.transaction?.uuid);
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
      this.obtenerVentaPorId(venta.uuid);
    }
    // this.isEdicion = false;
    // this.location.replaceState(`/dashboard/ventas/${venta.uuid}`);
    // this.inicializarFormEdit(venta);
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
      possible_transaction_state_uuid: new FormControl({ value: null, disabled: false }, []),
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

  toggleProductos() {
    this.mostrarProductos = !this.mostrarProductos;
  }
  toggleComprobantes() {
    this.mostrarComprobantes = !this.mostrarComprobantes;
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
          let productos = this.selectedVenta.transaction.transaction_products;
          const index = productos.findIndex((p: any) => p.uuid === producto.uuid);
          if (index !== -1) {
            productos.splice(index, 1);
          }
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
      // this.inicializarFormProducto();
      // this.modalProducto.options = this.modalOptions;
      // this.modalProducto.open();
    } else {
      this.inEdicionProducto = true;
      this.tituloModal = 'Edición de producto';
      // if (producto.product?.stocks?.length > 0 && producto.product.stocks[0].location !== null) {
      //   this.getParentsFromLocation(producto.product.stocks[0].location);
      //   this.obtenerUbicaciones(producto.product.stocks[0].location.uuid);
      // } else {
      //   this.obtenerUbicaciones();
      // }
      // this.inicializarFormProducto(producto);
      // this.modalProducto.options = this.modalOptions;
      // this.modalProducto.open();
    }
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

    transaction.possible_transaction_state_uuid = form.get('possible_transaction_state_uuid')?.value;
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


}
