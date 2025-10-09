import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription, Subject, Observable, catchError, firstValueFrom, map, of } from 'rxjs';
import { IndexService } from 'src/app/core/services/index.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconArrowForwardComponent } from 'src/app/shared/icon/icon-arrow-forward';
import { format } from 'date-fns';
import { TiposCambioService } from 'src/app/core/services/tiposCambio.service';

@Component({
  selector: 'app-compras-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxTippyModule, NgSelectModule, NgbPaginationModule, NgxSpinnerModule, IconArrowForwardComponent],
  templateUrl: './compras-producto.component.html',
  styleUrl: './compras-producto.component.css'
})
export class ComprasProductoComponent implements OnInit, OnDestroy {

  @Input() producto: any;
  @Input() rol!: string;
  compras: any[] = [];

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
    'transaction.transactionProducts.Product.uuid': { value: '', op: '=', contiene: false },
  };
  showFilterCompras: boolean = false;
  ordenamiento: any = {
    'transaction.transaction_datetime': 'desc'
  };

  reemplazoForm!: FormGroup;
  tituloModal: string = '';
  isSubmit = false;
  isEdicion = false;

  // Catalogos
  proveedores: any[] = [];
  productos: any[] = [];
  procesos: any[] = [];

  placeholderCantidad: string = '';

  procesoActivo: any;
  isEdicionProceso: boolean = false;

  productoInput$ = new Subject<string>();
  productos$!: Observable<any[]>;
  loadingProductos = false;

  constructor(private _indexService: IndexService, private _swalService: SwalService, private spinner: NgxSpinnerService,
    private _tokenService: TokenService, private router: Router, private _tiposCambioService: TiposCambioService) {
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['producto'] && changes['producto'].currentValue) {
      this.spinner.show();
      // Si el producto cambia, actualizamos los filtros y obtenemos los componentes
      this.filtros['transaction.transactionProducts.Product.uuid'].value = this.producto.uuid;
      this.obtenerCompras();
    }
  }

  obtenerCompras() {
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = [
      "transaction.currency",
      "transaction.currentState",
      "transaction.person.human",
      "transaction.person.legalEntity",
      "transaction.transactionProducts.product"
    ];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getComprasProveedorWithParam(params, this.rol).subscribe({
        next: res => {
          this.compras = res.data;
          console.log("🚀 ~ ComprasProductoComponent ~ obtenerCompras ~ this.compras:", this.compras)
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
    if (this.compras.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }

  getNombreProveedor(data: any): { value: string; id: string } {
    if (!data) return { value: '', id: '' };

    let value = '';
    let id = '';

    if (data.human) {
      const nombre = data.human?.firstname ?? '';
      const apellido = data.human?.lastname ?? '';
      value = `${nombre} ${apellido}`.trim();
      id = data.human?.uuid;
    } else if (data.legal_entity) {
      value = data.legal_entity?.company_name ?? '';
      id = data.legal_entity?.uuid;
    }

    return { value, id };
  }

  irAlProveedor(event: MouseEvent, uuid: any) {
    const baseUrl = window.location.origin + window.location.pathname;
    const urlTree = this.router.createUrlTree([`/dashboard/proveedores/${uuid}`]);
    const url = this.router.serializeUrl(urlTree);
    if (event.ctrlKey || event.metaKey) {
      window.open(`${baseUrl}#${url}`, '_blank');
    } else {
      this.router.navigate([`/dashboard/proveedores/${uuid}`]);
    }
  }

  irALaCompra(event: MouseEvent, data: any) {
    const baseUrl = window.location.origin + window.location.pathname;
    const urlTree = this.router.createUrlTree([`/dashboard/compras/${data.uuid}`]);
    const url = this.router.serializeUrl(urlTree);
    if (event.ctrlKey || event.metaKey) {
      window.open(`${baseUrl}#${url}`, '_blank');
    } else {
      this.router.navigate([`/dashboard/compras/${data.uuid}`]);
    }
  }

  convertirFechaConHora(fechaStr: string): string {
    if (!fechaStr) return '';
    const [fecha, hora] = fechaStr.split(' ');
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}-${mes}-${anio} ${hora}`;
  }

  async getPrecioUnitarioActualizado(data: any) {
    // if (data.transaction.currency.name !== 'Pesos') {
    //   return data.transaction.transaction_products[0].unit_price;
    // }
    // let valorActualMoneda = await this.getTipoCambioPorFechaPromise(new Date(), data.transaction.currency.uuid);
    // let valorDolarTransaction = await this.getTipoCambioPorFechaPromise(data.transaction.transaction_datetime, data.transaction.currency.uuid);
    // if (valorActualMoneda !== null && valorDolarTransaction !== null) {
    //   return valorActualMoneda * data.transaction.transaction_products[0].unit_price / valorDolarTransaction;
    // }
    // return '';
  }

  async getTipoCambioPorFechaPromise(fecha: any, moneda: any) {
    const fechaFormateada = fecha instanceof Date
      ? format(fecha, 'dd-MM-yyyy')
      : fecha;
    const fechaFinal = this.convertirFechaADateBackend(fechaFormateada);
    const observable$ = this._tiposCambioService
      .getTipoCambioPorFecha(moneda.uuid, fechaFinal, this.rol)
      .pipe(
        map(res => {
          const exchangeRate = res.data;
          if (exchangeRate.length > 0) {
            return exchangeRate[0].rate as number;
          } else {
            return null;
          }
        }),
        catchError(error => {
          this._swalService.toastError('top-right', error.error.message);
          console.error('Error obteniendo tipo de cambio:', error);
          return of(null);
        })
      );

    return firstValueFrom(observable$);
  }

  convertirFechaADateBackend(fechaStr: string): string {
    const fechaNormalizada = fechaStr.replace(/[\/()]/g, '-');
    const [dia, mes, anio] = fechaNormalizada.split('-');
    return `${anio}-${mes}-${dia}`;
  }

}
