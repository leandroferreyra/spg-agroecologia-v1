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
import { PaisDTO } from 'src/app/core/models/request/paisDTO';
import { CatalogoService } from 'src/app/core/services/catalogo.service';
import { CurrenciesService } from 'src/app/core/services/currencies.service';
import { PaisesService } from 'src/app/core/services/paises.service';
import { SwalService } from 'src/app/core/services/swal.service';
import { TokenService } from 'src/app/core/services/token.service';
import { IconModule } from 'src/app/shared/icon/icon.module';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-listado-monedas',
  standalone: true,
  imports: [CommonModule, NgxCustomModalComponent, FormsModule, ReactiveFormsModule, IconModule, DataTableModule, NgxSpinnerModule, NgxTippyModule],
  templateUrl: './listado-monedas.component.html',
  styleUrl: './listado-monedas.component.css'
})
export class ListadoMonedasComponent implements OnInit, OnDestroy {

  store: any;
  private subscription: Subscription = new Subscription();

  actual_role: string = '';
  search = '';
  cols = [
    { field: 'name', title: 'Nombre' },
    { field: 'symbol', title: 'Símbolo' },
    { field: 'action', title: 'Acciones', sort: false }
  ];
  monedas: any[] = [];

  // Paginacion
  paginationInfo: string = 'Mostrando del {0} al {1} de un total de {2} elementos';
  params = {
    current_page: 1,
    pagesize: 10,
    last_page: 0
  };
  total_rows: number = 0;
  pageSizeOptions = [5, 10, 20, 30, 50, 100];

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

  constructor(public storeData: Store<any>,
    private _currencyService: CurrenciesService, private spinner: NgxSpinnerService, private _paisService: PaisesService,
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
    this.obtenerMonedas(this.params.pagesize);
  }

  obtenerMonedas(paging: number, page?: number) {
    this.subscription.add(
      this._currencyService.getCurrencies(this.actual_role, paging, page).subscribe({
        next: res => {
          console.log(res);
          this.monedas = res.data;
          this.total_rows = res.meta.total;
          this.params.last_page = res.meta.last_page;
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
          this.obtenerMonedas(this.params.pagesize, this.params.current_page);
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
              // Esto es para evitar un llamado cada vez que agrega.
              if (this.params.current_page === this.params.last_page) {
                this.monedas = [...this.monedas, res.data];
              }
              this.total_rows += 1;
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

  changeServer(data: any) {
    console.log(data);
    this.params.current_page = data.current_page;
    this.params.pagesize = data.pagesize;
    if (data.change_type === 'search') {
      this.obtenerMonedasWithNameFilter(data.pagesize, data.search);
    } else if (data.change_type === 'sort') {
      this.obtenerMonedasWithOrder(data.pagesize, data.sort_column, data.sort_direction);
    } else {
      this.obtenerMonedas(data.pagesize, data.current_page);
    }
  }

  obtenerMonedasWithNameFilter(paging: number, filter: string) {
    this.subscription.add(
      this._currencyService.getCurrenciesWithNameFilter(this.actual_role, paging, filter).subscribe({
        next: res => {
          this.monedas = res.data;
          this.total_rows = res.meta.total;
          this.params.last_page = res.meta.last_page;
          this.spinner.hide();
        },
        error: error => {
          this.spinner.hide();
          console.log(error);
        }
      })
    )
  }

  obtenerMonedasWithOrder(paging: number, column: string, direction: string) {
    this.subscription.add(
      this._currencyService.getCurrenciesWithOrder(this.actual_role, paging, column, direction).subscribe({
        next: res => {
          this.monedas = res.data;
          this.total_rows = res.meta.total;
          this.params.last_page = res.meta.last_page;
          this.spinner.hide();
        },
        error: error => {
          this.spinner.hide();
          console.log(error);
        }
      })
    )
  }

}
