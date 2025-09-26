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
import { IconInfoCircleComponent } from 'src/app/shared/icon/icon-info-circle';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';

@Component({
  selector: 'app-faltantes',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule, IconPlusComponent, NgSelectModule, FormsModule, ReactiveFormsModule, NgbPaginationModule,
    NgxTippyModule, NgxCustomModalComponent, NgxTippyModule, IconInfoCircleComponent],
  templateUrl: './faltantes.component.html',
  styleUrl: './faltantes.component.css'
})
export class FaltantesComponent implements OnInit, OnDestroy {

  @Input() produccion: any;
  @Input() rol!: string;
  private subscription: Subscription = new Subscription();
  @Output() eventBusquedaComponente = new EventEmitter<any>();

  filtros: any = {
  };
  ordenamiento: any = {
    'order': 'asc'
  };

  // Orden, filtro y paginación para compras de proveedor
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;

  faltantes: any[] = [];

  constructor(private _indexService: IndexService, private _tokenService: TokenService, private spinner: NgxSpinnerService, private _swalService: SwalService) {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['produccion'] && changes['produccion'].currentValue) {
      if (this.produccion.current_state?.state?.name !== 'Liberado' && this.produccion.current_state?.state?.name !== 'Terminado') {
        this.obtenerFaltantes();
      }
    }
  }

  ngOnInit(): void {
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  isTerminadoOLiberado() {
    return (this.produccion?.current_state?.state?.name === 'Liberado' || this.produccion?.current_state?.state?.name === 'Terminado');
  }

  obtenerFaltantes() {
    const params: any = {};
    params.with = ["product", "measure", "notReleasedProductions"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getFaltantesWithParam(params, this.produccion.uuid, this.rol).subscribe({
        next: res => {
          this.faltantes = res.data;
          // console.log("🚀 ~ FaltantesComponent ~ obtenerFaltantes ~ this.faltantes:", this.faltantes)
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
    if (this.faltantes.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }

  getCantidadTotal(data: any) {
    let total = +this.produccion.quantity * +data.quantity;
    if (data.measure?.is_integer === 1) {
      return +(total)?.toFixed(0);
    } else {
      return +(total)?.toFixed(2);
    }
  }

  getCantidad(data: any, cantidad: number) {
    if (data.measure?.is_integer === 1) {
      return (+cantidad)?.toFixed(0);
    } else {
      return (+cantidad)?.toFixed(2);
    }
  }

  hasNotReleasedProductions(data: any) {
    return data.not_released_productions?.length > 0;
  }

  buscarComponenteNoliberado(data: any) {
    this.eventBusquedaComponente.emit(data);
  }

}
