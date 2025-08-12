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
    params.with = ["parentProduct", "parentProduct.measure", "parentProduct.productType", "supplier.person.human", "supplier.person.legalEntity"];
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

  goToProduct(event: MouseEvent, data: any) {
    this.eventProducto.emit({ data, event });
  }

}
