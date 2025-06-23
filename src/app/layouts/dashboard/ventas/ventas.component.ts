import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { Store } from '@ngrx/store';
import { FlatpickrDirective } from 'angularx-flatpickr';
import { MenuModule } from 'headlessui-angular';
import { NgxCustomModalComponent } from 'ngx-custom-modal';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { debounceTime, distinctUntilChanged, finalize, forkJoin, map, Observable, of, Subject, Subscription, switchMap, tap } from 'rxjs';
import { CatalogoService } from 'src/app/core/services/catalogo.service';
import { ComprasProveedorService } from 'src/app/core/services/comprasProveedor.service';
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

  productoInput$ = new Subject<string>();
  productos$!: Observable<any[]>;
  loadingProductos = false;


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
            this.showVentaByUuid();
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
              this.inicializarFormEdit(this.ventas[0]);
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
      // posiblesEstadosTransaccion: this._catalogoService.getPosiblesEstadosTransaccion(this.actual_role),
      // calificaciones: this._catalogoService.getCalificaciones(this.actual_role),
      // monedas: this._indexService.getMonedas(this.actual_role)
    }).subscribe({
      next: res => {
        this.tiposDocumentosContables = res.tiposDocumentosContables.data;
        // this.posiblesEstadosTransaccion = res.posiblesEstadosTransaccion.data;
        // this.calificaciones = res.calificaciones.data;
        // this.monedas = res.monedas.data;
      },
      error: error => {
        console.error('Error cargando catalogos:', error);
      }
    });
  }

  inicializarFormEdit(data: any) {

  }


  showVentaByUuid() {
    this.subscription.add(
      this._ventaService.getVentaById(this.uuidFromUrl, this.actual_role).subscribe({
        next: res => {
          this.showDataVenta(res.data);
          this.isLoadingVentas = false;
          this.tokenService.setToken(res.token);
        },
        error: error => {
          console.error(error);
        }
      })
    )
  }

  showDataVenta(venta: any) {
    this.isEdicion = false;
    this.location.replaceState(`/dashboard/ventas/${venta.uuid}`);
    this.inicializarFormEdit(venta);
  }


  openModalVenta(type: string, venta?: any) {

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

}
