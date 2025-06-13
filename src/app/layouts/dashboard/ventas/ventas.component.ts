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
import { Subscription } from 'rxjs';
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
  filtroSimpleContiene: boolean = true;
  filtroSimpleName: string = '';
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

  filtrosVentas: any = {
    'transactionType.name': { value: 'Venta', op: '=', contiene: false }
  };
  showFilterVentas: boolean = false;
  ordenamiento: any = {
    'transaction_datetime': 'desc'
  };

  ventas: any [] = [];

  constructor(public storeData: Store<any>, private swalService: SwalService, private _indexService: IndexService,
    private _ventaService: VentasService, private spinner: NgxSpinnerService, private tokenService: TokenService,
    private _catalogoService: CatalogoService, private _userLogged: UserLoggedService,
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

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.uuidFromUrl = params.get('uuid') ?? '';
    });
    this.obtenerVentas();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  obtenerVentas(alta: boolean = false) {
    // El booleano 'alta' es para que cuando da de alta un nuevo registro, no entre a inicializar, sino siempre muestra el primero de 
    // la lista y no el que acabo de agregar.

    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = ["person.human", "person.legalEntity", "transactionDocuments"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtrosVentas;

    this.subscription.add(
      this._indexService.getComprasClientesWithParam(params, this.actual_role).subscribe({
        next: res => {
          this.ventas = res.data;
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
      this._ventaService.deleteCompra(venta.uuid, this.actual_role.toUpperCase()).subscribe({
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
}
