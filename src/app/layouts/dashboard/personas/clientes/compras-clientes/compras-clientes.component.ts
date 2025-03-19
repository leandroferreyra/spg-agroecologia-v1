import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { CompraProveedorDTO } from 'src/app/core/models/request/compraProveedorDTO';
import { ComprasProveedorService } from 'src/app/core/services/comprasProveedor.service';
import { IndexService } from 'src/app/core/services/index.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconShoppingCartComponent } from 'src/app/shared/icon/icon-shopping-cart';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-compras-clientes',
  standalone: true,
  imports: [CommonModule, NgbPaginationModule, NgxSpinnerModule, NgxTippyModule, NgxCustomModalComponent, FormsModule, ReactiveFormsModule,
    NgSelectModule, IconTrashLinesComponent, IconPencilComponent, IconSearchComponent, IconPlusComponent, FontAwesomeModule,
    IconShoppingCartComponent
  ],
  templateUrl: './compras-clientes.component.html',
  styleUrl: './compras-clientes.component.css'
})
export class ComprasClientesComponent implements OnInit, OnDestroy {


  @Input() cliente: any;
  @Input() rol!: string;
  compras: any[] = [];
  // monedas: any[] = [];
  // tiposDeCuenta: any[] = [];
  // bancos: any[] = [];

  private subscription: Subscription = new Subscription();

  // Orden, filtro y paginación para cuentas bancarias de proveedor
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;

  filtrosCompras: any = {
    'transactionType.name': { value: '', op: '=', contiene: false },
    'person.uuid': { value: '', op: '=', contiene: false }
  };
  showFilterCompras: boolean = false;
  ordenamiento: any = {
    'transaction_datetime': 'desc'
  };

  compraForm!: FormGroup;
  tituloModal: string = '';
  isSubmit = false;
  isEdicion = false;

  iconArrowUp = faArrowUp;
  iconArrowDown = faArrowDown;

  productosView: any[] = [];
  // Referencia al modal para crear y editar países.
  @ViewChild('modalProductos') modalProductos!: NgxCustomModalComponent;
  modalOptionsProductos: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  // Orden, filtro y paginación para productos de una compra en particular
  MAX_ITEMS_PER_PAGE_productos = 10;
  currentPage_productos = 1;
  itemsPerPage_productos = this.MAX_ITEMS_PER_PAGE;
  itemsInPage_productos = this.itemsPerPage;
  pageSize_productos: number = 0;

  constructor(private _indexService: IndexService, private _swalService: SwalService, private spinner: NgxSpinnerService,
    private _compraService: ComprasProveedorService, private _tokenService: TokenService) {

  }
  ngOnInit(): void {
  }

  ngOnDestroy(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cliente'] && changes['cliente'].currentValue) {
      this.spinner.show();
      // Si el supplierUuid cambia, actualizamos los filtros y obtenemos las compras
      this.filtrosCompras['transactionType.name'].value = 'Venta';
      this.filtrosCompras['person.uuid'].value = this.cliente.person?.uuid;
      this.obtenerCompras();
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
    params.with = ["transactionType", "transactionProducts.product.productType"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtrosCompras;

    this.subscription.add(
      this._indexService.getComprasClientesWithParam(params, this.rol).subscribe({
        next: res => {
          //console.log(res);
          this.compras = res.data;
          this.modificarPaginacion(res);
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


  toggleFilter() {
    this.showFilterCompras = !this.showFilterCompras;
    if (!this.showFilterCompras) {
      this.filtrosCompras.account_number = { value: '', op: 'LIKE', contiene: true }
      this.filtrosCompras.alias = { value: '', op: 'LIKE', contiene: true }
      this.filtrosCompras.cbu = { value: '', op: 'LIKE', contiene: true }
      this.obtenerCompras();
    }
  }

  getTotal(data: any) {
    let total = 0;
    data.transaction_products.forEach((elem: any) => {
      total += (+elem.unit_price) * (+elem.quantity) * (1 + (+elem.product.vat_percent / 100))
    })
    return total.toFixed(2);
  }

  verProductos(data: any) {
    //console.log(data);
    this.productosView = data.transaction_products;
    //console.log(this.productosView);
    if (this.productosView.length <= this.itemsPerPage_productos) {
      this.itemsInPage_productos = this.productosView.length;
    }
    this.modalProductos.options = this.modalOptionsProductos;
    this.modalProductos.open();
  }

  cerrarModalProductos() {
    this.modalProductos.close();
  }

  public onPageChange(pageNum: number): void {
    this.currentPage_productos = pageNum;
    this.pageSize_productos = this.itemsPerPage_productos * (pageNum - 1);
  }
  cambiarPaginacion() {
    this.onPageChange(1);
  }

}
