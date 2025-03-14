import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DataTableModule } from '@bhplugin/ng-datatable';
import { Store } from '@ngrx/store';
import { NgxCustomModalComponent, ModalOptions } from 'ngx-custom-modal';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { Subscription } from 'rxjs';
import { CurrencyDTO } from 'src/app/core/models/request/currencyDTO';
import { CurrenciesService } from 'src/app/core/services/currencies.service';
import { PaisesService } from 'src/app/core/services/paises.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconPencilComponent } from 'src/app/shared/icon/icon-pencil';
import { IconPlusComponent } from 'src/app/shared/icon/icon-plus';
import { IconTrashLinesComponent } from 'src/app/shared/icon/icon-trash-lines';
import Swal from 'sweetalert2';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { IconSearchComponent } from 'src/app/shared/icon/icon-search';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { IndexService } from 'src/app/core/services/index.service';

@Component({
  selector: 'app-listado-monedas',
  standalone: true,
  imports: [CommonModule, NgxCustomModalComponent, FormsModule, ReactiveFormsModule, DataTableModule,
    NgxSpinnerModule, NgxTippyModule, IconPencilComponent, IconPlusComponent, IconTrashLinesComponent,
    FontAwesomeModule, IconSearchComponent, NgbPagination],
  templateUrl: './listado-monedas.component.html',
  styleUrl: './listado-monedas.component.css'
})
export class ListadoMonedasComponent implements OnInit, OnDestroy {

  store: any;
  private subscription: Subscription = new Subscription();

  actual_role: string = '';

  monedas: any[] = [];

  //Paginación
  MAX_ITEMS_PER_PAGE = 10;
  currentPage = 1;
  last_page = 1;
  itemsPerPage = this.MAX_ITEMS_PER_PAGE;
  itemsInPage = this.itemsPerPage;
  pageSize: number = 0;
  total_rows: number = 0;

  // Orden y filtro
  showFilter: boolean = false;
  filtros: any = {
    'name': { value: '', op: 'LIKE', contiene: true },
    'symbol': { value: '', op: 'LIKE', contiene: true }
  };
  ordenamiento: any = {
    'name': 'asc',
    // symbol: 'asc'
  };

  iconArrowUp = faArrowUp;
  iconArrowDown = faArrowDown;

  monedaForm!: FormGroup;
  tituloModal: string = '';
  isSubmit = false;
  isEdicion = false;

  // Referencia al modal para crear y editar países.
  @ViewChild('modalCurrency') modalCurrency!: NgxCustomModalComponent;
  modalOptions: ModalOptions = {
    closeOnOutsideClick: false,
    hideCloseButton: true,
    closeOnEscape: false
  };

  constructor(public storeData: Store<any>, private _indexService: IndexService,
    private _currencyService: CurrenciesService, private spinner: NgxSpinnerService,
    private _tokenService: TokenService, private swalService: SwalService) {
    this.initStore();
  }

  async initStore() {
    this.storeData
      .select((d) => d.index)
      .subscribe((d) => {
        this.actual_role = d.userRole;
      });
  }

  ngOnInit(): void {
    this.spinner.show();
    this.obtenerMonedas();
  }

  obtenerMonedas() {
    // Inicializamos un objeto vacío para los parámetros
    const params: any = {};
    params.with = [];
    params.paging = this.itemsPerPage;
    params.page = this.currentPage;
    params.order_by = this.ordenamiento;
    params.filters = this.filtros;

    this.subscription.add(
      this._indexService.getMonedasWithParam(params, this.actual_role).subscribe({
        next: res => {
          this.monedas = res.data;
          this.modificarPaginacion(res);
          this.spinner.hide();
        },
        error: error => {
          this.spinner.hide();
          console.log(error);
        }
      })
    )
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  openSwalEliminar(moneda: any) {
    console.log(moneda);
    Swal.fire({
      title: '',
      text: `¿Desea eliminar la moneda ${moneda.name}?`,
      icon: 'info',
      confirmButtonText: 'Confirmar',
      showDenyButton: true,
      denyButtonText: 'Cancelar',
      didRender: () => {
        const cancelButton = Swal.getDenyButton();
        if (cancelButton) {
          cancelButton.setAttribute('id', 'back-button-with-border');
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.eliminarMoneda(moneda);
      } else if (result.isDenied) {

      }
    })
  }

  eliminarMoneda(moneda: any) {
    this.spinner.show();
    this.subscription.add(
      this._currencyService.deleteCurrency(moneda.uuid, this.actual_role.toUpperCase()).subscribe({
        next: res => {
          this.obtenerMonedas();
          this._tokenService.setToken(res.token);
          this.spinner.hide();
        },
        error: error => {
          console.error(error);
          this.swalService.toastError('top-right', error.error.message);
          this.spinner.hide();
        }
      })
    )
  }


  openModalNuevaMoneda(type: string, moneda?: any) {
    if (type === 'NEW') {
      this.isEdicion = false;
      this.tituloModal = 'Nueva moneda';
      this.monedaForm = new FormGroup({
        nombre: new FormControl(null, [Validators.required]),
        simbolo: new FormControl(null, [Validators.required]),
      });
    } else {
      // console.log(moneda);
      this.isEdicion = true;
      this.tituloModal = 'Edición moneda';
      this.monedaForm = new FormGroup({
        uuid: new FormControl(moneda?.uuid, []),
        nombre: new FormControl(moneda?.name, [Validators.required]),
        simbolo: new FormControl(moneda?.symbol, [Validators.required])
      });
    }
    this.modalCurrency.options = this.modalOptions;
    this.modalCurrency.open();
  }

  cerrarModal() {
    this.isSubmit = false;
    this.modalCurrency.close();
  }

  confirmarMoneda() {
    this.isSubmit = true;
    if (this.monedaForm.valid) {
      this.spinner.show();
      let moneda = new CurrencyDTO();
      moneda.name = this.monedaForm.get('nombre')?.value;
      moneda.symbol = this.monedaForm.get('simbolo')?.value;
      moneda.actual_role = this.actual_role;
      if (!this.isEdicion) {
        this.subscription.add(
          this._currencyService.saveCurrency(moneda).subscribe({
            next: res => {
              this.obtenerMonedas();
              this.cerrarModal();
              this.swalService.toastSuccess('top-right', res.message);
              this._tokenService.setToken(res.token);
              this.spinner.hide();
            },
            error: error => {
              this.swalService.toastError('top-right', error.error.message);
              console.error(error);
              this.spinner.hide();
            }
          })
        )
      } else {
        this.subscription.add(
          this._currencyService.editCurrency(this.monedaForm.get('uuid')?.value, moneda).subscribe({
            next: res => {
              const index = this.monedas.findIndex(p => p.uuid === (this.monedaForm.get('uuid')?.value));
              if (index !== -1) {
                this.monedas[index] = {
                  ...this.monedas[index],
                  name: this.monedaForm.get('nombre')?.value,
                  symbol: this.monedaForm.get('simbolo')?.value
                };
                this.monedas = [...this.monedas];
              }
              this.cerrarModal();
              this.swalService.toastSuccess('top-right', res.message)
              this._tokenService.setToken(res.token);
              this.spinner.hide();
            },
            error: error => {
              console.error(error);
              this.spinner.hide();
              this.swalService.toastError('top-right', error.error.message);
            }
          })
        )
      }
    }
  }

  cambiarOrdenamiento(column: string) {
    // si el ordenamiento es asc, lo cambiamos a desc y si es desc, lo cambiamos a sin ordenamiento
    if (this.ordenamiento[column] === 'asc') {
      this.ordenamiento[column] = 'desc';
    } else if (this.ordenamiento[column] === 'desc') {
      this.ordenamiento[column] = 'asc';
    }
    this.obtenerMonedas();
  }

  modificarPaginacion(res: any) {
    this.total_rows = res.meta.total;
    this.last_page = res.meta.last_page;
    if (this.monedas.length <= this.itemsPerPage) {
      if (res.meta?.current_page === res.meta?.last_page) {
        this.itemsInPage = this.total_rows;
      } else {
        this.itemsInPage = this.currentPage * this.itemsPerPage;
      }
    }
  }


  toggleFilter() {
    this.showFilter = !this.showFilter;
    if (!this.showFilter) {
      this.filtros = {
        'name': { value: '', op: 'LIKE', contiene: true },
        'symbol': { value: '', op: 'LIKE', contiene: true }
      };
      this.obtenerMonedas();
    }
  }

}
