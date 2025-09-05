import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxCustomModalComponent } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { IndexService } from 'src/app/core/services/index.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconCircleCheckComponent } from 'src/app/shared/icon/icon-circle-check';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';

@Component({
  selector: 'app-stocks',
  standalone: true,
  imports: [CommonModule, NgbPaginationModule, NgxSpinnerModule, NgxTippyModule, NgxCustomModalComponent, FormsModule, ReactiveFormsModule,
    NgSelectModule, IconTrashLinesComponent, IconPencilComponent, IconSearchComponent, IconPlusComponent, IconCircleCheckComponent],
  templateUrl: './stocks.component.html',
  styleUrl: './stocks.component.css'
})
export class StocksComponent implements OnInit, OnDestroy {

  @Input() producto: any;
  @Input() rol!: string;
  private subscription: Subscription = new Subscription();

  stocksCompra: any[] = [];
  stocksProduccion: any[] = [];
  mostrarAgotados: boolean = true;


  // Orden, filtro y paginación para stock de producción
  MAX_ITEMS_PER_PAGE_produccion = 10;
  currentPage_produccion = 1;
  last_page_produccion = 1;
  itemsPerPage_produccion = this.MAX_ITEMS_PER_PAGE_produccion;
  itemsInPage_produccion = this.itemsPerPage_produccion;
  pageSize_produccion: number = 0;
  total_rows_produccion: number = 0;
  filtros_produccion: any = {
    'product.uuid': { value: '', op: '=', contiene: false },
    'batch.productions.productionStates.possibleProductionState.name': { value: 'Liberado', op: '=', contiene: false },
    'batch.productions.productionStates.datetime_to': { value: 'null', op: '=', contiene: false },
  };
  ordenamiento_produccion: any = {
  };

  // Orden, filtro y paginación para stock de compras
  MAX_ITEMS_PER_PAGE_compras = 10;
  currentPage_compras = 1;
  last_page_compras = 1;
  itemsPerPage_compras = this.MAX_ITEMS_PER_PAGE_compras;
  itemsInPage_compras = this.itemsPerPage_compras;
  pageSize_compras: number = 0;
  total_rows_compras: number = 0;
  filtros_compras: any = {
    'product.uuid': { value: '', op: '=', contiene: false }
  };
  ordenamiento_compras: any = {
  };

  isSubmit = false;

  constructor(private _indexService: IndexService, private _swalService: SwalService, private spinner: NgxSpinnerService,
    private _tokenService: TokenService) {

  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['producto'] && changes['producto'].currentValue) {
      this.spinner.show();
      // Si el producto cambia, actualizamos los filtros y obtenemos los componentes
      this.filtros_produccion['product.uuid'].value = this.producto.uuid;
      this.filtros_compras['product.uuid'].value = this.producto.uuid;
      this.obtenerStocksProducciones();
      this.obtenerStocksCompras();
    }
  }

  obtenerStocksProducciones() {
    const params: any = {};
    params.with = ['batch.productions.currentState', 'product.productType', 'product.measure', 'location.location.location.location'];
    params.paging = this.itemsPerPage_produccion;
    params.page = this.currentPage_produccion;
    params.order_by = this.ordenamiento_produccion;
    params.filters = this.filtros_produccion;

    this.subscription.add(
      this._indexService.getStocksWithParam(params, this.rol).subscribe({
        next: res => {
          this.stocksProduccion = res.data;
          this.modificarPaginacionProduccion(res);
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

  obtenerStocksCompras() {
    const params: any = {};
    params.with = ["batch.purchases.transaction", "product.measure", "product.productType", "location.location.location.location"];
    params.paging = this.itemsPerPage_compras;
    params.page = this.currentPage_compras;
    params.order_by = this.ordenamiento_compras;
    params.filters = this.filtros_compras;

    this.subscription.add(
      this._indexService.getStocksForComprasWithParam(params, this.rol).subscribe({
        next: res => {
          this.stocksCompra = res.data;
          // console.log("🚀 ~ StocksComponent ~ obtenerStocksCompras ~ this.stocksCompra:", this.stocksCompra)
          this.modificarPaginacionCompras(res);
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

  isAgotado(data: any) {
    return +data.available_amount === 0 && +data.reserved_amount === 0 && +data.samples_amount === 0 && +data.observed_amount === 0;
  }

  modificarPaginacionProduccion(res: any) {
    this.total_rows_produccion = res.meta.total;
    this.last_page_produccion = res.meta.last_page;
    if (this.stocksProduccion.length <= this.itemsPerPage_produccion) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage_produccion = this.total_rows_produccion;
      } else {
        this.itemsInPage_produccion = this.currentPage_produccion * this.itemsPerPage_produccion;
      }
    }
  }

  modificarPaginacionCompras(res: any) {
    this.total_rows_compras = res.meta.total;
    this.last_page_compras = res.meta.last_page;
    if (this.stocksCompra.length <= this.itemsPerPage_compras) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage_compras = this.total_rows_compras;
      } else {
        this.itemsInPage_compras = this.currentPage_compras * this.itemsPerPage_compras;
      }
    }
  }

  getLote(data: any) {
    if (data.batch === null && data.product?.product_type.stock_controlled === 0) {
      return 'Sin control de stock';
    }
    if (data.batch === null && data.product?.product_type.stock_controlled === 1) {
      return 'Lote único';
    }
    return data.batch?.batch_identification;
  }

  getStock(data: any, stock: any) {
    if (stock === null) {
      return '';
    }
    if (data.product.measure?.is_integer === 1) {
      return (+stock)?.toFixed(0);
    } else {
      return (+stock)?.toFixed(2);
    }
  }

  getLocation(data: any): string[] {
    if (!data.location) return [];
    const names: string[] = [];

    if (data.location.location) {
      names.push(...this.getLocation(data.location));
    }
    names.push(data.location.name);
    return names;
  }

  formatFecha(fechaStr: string): string {
    if (!fechaStr) return '-';
    const d = new Date(fechaStr);
    const pad = (n: number) => n.toString().padStart(2, '0');

    const dia = pad(d.getDate());
    const mes = pad(d.getMonth() + 1);
    const año = d.getFullYear();

    const horas = pad(d.getHours());
    const mins = pad(d.getMinutes());
    const segs = pad(d.getSeconds());

    return `${dia}-${mes}-${año} ${horas}:${mins}:${segs}`;
  }

}
