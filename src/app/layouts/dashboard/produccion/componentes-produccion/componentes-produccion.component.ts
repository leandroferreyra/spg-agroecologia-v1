import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { IndexService } from 'src/app/core/services/index.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';

@Component({
  selector: 'app-componentes-produccion',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule],
  templateUrl: './componentes-produccion.component.html',
  styleUrl: './componentes-produccion.component.css'
})
export class ComponentesProduccionComponent implements OnInit, OnDestroy {

  @Input() produccion: any;
  @Input() rol!: string;
  private subscription: Subscription = new Subscription();

  componentes: any[] = []

  filtros: any = {
    'production_uuid': { value: '', op: '=', contiene: false },
  };
  showFilterCompras: boolean = false;
  ordenamiento: any = {
  };

  // Orden, filtro y paginación para compras de proveedor
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;

  constructor(private spinner: NgxSpinnerService, private _indexService: IndexService, private _tokenService: TokenService,
    private _swalService: SwalService
  ) {

  }

  ngOnInit(): void {

  }
  ngOnDestroy(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['produccion'] && changes['produccion'].currentValue) {
      this.spinner.show();
      // Si la produccion cambia, actualizamos los filtros y obtenemos los componentes
      this.filtros['production_uuid'].value = this.produccion.uuid;
      this.obtenerComponentesProduccion();
    }
  }

  obtenerComponentesProduccion() {
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = ["measure", "stock", "supplier"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getFrozenComponentsWithParam(params, this.rol).subscribe({
        next: res => {
          this.componentes = res.data;
          console.log("🚀 ~ ComponentesProduccionComponent ~ obtenerComponentesProduccion ~ this.componentes:", this.componentes)
          this.modificarPaginacion(res);
          this._tokenService.setToken(res.token);
          // this.obtenerProductosPosibles();
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

}
