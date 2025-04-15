import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { CompraProveedorDTO } from 'src/app/core/models/request/compraProveedorDTO';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons'; import { ComprasProveedorService } from 'src/app/core/services/comprasProveedor.service';
import { CuentasProveedorService } from 'src/app/core/services/cuentasProveedor.service';
import { IndexService } from 'src/app/core/services/index.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';
import { IconClipboardTextComponent } from 'src/app/shared/icon/icon-clipboard-text';
import { IconShoppingCartComponent } from 'src/app/shared/icon/icon-shopping-cart';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { slideDownUp, toggleAnimation } from 'src/app/shared/animations';
import { Paginador } from 'src/app/core/models/request/paginador';


@Component({
  selector: 'app-compras-proveedor',
  standalone: true,
  imports: [CommonModule, NgbPaginationModule, NgxSpinnerModule, NgxTippyModule, NgxCustomModalComponent, FormsModule, ReactiveFormsModule,
    NgSelectModule, IconTrashLinesComponent, IconPencilComponent, IconSearchComponent, IconPlusComponent, FontAwesomeModule,
    IconClipboardTextComponent, IconShoppingCartComponent
  ],
  templateUrl: './compras-proveedor.component.html',
  styleUrl: './compras-proveedor.component.css',
  animations: [toggleAnimation, slideDownUp]
})
export class ComprasProveedorComponent implements OnInit, OnDestroy {

  @Input() proveedor: any;
  @Input() rol!: string;
  compras: any[] = [];
  productosTotales: any[] = [];

  private subscription: Subscription = new Subscription();

  // Orden, filtro y paginación para compras de proveedor
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;

  filtrosCompras: any = {
    'transaction.person.uuid': { value: '', op: '=', contiene: false }
  };
  showFilterCompras: boolean = false;
  ordenamiento: any = {
    'transaction.transaction_datetime': 'desc'
  };

  productosExpandido: { [uuid: string]: boolean } = {}; // Estado de expansión de cada compra
  expandirTodo = false;
  // paginadores: { [uuid: string]: Paginador } = {};

  tituloModal: string = '';
  isSubmit = false;
  isEdicion = false;

  iconArrowUp = faArrowUp;
  iconArrowDown = faArrowDown;


  constructor(private _indexService: IndexService, private _swalService: SwalService, private spinner: NgxSpinnerService,
    private _tokenService: TokenService) {
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['proveedor'] && changes['proveedor'].currentValue) {
      this.spinner.show();
      // Si el supplierUuid cambia, actualizamos los filtros y obtenemos las compras
      this.filtrosCompras['transaction.person.uuid'].value = this.proveedor.person.uuid;
      this.obtenerCompras();
      this.obtenerProductos();
    }
  }

  cambiarOrdenamiento(column: string) {
    // si el ordenamiento es asc, lo cambiamos a desc y si es desc, lo cambiamos a sin ordenamiento
    if (this.ordenamiento[column] === 'asc') {
      this.ordenamiento[column] = 'desc';
    } else if (this.ordenamiento[column] === 'desc') {
      this.ordenamiento[column] = 'asc';
    }
    this.obtenerCompras();
  }

  obtenerCompras() {
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = ["transaction.transactionProducts.product.productType",
      "transaction.transactionDocuments",
      "batch"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtrosCompras;

    this.subscription.add(
      this._indexService.getComprasProveedorWithParam(params, this.rol).subscribe({
        next: res => {
          this.compras = res.data;
          this.modificarPaginacion(res);
          this._tokenService.setToken(res.token);
          // this.iniciarPaginadoresProductos();
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

  obtenerProductos() {
    let filtros: any = {
      'transactionProducts.transaction.transactionType.name': { value: 'Compra', op: '=', contiene: false },
      'transactionProducts.transaction.person.uuid': { value: this.proveedor.person.uuid, op: '=', contiene: false }
    }
    let orden: any = {
      'name': 'asc'
    };
    const params: any = {};
    params.order_by = orden;
    params.filters = filtros;
    params.distinct = 'true';
    params.with = [];

    this.subscription.add(
      this._indexService.getProductosTotalesComprados(params, this.rol).subscribe({
        next: res => {
          this.productosTotales = res.data;
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
    if (this.compras.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }

  // iniciarPaginadoresProductos() {
  //   this.compras.forEach(compra => {
  //     if (!this.paginadores[compra.uuid]) {
  //       this.paginadores[compra.uuid] = new Paginador(compra.transaction?.transaction_products?.length);
  //       if (this.paginadores[compra.uuid].totalItems <= this.paginadores[compra.uuid].itemsPerPage) {
  //         this.paginadores[compra.uuid].itemsInPage = this.paginadores[compra.uuid].totalItems;
  //       }
  //     }
  //   });
  // }

  toggleFilter() {
    this.showFilterCompras = !this.showFilterCompras;
    if (!this.showFilterCompras) {
      this.filtrosCompras.account_number = { value: '', op: 'LIKE', contiene: true }
      this.filtrosCompras.alias = { value: '', op: 'LIKE', contiene: true }
      this.filtrosCompras.cbu = { value: '', op: 'LIKE', contiene: true }
      this.obtenerCompras();
    }
  }

  // public onPageChange(uuid: string, pageNum: number): void {
  //   if (this.paginadores[uuid]) {
  //     this.paginadores[uuid].currentPage = pageNum;
  //     // this.paginadores[uuid].itemsInPage = this.paginadores[uuid].itemsPerPage;
  //     this.paginadores[uuid].pageSize = this.paginadores[uuid].itemsPerPage * (pageNum - 1);

  //   }
  // }
  // cambiarPaginacion(uuid: string) {
  //   this.onPageChange(uuid, 1);
  // }

  toggleProductos(data: any) {
    this.productosExpandido[data.uuid] = !this.productosExpandido[data.uuid];
  }

  toggleTodos() {
    this.expandirTodo = !this.expandirTodo;
    this.compras.forEach(compra => {
      this.productosExpandido[compra.uuid] = this.expandirTodo;
    });
  }

  onProductoSeleccionado(productoSeleccionado: any) {
    if (productoSeleccionado) {
      this.filtrosCompras['transaction.transactionProducts.product.uuid'] = { value: productoSeleccionado.uuid, op: '=', contiene: false };
    } else {
      delete this.filtrosCompras['transaction.transactionProducts.product.uuid'];
    }
    this.obtenerCompras();
  }

}
