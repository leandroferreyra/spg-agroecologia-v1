import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxCustomModalComponent } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { ComprasProveedorService } from 'src/app/core/services/comprasProveedor.service';
import { IndexService } from 'src/app/core/services/index.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';

@Component({
  selector: 'app-productos-en-posesion',
  standalone: true,
  imports: [CommonModule, NgbPaginationModule, NgxSpinnerModule, NgxTippyModule, NgxCustomModalComponent, FormsModule, ReactiveFormsModule,
    NgSelectModule, IconTrashLinesComponent, IconPencilComponent, IconSearchComponent, IconPlusComponent, FontAwesomeModule
  ],
  templateUrl: './productos-en-posesion.component.html',
  styleUrl: './productos-en-posesion.component.css'
})
export class ProductosEnPosesionComponent implements OnInit, OnDestroy {


  @Input() cliente: any;
  @Input() rol!: string;
  productos: any[] = [];

  private subscription: Subscription = new Subscription();

  // Orden, filtro y paginación para cuentas bancarias de proveedor
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;

  filtros: any = {
    'owners.customer.person.uuid': { value: '', op: '=', contiene: false }
  };
  showFilterCompras: boolean = false;
  ordenamiento: any = {
    'owners.datetime_from"': 'asc'
  };

  tituloModal: string = '';
  isSubmit = false;
  isEdicion = false;

  iconArrowUp = faArrowUp;
  iconArrowDown = faArrowDown;

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
      this.filtros['owners.customer.person.uuid'].value = this.cliente.person?.uuid;
      this.obtenerProductosEnPosesion();
    }
  }

  cambiarOrdenamiento(column: string) {
    // si el ordenamiento es asc, lo cambiamos a desc y si es desc, lo cambiamos a sin ordenamiento
    if (this.ordenamiento[column] === 'asc') {
      this.ordenamiento[column] = 'desc';
    } else if (this.ordenamiento[column] === 'desc') {
      this.ordenamiento[column] = 'asc';
    }
    this.obtenerProductosEnPosesion();
  }

  obtenerProductosEnPosesion() {
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = ["saleProducts.transactionProduct.product.productType",
      "saleProducts.transactionProduct.product.productCategory"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getProductosEnPosesionWithParam(params, this.rol).subscribe({
        next: res => {
          console.log(res.data);
          this.productos = res.data;
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
    if (this.productos.length <= this.itemsPerPage) {
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
      this.filtros.account_number = { value: '', op: 'LIKE', contiene: true }
      this.filtros.alias = { value: '', op: 'LIKE', contiene: true }
      this.filtros.cbu = { value: '', op: 'LIKE', contiene: true }
      this.obtenerProductosEnPosesion();
    }
  }

}
