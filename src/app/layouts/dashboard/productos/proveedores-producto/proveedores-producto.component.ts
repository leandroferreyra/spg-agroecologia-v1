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

@Component({
  selector: 'app-proveedores-producto',
  standalone: true,
  imports: [CommonModule, NgbPaginationModule, NgxSpinnerModule, NgxTippyModule, NgxCustomModalComponent, FormsModule, ReactiveFormsModule,
    NgSelectModule],
  templateUrl: './proveedores-producto.component.html',
  styleUrl: './proveedores-producto.component.css'
})
export class ProveedoresProductoComponent implements OnInit, OnDestroy {

  @Input() producto: any;
  @Input() rol!: string;
  proveedores: any[] = [];

  private subscription: Subscription = new Subscription();

  // Orden, filtro y paginación para compras de proveedor
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;

  filtros: any = {};
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
      this.obtenerProveedores();
    }
  }

  obtenerProveedores() {
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = ["suppliers", "suppliers.person","suppliers.person.human", "suppliers.person.legalEntity"];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getProovedoresByProductoWithParam(params, this.rol, this.producto.uuid).subscribe({
        next: res => {
          this.proveedores = res.data.suppliers;
          // this.modificarPaginacion(res);
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

  // modificarPaginacion(res: any) {
  //   this.total_rows = res.meta.total;
  //   this.last_page = res.meta.last_page;
  //   if (this.proveedores.length <= this.itemsPerPage) {
  //     if (res.meta?.current_page === res.meta?.last_page) {
  //       this.itemsInPage = this.total_rows;
  //     } else {
  //       this.itemsInPage = this.currentPage * this.itemsPerPage;
  //     }
  //   }
  // }

  getNombreCompletoProveedor(data: any): string {
    if (!data.supplier?.person) return '';
    if (data.supplier.person.human) {
      return data.supplier.person.human.firstname + ' ' + data.supplier.person.human.lastname;
    } else if (data.supplier.person.legal_entity) {
      return data.supplier.person.legal_entity.company_name;
    }
    return '';
  }

}