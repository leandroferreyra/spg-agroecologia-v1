import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
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
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';

@Component({
  selector: 'app-componente-de',
  standalone: true,
  imports: [CommonModule, NgbPaginationModule, NgxSpinnerModule, NgxTippyModule, NgxCustomModalComponent, FormsModule, ReactiveFormsModule,
    NgSelectModule, IconTrashLinesComponent, IconPencilComponent, IconSearchComponent, IconPlusComponent],
  templateUrl: './componente-de.component.html',
  styleUrl: './componente-de.component.css'
})
export class ComponenteDeComponent implements OnInit, OnDestroy {

  @Output() eventProducto = new EventEmitter<any>();

  @Input() producto: any;
  @Input() rol!: string;
  componentes: any[] = [];

  private subscription: Subscription = new Subscription();

  // Orden, filtro y paginación para compras de proveedor
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;

  filtros: any = {
    'product->child_product_uuid': { value: '', op: '=', contiene: false }
  };
  showFilterCompras: boolean = false;
  ordenamiento: any = {
  };

  costoEnDolares: boolean = false;

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
      this.filtros['product->child_product_uuid'].value = this.producto.uuid;
      this.obtenerComponentes();
    }
  }

  obtenerComponentes() {
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = ["parentProduct", "parentProduct.measure", "parentProduct.country", "parentProduct.productType",
      "supplier.person.human", "supplier.person.legalEntity"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getComponentesWithParam(params, this.rol).subscribe({
        next: res => {
          this.componentes = res.data;
          this.modificarPaginacion(res);
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
    if (this.componentes.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }

  getNombreCompletoProveedor(data: any): string {
    if (!data.supplier?.person) return '';
    if (data.supplier.person.human) {
      return data.supplier.person.human.firstname + ' ' + data.supplier.person.human.lastname;
    } else if (data.supplier.person.legal_entity) {
      return data.supplier.person.legal_entity.company_name;
    }
    return '';
  }

  mostrarCantidad(data: any) {
    if (data.parent_product?.measure?.is_integer === 1) {
      return (+data.quantity)?.toFixed(0);
    } else {
      return (+data.quantity)?.toFixed(2);
    }
  }

  mostrarCostoUnitario(data: any) {
    // Si existe data.parent_product.costs.defined_by y su valor es "Compra", devolver data.parent_product.costs.purchase_cost_pesos
    // Si existe data.parent_product.costs.defined_by y su valor es "Producción", devolver data.parent_product.costs.production_cost_pesos
    // Si no existe data.parent_product.costs.defined_by, y existe data.parent_product.costs.purchase_cost_pesos, devolver data.parent_product.costs.purchase_cost_pesos
    // Si no existe data.parent_product.costs.defined_by, y existe data.parent_product.costs.production_cost_pesos, devolver data.parent_product.costs.production_cost_pesos
    // Si no existe data.parent_product.costs.defined_by, y no existe data.parent_product.costs.purchase_cost_pesos, y no existe data.parent_product.costs.production_cost_pesos, devolver null
    const costs = data.parent_product?.costs;
    if (!costs) return null;

    const isUSD = this.costoEnDolares;

    const purchaseCost = isUSD ? costs?.purchase_cost_dollars : costs?.purchase_cost_pesos;
    const productionCost = isUSD ? costs?.production_cost_dollars : costs?.production_cost_pesos;

    if (costs.defined_by === 'Compra' && purchaseCost != null) {
      return (+purchaseCost).toFixed(2);
    }
    if (costs.defined_by === 'Producción' && productionCost != null) {
      return (+productionCost).toFixed(2);
    }
    if (purchaseCost != null) {
      return (+purchaseCost).toFixed(2);
    }
    if (productionCost != null) {
      return (+productionCost).toFixed(2);
    }
    return null;
  }

  mostrarCostoTotal(data: any) {
    const costoUnitario = this.mostrarCostoUnitario(data);
    return costoUnitario ? (+costoUnitario * data.quantity).toFixed(2) : null;
  }

  goToProduct(event: MouseEvent, data: any) {
    this.eventProducto.emit({ data, event });
  }

  getTippyBasedOnCurrency(data: any) {
    const costs = data.parent_product?.costs;
    if (!costs) return null;
    const isUSD = this.costoEnDolares;
    const purchaseCost = isUSD ? costs?.purchase_cost_pesos : costs?.purchase_cost_dollars;
    const productionCost = isUSD ? costs?.production_cost_pesos : costs?.production_cost_dollars;
    const currencySymbol = isUSD ? '$ ' : 'USD ';
    if (costs.defined_by === 'Compra' && purchaseCost != null) {
      return currencySymbol + (+purchaseCost).toFixed(2);
    }
    if (costs.defined_by === 'Producción' && productionCost != null) {
      return currencySymbol + (+productionCost).toFixed(2);
    }
    if (purchaseCost != null) {
      return currencySymbol + (+purchaseCost).toFixed(2);
    }
    if (productionCost != null) {
      return currencySymbol + (+productionCost).toFixed(2);
    }
    return null;

  }

  getTippyTotalBasedOnCurrency(data: any) {
    // if (data.parent_product?.costs?.defined_by === "Compra") {
    //   return 'USD ' + (+data.parent_product?.costs?.purchase_cost_dollars * data.quantity).toFixed(2);
    // } else if (data.parent_product?.costs?.defined_by === "Producción") {
    //   return 'USD ' + (+data.parent_product?.costs?.production_cost_dollars * data.quantity).toFixed(2);
    // } else if (data.parent_product?.costs?.purchase_cost_dollars) {
    //   return 'USD ' + (+data.parent_product.costs.purchase_cost_dollars * data.quantity).toFixed(2);
    // } else if (data.parent_product?.costs?.production_cost_dollars) {
    //   return 'USD ' + (+data.parent_product.costs.production_cost_dollars * data.quantity).toFixed(2);
    // } else {
    //   return null;
    // }

    const costs = data.parent_product?.costs;
    if (!costs) return null;
    const isUSD = this.costoEnDolares;
    const purchaseCost = isUSD ? costs?.purchase_cost_pesos : costs?.purchase_cost_dollars;
    const productionCost = isUSD ? costs?.production_cost_pesos : costs?.production_cost_dollars;
    const currencySymbol = isUSD ? '$ ' : 'USD ';
    if (costs.defined_by === 'Compra' && purchaseCost != null) {
      return currencySymbol + (+purchaseCost * data.quantity).toFixed(2);
    }
    if (costs.defined_by === 'Producción' && productionCost != null) {
      return currencySymbol + (+productionCost * data.quantity).toFixed(2);
    }
    if (purchaseCost != null) {
      return currencySymbol + (+purchaseCost * data.quantity).toFixed(2);
    }
    if (productionCost != null) {
      return currencySymbol + (+productionCost * data.quantity).toFixed(2);
    }
    return null;
  }

  getCurrencySymbol(): string {
    return this.costoEnDolares ? 'USD' : '$';
  }

}
